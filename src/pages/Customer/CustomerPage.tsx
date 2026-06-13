import { useState } from "react";
import { FiUsers, FiPlus } from "react-icons/fi";
import { useCustomerData } from "./useCustomerData";
import type { CustomerProfile, CustomerFormPayload } from "./types";
import CustomerTable from "./components/CustomerTable";
import CustomerProfilePanel from "./components/CustomerProfilePanel";
import CustomerFormModal from "./components/CustomerFormModal";

const CustomerPage = () => {
 const {
 customers,
 loadingList,
 selectedCustomerId,
 selectCustomer,
 selectedCustomer,
 loadingDetail,
 searchQuery,
 setSearchQuery,
 page,
 totalPages,
 setPage,
 createCustomer,
 updateCustomer,
 deleteCustomer,
 } = useCustomerData();

 const [modal, setModal] = useState<{
 open: boolean;
 editing: CustomerProfile | null;
 }>({ open: false, editing: null });
 const [isPanelOpen, setIsPanelOpen] = useState(false);

 const handleOpenAdd = () => setModal({ open: true, editing: null });
 const handleOpenEdit = (customer: CustomerProfile) =>
 setModal({ open: true, editing: customer });
 const handleCloseModal = () => setModal({ open: false, editing: null });

 const handleSubmit = async (payload: CustomerFormPayload) => {
 const editingId = modal.editing?._id;
 const ok = editingId
 ? await updateCustomer(editingId, payload)
 : await createCustomer(payload);
 if (ok) handleCloseModal();
 };

 const handleDelete = (id: string) => {
 if (!window.confirm("Are you sure you want to delete this customer profile?"))
 return;
 deleteCustomer(id);
 };

 return (
 <div className="p-8 max-w-7xl mx-auto min-h-0 flex flex-col animate-fade-in">
 {/* Top Header */}
 <div className="flex justify-between items-center mb-6 shrink-0">
 <div>
 <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
 <FiUsers className="text-primary" size={24} />
 Customer Management
 </h1>
 <p className="text-text-secondary text-base">
 Create, search, and view historical stays for repeat guest profile
 loyalty.
 </p>
 </div>
 <button
 onClick={handleOpenAdd}
 className="btn-primary flex items-center gap-1.5 px-4 py-2.5 cursor-pointer"
 >
 <FiPlus size={16} />
 Add Customer
 </button>
 </div>

 {/* Main Container */}
 <div className="flex-1 flex overflow-hidden min-h-0">
 <CustomerTable
 customers={customers}
 loadingList={loadingList}
 searchQuery={searchQuery}
 page={page}
 totalPages={totalPages}
 onSearchChange={setSearchQuery}
 onSelect={(id) => { selectCustomer(id); setIsPanelOpen(true); }}
 onPageChange={setPage}
 />
 </div>

 {/* Slide-over Details Panel */}
 {isPanelOpen && selectedCustomerId && (
   <div className="fixed inset-0 z-40 flex justify-end">
     <div 
       className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
       onClick={() => { setIsPanelOpen(false); selectCustomer(null); }}
     ></div>
     <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-slide-in-right z-50">
       <div className="p-4 bg-slate-50 border-b border-border flex justify-between items-center shrink-0">
         <div className="flex items-center gap-3">
           <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
             <FiUsers size={16} />
           </span>
           <h2 className="text-lg font-bold text-text-primary">Customer Details</h2>
         </div>
         <button onClick={() => { setIsPanelOpen(false); selectCustomer(null); }} className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
           </svg>
         </button>
       </div>
       <div className="flex-1 overflow-y-auto p-6 min-h-0 bg-slate-50">
         <CustomerProfilePanel
           customer={selectedCustomer}
           loadingDetail={loadingDetail}
           onEdit={(c) => { setIsPanelOpen(false); handleOpenEdit(c); }}
           onDelete={(id) => { handleDelete(id); setIsPanelOpen(false); }}
         />
       </div>
     </div>
   </div>
 )}

 {/* Edit/Add Modal */}
 {modal.open && (
 <CustomerFormModal
 editing={modal.editing}
 onClose={handleCloseModal}
 onSubmit={handleSubmit}
 />
 )}
 </div>
 );
};

export default CustomerPage;
