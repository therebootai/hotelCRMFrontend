import { FiAlertTriangle } from "react-icons/fi";
import useClickOutside from "../../../hooks/useClickOutside";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading: boolean;
}

const DeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading,
}: DeleteModalProps) => {
  const modalRef = useClickOutside<HTMLDivElement>(() => {
    if (!isLoading) onClose();
  }, isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"></div>

      {/* Modal Box */}
      <div
        ref={modalRef}
        className="bg-card rounded-2xl shadow-modal w-full max-w-[40%] relative z-10 animate-fade-in overflow-hidden flex flex-col"
      >
        <div className="p-6 sm:p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-red-50 text-danger rounded-full flex items-center justify-center mb-6">
            <FiAlertTriangle size={32} />
          </div>

          <h2 className="text-xl font-bold text-text-primary mb-2">{title}</h2>
          <p className="text-sm text-text-secondary leading-relaxed">{message}</p>
        </div>

        {/* Action Footer */}
        <div className="bg-background p-4 sm:px-8 sm:py-5 flex items-center gap-3 border-t border-border mt-auto">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="btn-secondary flex-1 py-2.5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-danger hover:bg-red-600 text-white font-medium rounded-lg flex-1 py-2.5 transition-colors flex justify-center items-center h-[42px]"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              "Yes, Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
