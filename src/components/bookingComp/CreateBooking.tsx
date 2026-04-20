import React, { useState, useEffect, useRef } from 'react';
import { X, User, Briefcase, Calendar, BedDouble, Info, CreditCard, Clock } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { addDays, addWeeks, addMonths, format } from 'date-fns';
import api from '../../lib/axios';

interface CreateBookingProps {
  onClose: () => void;
}

const CreateBooking: React.FC<CreateBookingProps> = ({ onClose }) => {
  const [bookingType, setBookingType] = useState<'Individual' | 'Corporate'>('Individual');
  const [durationValue, setDurationValue] = useState<string>('');
  const [durationUnit, setDurationUnit] = useState<'days' | 'weeks' | 'months'>('days');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState({
    customerDetails: { name: '', phone: '', email: '', address: '' },
    corporateDetails: { companyName: '', gstNumber: '', contactPerson: '', mobile: '' },
    stayDetails: {
      roomType: '',
      roomId: '',
      checkInDate: '',
      checkOutDate: '',
      adults: 2,
      children: 0,
      pricePerNight: 0
    },
    advanceAmount: 0,
    source: 'Walk-in',
    isDirectCheckIn: false
  });

  const [roomTypes, setRoomTypes] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);


  const updateStayDetails = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      stayDetails: { ...prev.stayDetails, [field]: value }
    }));
  };

  const handleDurationSelect = (val: number, unit: 'days' | 'weeks' | 'months') => {
    setDurationValue(val.toString());
    setShowSuggestions(false);
    
    if (formData.stayDetails.checkInDate) {
      let newCheckout: Date;
      const checkIn = new Date(formData.stayDetails.checkInDate);

      if (unit === 'days') newCheckout = addDays(checkIn, val);
      else if (unit === 'weeks') newCheckout = addWeeks(checkIn, val);
      else newCheckout = addMonths(checkIn, val);

      updateStayDetails('checkOutDate', newCheckout);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Logic: Calculate Checkout Date automatically
  useEffect(() => {
    if (formData.stayDetails.checkInDate && durationValue) {
      const num = parseInt(durationValue);
      if (isNaN(num)) return;

      let newCheckout: Date;
      const checkIn = new Date(formData.stayDetails.checkInDate);

      if (durationUnit === 'days') newCheckout = addDays(checkIn, num);
      else if (durationUnit === 'weeks') newCheckout = addWeeks(checkIn, num);
      else newCheckout = addMonths(checkIn, num);

      updateStayDetails('checkOutDate', newCheckout);
    }
  }, [durationValue, durationUnit, formData.stayDetails.checkInDate]);
  


  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const res = await api.get('/api/room-types?activeOnly=true');
        setRoomTypes(res.data.data);
      } catch (err) { console.error(err); }
    };
    fetchRoomTypes();
  }, []);

  useEffect(() => {
    if (formData.stayDetails.roomType) {
      const fetchRooms = async () => {
        try {
          const res = await api.get(`/api/rooms?status=Active&roomType=${formData.stayDetails.roomType}`);
          setAvailableRooms(res.data.data.rooms);
        } catch (err) { console.error(err); }
      };
      fetchRooms();
    }
  }, [formData.stayDetails.roomType]);

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section as keyof typeof prev] as any, [field]: value }
    }));
  };

  const handleFinalSubmit = async (directCheckIn: boolean) => {
    try {
      const finalPayload = {
        ...formData,
        bookingType,
        isDirectCheckIn: directCheckIn,
        rooms: [formData.stayDetails]
      };
      await api.post('/api/bookings/create', finalPayload);
      alert("Booking Success!");
      onClose();
    } catch (err) {
      alert("Error creating booking");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">New Reservation</h2>
            <p className="text-sm text-gray-500 font-medium">Fill in the guest and stay information below</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-gray-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Guest & Stay Information */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* 1. Toggler & Identity */}
              <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <User className="text-orange-500" size={20} />
                  <h3 className="font-bold text-gray-800">Guest Information</h3>
                </div>

                <div className="flex p-1 bg-gray-100 rounded-lg w-fit">
                  <button 
                    onClick={() => setBookingType('Individual')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-md transition-all ${bookingType === 'Individual' ? 'bg-white shadow-sm text-orange-600 font-bold' : 'text-gray-500'}`}
                  >
                    <User size={18} /> Individual
                  </button>
                  <button 
                    onClick={() => setBookingType('Corporate')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-md transition-all ${bookingType === 'Corporate' ? 'bg-white shadow-sm text-orange-600 font-bold' : 'text-gray-500'}`}
                  >
                    <Briefcase size={18} /> Corporate
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {bookingType === 'Individual' ? (
                    <>
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Full Name</label>
                        <input type="text" placeholder="e.g. Achinta Chakraborty" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-orange-500 transition-all" onChange={(e)=>handleInputChange('customerDetails', 'name', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Mobile Number</label>
                        <input type="text" placeholder="+91 00000 00000" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-orange-500 transition-all" onChange={(e)=>handleInputChange('customerDetails', 'phone', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Email Address</label>
                        <input type="email" placeholder="achinta@example.com" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-orange-500 transition-all" onChange={(e)=>handleInputChange('customerDetails', 'email', e.target.value)} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Company Name</label>
                        <input type="text" placeholder="e.g. Aireido Tech" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-orange-500 transition-all" onChange={(e)=>handleInputChange('corporateDetails', 'companyName', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">GST Number</label>
                        <input type="text" placeholder="19XXXXXXXXXXXXX" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-orange-500 transition-all" onChange={(e)=>handleInputChange('corporateDetails', 'gstNumber', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Contact Person</label>
                        <input type="text" placeholder="Name" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-orange-500 transition-all" onChange={(e)=>handleInputChange('corporateDetails', 'contactPerson', e.target.value)} />
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* 2. Stay Details */}
              <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <BedDouble className="text-orange-500" size={20} />
                  <h3 className="font-bold text-gray-800">Stay & Room Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Room Type</label>
                    <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-orange-500 transition-all" onChange={(e) => handleInputChange('stayDetails', 'roomType', e.target.value)}>
                      <option>Select Type</option>
                      {roomTypes.map((t:any) => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Room Number</label>
                    <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-orange-500 transition-all" onChange={(e) => handleInputChange('stayDetails', 'roomId', e.target.value)}>
                      <option>Select Room</option>
                      {availableRooms.map((r:any) => <option key={r._id} value={r._id}>Room {r.roomNumber}</option>)}
                    </select>
                  </div>
                  <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Check-in Date</label>
          <div className="relative">
            <DatePicker
              selected={formData.stayDetails.checkInDate ? new Date(formData.stayDetails.checkInDate) : null}
              onChange={(date: Date) => updateStayDetails('checkInDate', date)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-orange-500"
              placeholderText="Select Date"
              dateFormat="dd/MM/yyyy"
              minDate={new Date()}
            />
            <Calendar className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={18} />
          </div>
        </div>

        {/* Stay Duration Input (New Advance Feature) */}
<div className="relative" ref={suggestionRef}>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Stay Duration</label>
        <div className="relative">
          <input 
            type="text" 
            inputMode="numeric"
            placeholder="Type duration (e.g. 2)"
            value={durationValue}
            onChange={(e) => {
             const val = e.target.value;
      if (val === '' || /^[0-9\b]+$/.test(val)) {
        setDurationValue(val);
        setShowSuggestions(true);
      }
            }}
            onFocus={() => setShowSuggestions(true)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-orange-500 outline-none pr-10"
          />
          <Clock className="absolute right-3 top-3 text-gray-400" size={18} />
        </div>

        {/* Predictive Suggestions Dropdown */}
        {showSuggestions && durationValue && (
          <div className="absolute top-full left-0 w-full bg-white border border-gray-100 shadow-xl rounded-xl mt-1 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div 
              onClick={() => handleDurationSelect(parseInt(durationValue), 'days')}
              className="p-3 hover:bg-orange-50 cursor-pointer flex justify-between items-center transition-colors group"
            >
              <span className="text-sm font-medium text-gray-700">{durationValue} Days</span>
              <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold">Select</span>
            </div>
            <div 
              onClick={() => handleDurationSelect(parseInt(durationValue), 'weeks')}
              className="p-3 hover:bg-orange-50 cursor-pointer flex justify-between items-center border-t border-gray-50 transition-colors group"
            >
              <span className="text-sm font-medium text-gray-700">{durationValue} Weeks</span>
              <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold">Select</span>
            </div>
            <div 
              onClick={() => handleDurationSelect(parseInt(durationValue), 'months')}
              className="p-3 hover:bg-orange-50 cursor-pointer flex justify-between items-center border-t border-gray-50 transition-colors group"
            >
              <span className="text-sm font-medium text-gray-700">{durationValue} Months</span>
              <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold">Select</span>
            </div>
          </div>
        )}
      </div>
        {/* Check-out Date (Auto Calculated) */}
        <div className="lg:col-span-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Check-out Date (Auto)</label>
          <div className="w-full p-3 bg-orange-50 border border-orange-100 rounded-lg text-orange-700 font-bold flex items-center gap-3">
             <Calendar size={18} />
             {formData.stayDetails.checkOutDate 
                ? format(new Date(formData.stayDetails.checkOutDate), 'PPPP') 
                : "Select duration to calculate..."}
          </div>
        </div>
                </div>
              </section>
            </div>

            {/* Right Column: Summary & Pricing */}
            <div className="lg:col-span-1">
              <div className="sticky top-0 space-y-6">
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="text-orange-500" size={20} />
                    <h3 className="font-bold text-gray-800">Payment & Source</h3>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Advance Paid (₹)</label>
                    <input type="number" placeholder="0.00" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" onChange={(e)=>setFormData({...formData, advanceAmount: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Source</label>
                    <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" onChange={(e)=>setFormData({...formData, source: e.target.value})}>
                      <option value="Walk-in">Walk-in</option>
                      <option value="Phone">Phone</option>
                      <option value="Website">Website</option>
                    </select>
                  </div>
                </section>

                <div className="bg-orange-600 text-white rounded-2xl p-6 shadow-xl shadow-orange-100">
                  <h4 className="flex items-center gap-2 font-bold mb-4 opacity-90"><Calendar size={18} /> Booking Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="opacity-70">Booking Type:</span>
                      <span className="font-bold">{bookingType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="opacity-70">Guest Name:</span>
                      <span className="font-bold">{formData.customerDetails.name || '---'}</span>
                    </div>
                    <div className="h-px bg-white/20 my-4" />
                    <div className="flex justify-between items-end">
                      <span className="text-xs uppercase font-bold opacity-70 tracking-widest">Total Payable</span>
                      <span className="text-3xl font-black">₹{formData.stayDetails.pricePerNight || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-4 bg-white">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-gray-500 font-bold hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => handleFinalSubmit(false)}
            className="px-6 py-2.5 border-2 border-orange-500 text-orange-600 rounded-xl font-bold hover:bg-orange-50 transition-all"
          >
            Confirm Booking
          </button>
          <button 
            onClick={() => handleFinalSubmit(true)}
            className="px-8 py-2.5 bg-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all transform active:scale-95"
          >
            Confirm & Check-in
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateBooking;