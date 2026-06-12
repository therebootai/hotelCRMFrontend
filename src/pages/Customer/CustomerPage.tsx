import { useState } from "react";
import { FiUsers, FiPlus } from "react-icons/fi";
import { useCustomerData } from "./useCustomerData";
import type { CustomerProfile, CustomerFormPayload } from "./types";
import CustomerDirectory from "./components/CustomerDirectory";
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
 <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
 <CustomerDirectory
 customers={customers}
 loadingList={loadingList}
 selectedCustomerId={selectedCustomerId}
 searchQuery={searchQuery}
 page={page}
 totalPages={totalPages}
 onSearchChange={setSearchQuery}
 onSelect={selectCustomer}
 onPageChange={setPage}
 />

 <CustomerProfilePanel
 customer={selectedCustomer}
 loadingDetail={loadingDetail}
 onEdit={handleOpenEdit}
 onDelete={handleDelete}
 />
 </div>

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
