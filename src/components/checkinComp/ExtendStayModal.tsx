import React, { useState, useEffect } from 'react';
import { X, Calendar, Hotel, Layers, IndianRupee, NotebookPen, ArrowRightLeft } from 'lucide-react';
import DatePicker from 'react-datepicker';
import api from '../../lib/axios';


interface ExtendStayModalProps {
  checkIn: any;
  onClose: () => void;
  onSuccess: () => void;
  roomTypes?: any[];

  // only for StayOverview
  prefillRoomId?: string;
  prefillRoomType?: string;
  prefillCheckout?: Date | string;
  triggeredFromOverview?: boolean;
}


const ExtendStayModal = ({   checkIn,
  onClose,
  onSuccess,
  roomTypes,
  prefillRoomId,
  prefillRoomType,
  prefillCheckout,
  triggeredFromOverview = false }: ExtendStayModalProps ) => {
const [newCheckout, setNewCheckout] = useState<Date>(() => {
  if (prefillCheckout) return new Date(prefillCheckout);
  return new Date(checkIn.expectedCheckOutTime);
});

const [selectedRoomType, setSelectedRoomType] = useState(
  prefillRoomType || ""
);
  
  // Current Stay Details
  const currentRoom = checkIn.roomDetails?.[0] || {};
  
  // States for Room Change
  const [isChangingRoom, setIsChangingRoom] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  
  // Pricing & Payments
  const [manualPrice, setManualPrice] = useState(currentRoom.appliedPrice || 0); 
  const [newAdvanceAmount, setNewAdvanceAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [advanceNote, setAdvanceNote] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [fetchingRooms, setFetchingRooms] = useState(false);

  // Fetch rooms only if manager wants to change the room
  useEffect(() => {
    const fetchAvailable = async () => {
      if (!selectedRoomType || !newCheckout) return;
      try {
        setFetchingRooms(true);
        const res = await api.get('/rooms/available', {
          params: {
            roomType: selectedRoomType,
            checkIn: new Date(checkIn.expectedCheckOutTime).toISOString(),
            checkOut: newCheckout.toISOString()
          }
        });
        if (prefillRoomId) {
  const matched = res.data.data.rooms.find(
    (r: any) => r._id === prefillRoomId
  );

  if (matched) {
    setSelectedRoom(matched);
    setManualPrice(matched.basePrice || 0);
  }
}
        setAvailableRooms(res.data.data.rooms || []);
      } catch (err) {
        console.error("Room fetch failed", err);
      } finally {
        setFetchingRooms(false);
      }
    };
    if(isChangingRoom) fetchAvailable();
  }, [selectedRoomType, newCheckout, isChangingRoom]);


  useEffect(() => {
  if (
    triggeredFromOverview &&
    prefillRoomId &&
    prefillRoomId !== currentRoom.roomId
  ) {
    setIsChangingRoom(true);
  }
}, []);

  // Logic: Nights Calculation
const totalNights = Math.max(
  1,
  Math.ceil(
    (newCheckout.getTime() -
      new Date(checkIn.expectedCheckOutTime).getTime()) /
      (1000 * 60 * 60 * 24)
  )
);
  
  // Bill Breakdown
  const extensionCharge = totalNights * manualPrice;
  const previousTotalAdvance = checkIn.totalAdvanceAmount || 0;
  const grandTotalAdvance = previousTotalAdvance + Number(newAdvanceAmount);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await api.patch('/checkin/extend-stay', null, {
        params: {
          checkInId: checkIn._id,
          newExpectedCheckout: newCheckout.toISOString(),
          newRoomId: selectedRoom?._id || currentRoom.roomId,
          appliedPrice: manualPrice,
          roomNumber: selectedRoom?.roomNumber || currentRoom.roomNumber,
          newAdvanceAmount: newAdvanceAmount,
          paymentMode: paymentMode,
          advanceNote: advanceNote || `Extended for ${totalNights} nights`
        }
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert("Extension failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-[650px] rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Extend & Switch Stay</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Guest: {checkIn.guests?.[0]?.name}</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-200 rounded-full transition-all"><X size={24}/></button>
        </div>

        <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* Current Status Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-gray-50 border border-gray-200 rounded-3xl">
              <span className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Current Room</span>
              <p className="text-lg font-black text-gray-700">Room {currentRoom.roomNumber} <span className="text-xs font-bold text-gray-400">({currentRoom.appliedPrice}/night)</span></p>
            </div>
            <div className="p-5 bg-blue-50 border border-blue-100 rounded-3xl">
              <span className="text-[10px] font-black text-blue-400 uppercase mb-1 block">Extension Date</span>
              <DatePicker
                selected={newCheckout}
                onChange={(date: Date) => setNewCheckout(date)}
                minDate={new Date(checkIn.expectedCheckOutTime)}
                className="w-full bg-transparent font-black text-blue-700 outline-none"
              />
            </div>
          </div>

          {/* Room Change Toggle */}
          <div className="space-y-4">
            <button 
              onClick={() => {
                setIsChangingRoom(!isChangingRoom);
                if(isChangingRoom) {
                    setSelectedRoom(null);
                    setManualPrice(currentRoom.appliedPrice);
                }
              }}
              className={`w-full p-4 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-xs tracking-widest transition-all border-2 
                ${isChangingRoom ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}
            >
              <ArrowRightLeft size={18}/> {isChangingRoom ? "Cancel Room Change" : "Switch to Different Room"}
            </button>

            {isChangingRoom && (
              <div className="p-6 bg-indigo-50/50 border-2 border-dashed border-indigo-100 rounded-[2.5rem] space-y-4 animate-in slide-in-from-top-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-400 uppercase ml-2">1. Category</label>
                    <select 
                      value={selectedRoomType}
                      onChange={(e) => setSelectedRoomType(e.target.value)}
                      className="w-full p-4 bg-white border border-indigo-100 rounded-2xl font-bold text-sm outline-none"
                    >
                      <option value="">Choose Type</option>
                      {roomTypes?.map((t: any) => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-400 uppercase ml-2">2. New Room</label>
                    <select 
                      onChange={(e) => {
                        const r = availableRooms.find((rm: any) => rm._id === e.target.value);
                        setSelectedRoom(r);
                        setManualPrice(r?.basePrice || 0);
                      }}
                       value={selectedRoom?._id || ""}
                      className="w-full p-4 bg-white border border-indigo-100 rounded-2xl font-bold text-sm outline-none"
                    >
                      <option value="">{fetchingRooms ? "Searching..." : "Select Number"}</option>
                      {availableRooms.map((r: any) => <option key={r._id} value={r._id}>Room {r.roomNumber} (₹{r.basePrice})</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block mb-2">Adjust Nightly Rate for Extension (₹)</label>
              <div className="relative">
                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                <input 
                  type="number"
                  value={manualPrice}
                  onChange={(e) => setManualPrice(Number(e.target.value))}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-gray-800 outline-none focus:ring-2 ring-gray-200"
                />
              </div>
            </div>
          </div>

          {/* Payment History Section */}
          <div className="p-6 bg-green-50/50 border border-green-100 rounded-[2.5rem] space-y-4">
             <div className="flex justify-between items-center px-2">
                <h3 className="text-xs font-black text-green-700 uppercase">Payment Tracking</h3>
                <span className="text-[10px] font-bold text-green-400 italic">History will be updated</span>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <input 
                  type="number"
                  placeholder="Add Advance Amount"
                  className="p-4 bg-white border border-green-100 rounded-2xl font-black text-green-700 outline-none placeholder:text-green-200"
                  onChange={(e) => setNewAdvanceAmount(Number(e.target.value))}
                />
                <select 
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="p-4 bg-white border border-green-100 rounded-2xl font-bold text-xs text-green-700 outline-none"
                >
                  <option value="Cash">Cash Payment</option>
                  <option value="Online">Online Transfer</option>
                  <option value="Card">Card Swipe</option>
                </select>
             </div>
             <div className="relative">
                <NotebookPen className="absolute left-4 top-1/2 -translate-y-1/2 text-green-300" size={16}/>
                <input 
                  type="text"
                  placeholder="Note (e.g. Paid for extra 2 days suite room)"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-green-100 rounded-2xl text-xs font-medium outline-none"
                  onChange={(e) => setAdvanceNote(e.target.value)}
                />
             </div>
          </div>

          {/* Billing Summary Breakdown */}
          <div className="space-y-4 bg-gray-900 p-8 rounded-[3rem] text-white shadow-xl">
             <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Current Applied Rate</span>
                  <span className="font-bold text-white">₹{currentRoom.appliedPrice}</span>
                </div>
                {isChangingRoom && (
                  <div className="flex justify-between text-indigo-400 italic">
                    <span>New Room Switching Rate</span>
                    <span className="font-bold">₹{manualPrice}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400">
                  <span>Extension Duration</span>
                  <span className="font-bold text-white">{totalNights} Nights</span>
                </div>
                <div className="flex justify-between text-green-400 border-t border-white/10 pt-2">
                  <span>Previous Advance Already Paid</span>
                  <span className="font-bold">₹{previousTotalAdvance}</span>
                </div>
             </div>

             <div className="pt-4 border-t-2 border-dashed border-white/20 flex justify-between items-end">
                <div>
                    <p className="text-[10px] font-black text-orange-400 uppercase">Extension Cost Only</p>
                    <p className="text-3xl font-black text-white tracking-tighter">₹{extensionCharge.toLocaleString()}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-green-400 uppercase">New Total Advance</p>
                    <p className="text-3xl font-black text-green-400 tracking-tighter">₹{grandTotalAdvance.toLocaleString()}</p>
                </div>
             </div>
          </div>

          <button 
            onClick={handleConfirm}
            disabled={loading || (totalNights === 0 && !isChangingRoom)}
            className="w-full py-6 bg-orange-500 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-orange-200 hover:bg-orange-600 transition-all transform active:scale-[0.98] disabled:opacity-30 disabled:grayscale"
          >
            {loading ? "Updating Booking..." : "Confirm & Update Stay"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtendStayModal;