import React from 'react';
import { Plus } from 'lucide-react';

interface NewBookingButtonProps {
  className?: string;
}

const NewBookingButton = ({ className = "" }: NewBookingButtonProps) => {
  return (
    <button className={`btn-primary flex items-center justify-center gap-2 shadow-md shadow-primary/20 ${className}`}>
      <Plus size={18} strokeWidth={2.5} />
      <span>New Booking</span>
    </button>
  );
};

export default NewBookingButton;