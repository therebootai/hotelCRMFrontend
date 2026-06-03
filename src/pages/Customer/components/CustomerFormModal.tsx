import { useState } from "react";
import type { FormEvent } from "react";
import useClickOutside from "../../../hooks/useClickOutside";
import type { CustomerProfile, CustomerFormPayload } from "../types";

interface CustomerFormModalProps {
  editing: CustomerProfile | null;
  onClose: () => void;
  onSubmit: (payload: CustomerFormPayload) => void;
}

interface CustomerFormState {
  name: string;
  phone: string;
  email: string;
  address: string;
  companyName: string;
  companyGST: string;
  loyaltyTier: string;
  preferences: string;
  internalNotes: string;
}

const buildInitialForm = (editing: CustomerProfile | null): CustomerFormState => {
  if (!editing) {
    return {
      name: "",
      phone: "",
      email: "",
      address: "",
      companyName: "",
      companyGST: "",
      loyaltyTier: "Bronze",
      preferences: "",
      internalNotes: "",
    };
  }
  return {
    name: editing.name,
    phone: editing.phone,
    email: editing.email || "",
    address: editing.address || "",
    companyName: editing.companyName || "",
    companyGST: editing.companyGST || "",
    loyaltyTier: editing.loyaltyTier || "Bronze",
    preferences: Array.isArray(editing.preferences)
      ? (editing.preferences as string[]).join(", ")
      : Object.entries(editing.preferences || {})
          .filter(([, v]) => v === true)
          .map(([k]) => k)
          .join(", "),
    internalNotes: editing.internalNotes || "",
  };
};

const CustomerFormModal = ({ editing, onClose, onSubmit }: CustomerFormModalProps) => {
  const [formData, setFormData] = useState<CustomerFormState>(() =>
    buildInitialForm(editing),
  );
  const [phoneError, setPhoneError] = useState("");
  const modalRef = useClickOutside<HTMLDivElement>(onClose, true);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({ ...prev, phone: digits }));
    setPhoneError(digits.length > 0 && digits.length < 10 ? "Mobile number must be exactly 10 digits" : "");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (formData.phone.length !== 10) {
      setPhoneError("Mobile number must be exactly 10 digits");
      return;
    }
    onSubmit({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      companyName: formData.companyName,
      companyGST: formData.companyGST,
      loyaltyTier: formData.loyaltyTier,
      internalNotes: formData.internalNotes,
      preferences: formData.preferences
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl w-full sm:w-auto mx-auto p-6 shadow-xl border border-border"
      >
        <h3 className="font-bold text-text-primary text-base mb-4">
          {editing ? "Update Profile" : "Register Guest Profile"}
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-text-secondary">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-text-secondary">
                Mobile Phone *
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                value={formData.phone}
                onChange={handlePhoneChange}
                className={`border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary ${phoneError ? "border-red-400" : "border-border"}`}
              />
              {phoneError && (
                <span className="text-[10px] text-red-500">{phoneError}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-text-secondary">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-text-secondary">
                Loyalty Tier
              </label>
              <select
                value={formData.loyaltyTier}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, loyaltyTier: e.target.value }))
                }
                className="border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Bronze">Bronze</option>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-text-secondary">
                Company Name
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, companyName: e.target.value }))
                }
                className="border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-text-secondary">
                Company GST
              </label>
              <input
                type="text"
                value={formData.companyGST}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, companyGST: e.target.value }))
                }
                className="border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-text-secondary">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
              className="border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-text-secondary">
              Preferences (comma separated tags)
            </label>
            <input
              type="text"
              placeholder="AC required, Higher Floor, Near Elevator"
              value={formData.preferences}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, preferences: e.target.value }))
              }
              className="border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-text-secondary">
              Internal Notes
            </label>
            <textarea
              value={formData.internalNotes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, internalNotes: e.target.value }))
              }
              rows={2}
              className="border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-text-secondary hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary px-4 py-2 text-xs cursor-pointer"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerFormModal;
