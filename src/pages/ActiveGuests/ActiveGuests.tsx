import React, { useState, useEffect } from "react";
import { FiUsers, FiSearch, FiLogOut, FiClock, FiRefreshCw, FiRepeat } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api from "../../lib/axios";

interface ActiveGuest {
  _id: string;
  checkInId: string;
  guests: {
    _id: string;
    name: string;
    mobileNo: string;
    email?: string;
    isPrimary: boolean;
  }[];
  roomDetails: {
    roomId: {
      _id: string;
      roomNumber: string;
      roomType: {
        _id: string;
        name: string;
      };
    };
    roomNumber: string;
    nights: number;
    appliedPrice: number;
    totalRoomCharge: number;
  }[];
  checkInTime: string;
  expectedCheckOutTime: string;
  totalAdvanceAmount: number;
  paymentSummary?: {
    totalPaid: number;
  };
  stayType: string;
  status: string;
}

const ActiveGuests = () => {
  const [guests, setGuests] = useState<ActiveGuest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const fetchActiveGuests = async () => {
    setLoading(true);
    try {
      // Filter for Active status (DB enum: "Active" | "Checked-Out" | "Shifted")
      const response = await api.get(
        `/checkin/list?status=Active&search=${searchTerm}`,
      );
      if (response.data?.success) {
        setGuests(response.data.data.list || []);
      }
    } catch (error) {
      console.error("Error fetching active guests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveGuests();
  }, [searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <FiUsers className="text-primary" size={24} />
            Active Guests
          </h1>
          <p className="text-text-secondary text-sm">
            Real-time tracker of guests currently checked into rooms.
          </p>
        </div>

        <div className="relative w-full max-w-md">
          <FiSearch
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by name, mobile, email..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full bg-white border border-border rounded-xl pl-11 pr-4 py-2.5 text-sm text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
          />
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : guests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guests.map((guest) => {
            const primaryGuest =
              guest.guests?.find((g) => g.isPrimary) || guest.guests?.[0];
            const checkInDate = new Date(guest.checkInTime);
            const checkOutDate = new Date(guest.expectedCheckOutTime);
            const totalPaid =
              guest.paymentSummary?.totalPaid || guest.totalAdvanceAmount || 0;
            const roomsStr = guest.roomDetails
              .map((rd) => `Room ${rd.roomNumber}`)
              .join(", ");

            return (
              <div
                key={guest._id}
                className="bg-white border border-border rounded-2xl p-6 hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full">
                      {roomsStr}
                    </span>
                    <span className="text-xs text-text-secondary font-medium uppercase tracking-wide flex items-center gap-1">
                      <FiClock size={12} />
                      Checked In
                    </span>
                  </div>

                  {/* Guest Info */}
                  <h3 className="font-bold text-text-primary text-base truncate">
                    {primaryGuest?.name || "Unknown Guest"}
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {primaryGuest?.mobileNo}
                  </p>

                  <div className="h-px bg-border my-4" />

                  {/* Booking Dates */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">
                        Arrived
                      </p>
                      <p className="text-xs font-semibold text-text-primary mt-0.5">
                        {checkInDate.toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-[10px] text-text-secondary mt-0.5">
                        {checkInDate.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">
                        Departure
                      </p>
                      <p className="text-xs font-semibold text-text-primary mt-0.5">
                        {checkOutDate.toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-[10px] text-text-secondary mt-0.5">
                        {checkOutDate.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Financial Overview */}
                  <div className="flex justify-between items-center bg-gray-50 rounded-xl p-3 mb-6">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">
                        Advance Paid
                      </p>
                      <p className="text-xs font-bold text-text-primary mt-0.5">
                        ₹{totalPaid}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">
                        Stay Type
                      </p>
                      <p className="text-xs font-bold text-primary mt-0.5">
                        {guest.stayType || "Original"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/billing`)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark transition-colors cursor-pointer"
                  >
                    <FiLogOut size={14} />
                    Checkout Folio
                  </button>
                  <button
                    onClick={() => navigate(`/checkin`)}
                    className="p-2.5 border border-border text-text-secondary hover:text-text-primary rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                    title="Edit checkin"
                  >
                    <FiRepeat size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-border rounded-2xl p-16 text-center shadow-sm ">
          <FiUsers className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-bold text-text-primary mb-1">
            No Active Guests
          </h3>
          <p className="text-text-secondary text-sm">
            There are currently no guests holding a "Checked-In" status in the
            system.
          </p>
        </div>
      )}
    </div>
  );
};

export default ActiveGuests;
