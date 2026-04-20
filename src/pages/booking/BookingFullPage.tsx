import React, { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import CreateBooking from '../../components/bookingComp/CreateBooking';

const BookingFullPage = () => {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <div className='flex flex-col gap-6 p-6 min-h-screen bg-gray-50'>
        <div className='flex flex-row justify-between items-center'>
            <div className='flex flex-col'>
                <div className='text-2xl font-bold text-gray-800 tracking-tight'>Booking Overview</div>
                <div className='text-sm text-gray-500 font-medium'>Live occupancy and timeline view for Oct 14 - Oct 20</div>
            </div>
            <div className='flex flex-row gap-4 items-center'>
                <button 
                  onClick={() => setShowPopup(true)}
                  className='h-[2.8rem] px-6 flex justify-center items-center bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 transition-all rounded-xl text-white font-bold gap-2 shadow-lg shadow-orange-100 active:scale-95'
                >
                  <FaPlus /> New Booking
                </button>
            </div>
        </div>

   
        {showPopup && <CreateBooking onClose={() => setShowPopup(false)} />}
    </div>
  );
}

export default BookingFullPage;