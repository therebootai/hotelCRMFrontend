import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between px-6 py-4 bg-white border-t border-gray-100 3xl:px-8 3xl:py-5.5 4xl:py-7 5xl:py-9 5xl:px-10">
      <div className="text-sm text-gray-500 font-medium 3xl:text-base 4xl:text-lg 5xl:text-xl">
        Showing Page <span className="text-gray-900 font-bold 3xl:text-base 4xl:text-lg 5xl:text-xl">{currentPage}</span> of <span className="text-gray-900 font-bold 3xl:text-base 4xl:text-lg 5xl:text-xl">{totalPages}</span>
      </div>
      <div className="flex gap-2 3xl:gap-3 4xl:gap-4 5xl:gap-5">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all 3xl:p-3.5 3xl:rounded-xl 4xl:p-4.5 5xl:p-5.5"
        >
          <FiChevronLeft size={18} className="3xl:scale-125 4xl:scale-150 5xl:scale-175" />
        </button>
        
        {[...Array(totalPages)].map((_, idx) => (
          <button
            key={idx}
            onClick={() => onPageChange(idx + 1)}
            className={`w-9 h-9 rounded-lg text-sm font-bold transition-all 3xl:w-12 3xl:h-12 3xl:text-base 3xl:rounded-xl 4xl:w-14 4xl:h-14 4xl:text-lg 5xl:w-18 5xl:h-18 5xl:text-xl 5xl:rounded-2xl ${
              currentPage === idx + 1 
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' 
              : 'text-gray-500 hover:bg-gray-50 border border-transparent'
            }`}
          >
            {idx + 1}
          </button>
        ))}

        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all 3xl:p-3.5 3xl:rounded-xl 4xl:p-4.5 5xl:p-5.5"
        >
          <FiChevronRight size={18} className="3xl:scale-125 4xl:scale-150 5xl:scale-175" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;