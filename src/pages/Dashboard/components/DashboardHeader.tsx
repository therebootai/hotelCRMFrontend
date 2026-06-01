import { FiChevronLeft, FiChevronRight, FiPlus } from 'react-icons/fi';

const DashboardHeader = () => {
  return (
    <div className="flex items-center justify-between w-full">
      
      {/* Date Filter Control - Uses btn-primary with opacity hover for the chevrons */}
      <div className="btn-primary w-45 h-11.5 flex items-center justify-between px-3 shrink-0">
        <button className="text-white opacity-70 hover:opacity-100 transition-opacity flex items-center justify-center">
          <FiChevronLeft size={18} strokeWidth={2.5} />
        </button>
        
        <h4 className="text-[13px] font-bold text-white">
          Date Filter
        </h4>
        
        <button className="text-white opacity-70 hover:opacity-100 transition-opacity flex items-center justify-center">
          <FiChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Primary Action */}
      <button className="btn-primary flex items-center gap-2 shadow-md shadow-primary/20">
        <FiPlus size={18} />
        <span>New Booking</span>
      </button>

    </div>
  );
};

export default DashboardHeader;