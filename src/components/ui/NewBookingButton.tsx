import { FiPlus } from 'react-icons/fi';

interface NewBookingButtonProps {
 className?: string;
}

const NewBookingButton = ({ className = "" }: NewBookingButtonProps) => {
 return (
 <button className={`btn-primary flex items-center justify-center gap-2 shadow-md shadow-primary/20 ${className}`}>
 <FiPlus size={18} />
 <span>New Booking</span>
 </button>
 );
};

export default NewBookingButton;