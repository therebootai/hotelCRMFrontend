import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../../lib/axios";
import { useQueryParams } from "../../hooks/useQueryParams";
import { useDebounce } from "../../hooks/useDebounce";
import type { CustomerProfile, CustomerDetail, CustomerFormPayload } from "./types";

const extractErrorMessage = (error: unknown): string => {
 const message = (error as { response?: { data?: { message?: string } } })?.response
 ?.data?.message;
 return message || "Failed to save profile";
};

export function useCustomerData() {
 const { getParam, updateFilters, setMultipleParams } = useQueryParams();

 const searchQuery = getParam("query") ?? "";
 const page = Number(getParam("page") ?? "1");
 const debouncedSearch = useDebounce(searchQuery, 300);

 const [customers, setCustomers] = useState<CustomerProfile[]>([]);
 const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
 const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
 const [loadingList, setLoadingList] = useState(false);
 const [loadingDetail, setLoadingDetail] = useState(false);
 const [totalPages, setTotalPages] = useState(1);

 const fetchCustomers = async () => {
 setLoadingList(true);
 try {
 const response = await api.get(
 `/customers?query=${debouncedSearch}&page=${page}&limit=10`,
 );
 if (response.data?.success) {
 const list = response.data.data.customers || [];
 setCustomers(list);
 setTotalPages(response.data.data.pagination?.totalPages || 1);
 if (list.length > 0 && !selectedCustomerId) {
 setSelectedCustomerId(list[0]._id);
 }
 }
 } catch (error) {
 console.error("Error fetching customers list:", error);
 } finally {
 setLoadingList(false);
 }
 };

 const fetchCustomerDetails = async (id: string) => {
 setLoadingDetail(true);
 try {
 const response = await api.get(`/customers/${id}`);
 if (response.data?.success) {
 setSelectedCustomer(response.data.data);
 }
 } catch (error) {
 console.error("Error fetching customer details:", error);
 } finally {
 setLoadingDetail(false);
 }
 };

 useEffect(() => {
 fetchCustomers();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [debouncedSearch, page]);

 useEffect(() => {
 if (selectedCustomerId) {
 fetchCustomerDetails(selectedCustomerId);
 } else {
 setSelectedCustomer(null);
 }
 }, [selectedCustomerId]);

 const setSearchQuery = (q: string) => {
 setMultipleParams({ query: q, page: "1" }, { replace: true });
 };

 const setPage = (p: number) => {
 updateFilters("page", String(p), { replace: true });
 };

 const createCustomer = async (payload: CustomerFormPayload): Promise<boolean> => {
 try {
 const response = await api.post("/customers", payload);
 if (response.data?.success) {
 toast.success("Customer created");
 fetchCustomers();
 return true;
 }
 return false;
 } catch (error) {
 toast.error(extractErrorMessage(error));
 return false;
 }
 };

 const updateCustomer = async (
 id: string,
 payload: CustomerFormPayload,
 ): Promise<boolean> => {
 try {
 const response = await api.put(`/customers/${id}`, payload);
 if (response.data?.success) {
 toast.success("Customer updated");
 fetchCustomers();
 fetchCustomerDetails(id);
 return true;
 }
 return false;
 } catch (error) {
 toast.error(extractErrorMessage(error));
 return false;
 }
 };

 const deleteCustomer = async (id: string): Promise<void> => {
 try {
 const response = await api.delete(`/customers/${id}`);
 if (response.data?.success) {
 toast.success("Customer profile deleted");
 setSelectedCustomerId(null);
 fetchCustomers();
 }
 } catch (error) {
 console.error("Error deleting customer:", error);
 }
 };

 return {
 customers,
 loadingList,
 selectedCustomerId,
 selectCustomer: setSelectedCustomerId,
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
 };
}
