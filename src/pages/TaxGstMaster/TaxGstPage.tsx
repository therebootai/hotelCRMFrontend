import { useState } from "react";
import { FiPlus } from "react-icons/fi";
import TaxGstMaster from "../RoomMaster/components/TaxGstMaster";

export default function TaxGstPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="py-8 page-container max-w-500 mx-auto min-h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-text-primary">
          Tax / GST Master
        </h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center gap-2 px-5 py-2.5"
        >
          <FiPlus size={18} /> Add Tax/GST
        </button>
      </div>

      <TaxGstMaster
        isAddModalOpen={isAddModalOpen}
        setIsAddModalOpen={setIsAddModalOpen}
      />
    </div>
  );
}
