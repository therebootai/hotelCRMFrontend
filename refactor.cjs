const fs = require('fs');

const filePath = 'src/components/bookingComp/EditBookingModal.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Rename Component and update props
content = content.replace(
  /export default function CreateBooking\(\{\s*isOpen,\s*onClose\s*\}\s*:\s*\{\s*isOpen:\s*boolean;\s*onClose:\s*\(\)\s*=>\s*void\s*\}\)\s*\{/,
  `export default function EditBookingModal({ isOpen, onClose, booking, onSuccess }: { isOpen: boolean; onClose: () => void; booking: any; onSuccess?: () => void }) {`
);

// 2. Add useEffect to populate state from booking
const initEffect = `
  useEffect(() => {
    if (isOpen && booking) {
      setBookingCategory(booking.bookingCategory || "Room Stay");
      setBookingType(booking.bookingType || "Individual");
      
      setCustomerForm({
        name: booking.customerId?.name || booking.bookingContact?.name || "",
        email: booking.customerId?.email || booking.bookingContact?.email || "",
        phone: booking.customerId?.phone || booking.bookingContact?.mobile || "",
        gstNumber: booking.customerId?.companyGST || "",
      });

      if (booking.corporateDetails) {
        setCorporateForm({
          companyName: booking.corporateDetails.companyName || "",
          companyGst: booking.corporateDetails.companyGst || "",
          corporateCode: booking.corporateDetails.corporateCode || "",
          negotiatedRate: booking.corporateDetails.negotiatedRate ? String(booking.corporateDetails.negotiatedRate) : "",
        });
      }

      setSourceTab(booking.source || "Direct");
      if (booking.travelAgentInfo) {
        setTravelAgentInfo({
          agentName: booking.travelAgentInfo.agentName || "",
          referenceId: booking.travelAgentInfo.referenceId || "",
        });
      }

      if (booking.vehicleDetails && Array.isArray(booking.vehicleDetails)) {
        setVehicles(booking.vehicleDetails.map((v: any) => ({
          vehicleNumber: v.vehicleNumber || "",
          vehicleModel: v.vehicleModel || "",
          driverName: v.driverName || "",
          driverContact: v.driverContact || "",
        })));
      } else {
        setVehicles([]);
      }

      setPreferences(booking.preferences || []);
      setInternalNotes(booking.internalNotes || "");
      setSpecialRequests(booking.specialRequests || "");
      
      setMealPlan(booking.mealPlan || "EP");

      if (booking.bookingCategory === "Day Access") {
        setAccessPackageId(booking.accessPackageId || "");
        setVisitDate(booking.visitDate ? new Date(booking.visitDate).toISOString().split("T")[0] : "");
        setDayAdults(booking.totalAdults || 1);
        setDayChildren(booking.totalChildren || 0);
      } else {
        if (booking.rooms && booking.rooms.length > 0) {
          // Map existing assigned rooms to selectedRoomTypes for edit UI
          const typesMap = new Map<string, any>();
          booking.rooms.forEach((r: any) => {
            const typeId = r.roomType?._id || r.roomType;
            if (typesMap.has(typeId)) {
              const entry = typesMap.get(typeId);
              entry.count += 1;
              entry.adults += r.adults || 1;
              entry.children += r.children || 0;
            } else {
              typesMap.set(typeId, {
                id: Math.random().toString(36).substr(2, 9),
                roomTypeId: typeId,
                checkInDate: new Date(r.checkInDate).toISOString().split("T")[0],
                checkOutDate: new Date(r.checkOutDate).toISOString().split("T")[0],
                count: 1,
                adults: r.adults || 1,
                children: r.children || 0,
                basePrice: r.pricePerNight || 0
              });
            }
          });
          setSelectedRoomTypes(Array.from(typesMap.values()));
        } else if (booking.roomTypesData) {
          setSelectedRoomTypes(booking.roomTypesData);
        } else {
          setSelectedRoomTypes([{ id: "1", roomTypeId: "", checkInDate: "", checkOutDate: "", count: 1, adults: 1, children: 0, basePrice: "" }]);
        }
      }

      if (booking.addons && Array.isArray(booking.addons)) {
        setAddons(booking.addons.map((a: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          serviceId: a.serviceId || "",
          name: a.name || "",
          price: a.price || 0,
          quantity: a.quantity || 1,
          total: a.total || 0,
        })));
      } else {
        setAddons([]);
      }
    } else {
      // Reset if not open or no booking
    }
  }, [isOpen, booking]);
`;

// Insert after the state declarations (e.g., around line 150)
content = content.replace(
  /(const \[addons, setAddons\] = useState<any\[\]>\(\[\]\);)/,
  `$1\n${initEffect}`
);

// 3. Update the submit handler to use PUT
content = content.replace(
  /await api\.post\("\/bookings", payload\);/,
  `await api.put(\`/bookings/\${booking._id}\`, payload);`
);

// 4. Update the toast messages
content = content.replace(
  /toast\.success\("Booking created successfully!"\);/,
  `toast.success("Booking updated successfully!");`
);
content = content.replace(
  /toast\.error\("Failed to create booking"\);/,
  `toast.error("Failed to update booking");`
);

// 5. Replace "Create Booking" title in UI with "Edit Booking"
content = content.replace(
  /<h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">\s*<Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" \/>\s*Create Booking\s*<\/h2>/,
  `<h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Edit Booking: {booking?.bookingId}
          </h2>`
);

content = content.replace(
  /<button\s+onClick=\{handleSubmit\}\s+disabled=\{loading\}\s+className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600\/20 flex items-center gap-2"\s*>\s*\{loading \? \(\s*<>\s*<Loader2 className="w-4 h-4 animate-spin" \/>\s*Creating\.\.\.\s*<\/>\s*\) : \(\s*<>\s*<CheckCircle className="w-4 h-4" \/>\s*Create Booking\s*<\/>\s*\)\}\s*<\/button>/,
  `<button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Update Booking
              </>
            )}
          </button>`
);

// Call onSuccess if it exists
content = content.replace(
  /onClose\(\);(\s*\} catch \(err)/,
  `onClose();\n      if (onSuccess) onSuccess();$1`
);

// 6. Lock Category and Type UI
const lockUI = `
          {/* Read-only Booking Category & Type */}
          <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Category:</span>
              <span className="font-semibold text-gray-900 dark:text-white bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 rounded-full">{bookingCategory}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Type:</span>
              <span className="font-semibold text-gray-900 dark:text-white bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 rounded-full">{bookingType}</span>
            </div>
          </div>
`;

// Find the section that renders the tabs for category and type, and replace it with lockUI
content = content.replace(
  /\{\/\* Booking Category & Type \*\/\}.*?(?=\{\/\* Customer Details \*\/\})/s,
  `{/* Booking Category & Type */}\n${lockUI}\n\n          `
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Done refactoring EditBookingModal.tsx');
