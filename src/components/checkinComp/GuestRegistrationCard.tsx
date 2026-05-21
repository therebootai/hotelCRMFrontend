import React, { useRef, forwardRef, useImperativeHandle } from "react";
import { useReactToPrint } from "react-to-print";

export interface AccompanyingGuest {
  sl: number;
  name: string;
  age: number;
  gender: string;
  idProofType: string;
  idProofNumber: string;
}

export interface Room {
  roomNo: string;
  roomType: string;
  adults: number;
  children: number;
  tariff: number;
  checkIn: string;
  checkOut: string;
  guests?: string[];
}

export interface Vehicle {
  vehicleNo: string;
  vehicleType: string;
  driverName: string;
  driverContact: string;
}

export interface Payment {
  mode: string;
  advanceReceived: number;
  balance: number;
  paidBy: string;
}

export interface Company {
  name: string;
  address: string;
  gstin: string;
  contactPerson: string;
  contactNo: string;
  visitPurpose: string;
}

export interface Guest {
  fullName: string;
  fatherName: string;
  address: string;
  mobile: string;
  email: string;
  idProofType: string;
  idProofNumber: string;
  nationality: string;
  dob: string;
  gender: string;
}

export interface GRCData {
  grcNo: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  noOfNights: number;
  noOfRooms: number;
  guest: Guest;
  company?: Company;
  rooms: Room[];
  accompanyingGuests: AccompanyingGuest[];
  vehicles: Vehicle[];
  payment: Payment;
  preparedBy: string;
  verifiedBy: string;
  remarks: string;
}

export interface GuestRegistrationCardRef {
  exportToPDF: () => void;
}

interface Props {
  data: GRCData;
}

const LabelValueRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex gap-2">
    <span className="text-[9px] font-semibold text-gray-700 w-28 shrink-0">{label}:</span>
    <span className="text-[9px] font-medium text-black">{value || "-"}</span>
  </div>
);

const GuestRegistrationCard = forwardRef<GuestRegistrationCardRef, Props>(
  ({ data }, ref) => {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
      contentRef: printRef,
      documentTitle: `GRC_${data?.grcNo || "document"}`,
    });

    useImperativeHandle(ref, () => ({
      exportToPDF: () => {
        handlePrint();
      },
    }));

    const hasCompany = data?.company?.name && data.company.name.trim() !== "";
    const hasVehicles = data?.vehicles && data.vehicles.length > 0 && data.vehicles.some(v => v.vehicleNo);

    return (
      <>
        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
            body { margin: 0; }
            .print-container { width: 100% !important; }
            .no-print { display: none !important; }
            .print-only { display: block !important; }
          }
        `}</style>

        <div className="flex justify-center p-4 relative ">
          <div
            ref={printRef}
            className="print-container w-[210mm] min-h-[297mm] bg-white border border-gray-400 shadow-lg print:shadow-none print:border-none mx-auto"
            style={{ fontSize: "10px" }}
          >
            {/* Header */}
            <div className="p-3 border-b-2 border-black">
              <div className="flex">
                {/* Left - Logo & Name */}
                <div className="w-1/4 flex flex-col items-center justify-center border-r border-gray-300 pr-3">
                  <div className="w-16 h-16 bg-gray-200 flex items-center justify-center mb-1">
                    <span className="text-[8px] text-gray-500">LOGO</span>
                  </div>
                  <span className="text-[8px] font-bold text-center">RESORT</span>
                </div>

                {/* Center - Resort Info */}
                <div className="w-2/4 px-3 text-center">
                  <h1 className="text-xl font-black tracking-wider text-black">SIDDHARAJ RESORT</h1>
                  <p className="text-[8px] text-gray-600 mt-0.5">Premium Hospitality Experience</p>
                  <p className="text-[8px] text-gray-500 mt-1">
                    123 Resort Avenue, Beach Road, Puri, Odisha - 752001
                  </p>
                  <p className="text-[8px] text-gray-500">
                    📞 +91 98765 43210 | 📧 info@siddhrajaresort.com | 🌐 www.siddhrajaresort.com
                  </p>
                </div>

                {/* Right - GRC Info Box */}
                <div className="w-1/4 pl-3">
                  <div className="border-2 border-black p-2">
                    <h2 className="text-[10px] font-black text-center border-b border-black pb-1 mb-2">GUEST REGISTRATION</h2>
                    <div className="space-y-0.5">
                      <div className="flex justify-between">
                        <span className="text-[8px] font-semibold">GRC No:</span>
                        <span className="text-[8px] font-bold">{data?.grcNo || "GRC-000000"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[8px] font-semibold">Check-in:</span>
                        <span className="text-[8px]">{data?.checkInDate || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[8px] font-semibold">Time:</span>
                        <span className="text-[8px]">{data?.checkInTime || "-"}</span>
                      </div>
                      <div className="border-t border-dashed border-gray-400 pt-0.5 mt-1">
                        <div className="flex justify-between">
                          <span className="text-[8px] font-semibold">Check-out:</span>
                          <span className="text-[8px]">{data?.checkOutDate || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[8px] font-semibold">Time:</span>
                          <span className="text-[8px]">{data?.checkOutTime || "-"}</span>
                        </div>
                      </div>
                      <div className="border-t border-dashed border-gray-400 pt-0.5 mt-1">
                        <div className="flex justify-between">
                          <span className="text-[8px] font-semibold">Nights:</span>
                          <span className="text-[8px] font-bold">{data?.noOfNights || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[8px] font-semibold">Rooms:</span>
                          <span className="text-[8px] font-bold">{data?.noOfRooms || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Guest Details */}
            <div className="p-3 border-b border-gray-400">
              <h3 className="text-[10px] font-black text-gray-800 border border-gray-400 px-2 py-1 mb-2">
                1. PRIMARY GUEST / RESPONSIBLE PERSON DETAILS
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                <LabelValueRow label="Full Name" value={data?.guest?.fullName} />
                <LabelValueRow label="Father's Name" value={data?.guest?.fatherName} />
                <LabelValueRow label="Mobile No" value={data?.guest?.mobile} />
                <LabelValueRow label="Address" value={data?.guest?.address} />
                <LabelValueRow label="Email" value={data?.guest?.email} />
                <LabelValueRow label="ID Proof Type" value={data?.guest?.idProofType} />
                <LabelValueRow label="ID Proof No" value={data?.guest?.idProofNumber} />
                <LabelValueRow label="Nationality" value={data?.guest?.nationality} />
                <LabelValueRow label="Date of Birth" value={data?.guest?.dob} />
              </div>
            </div>

            {/* Company Details - Conditional */}
            {hasCompany && (
              <div className="p-3 border-b border-gray-400">
                <h3 className="text-[10px] font-black text-gray-800 border border-gray-400 px-2 py-1 mb-2">
                  2. COMPANY DETAILS (IF APPLICABLE)
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                  <LabelValueRow label="Company Name" value={data.company?.name} />
                  <LabelValueRow label="GSTIN" value={data.company?.gstin} />
                  <LabelValueRow label="Contact Person" value={data.company?.contactPerson} />
                  <LabelValueRow label="Company Address" value={data.company?.address} />
                  <LabelValueRow label="Contact No" value={data.company?.contactNo} />
                  <LabelValueRow label="Purpose of Visit" value={data.company?.visitPurpose} />
                </div>
              </div>
            )}

            {/* Room Details */}
            <div className="p-3 border-b border-gray-400">
              <h3 className="text-[10px] font-black text-gray-800 border border-gray-400 px-2 py-1 mb-2">
                3. ROOM DETAILS
              </h3>
              <table className="w-full border border-gray-400 text-[9px]">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-400">
                    <th className="border-r border-gray-400 px-1 py-1 font-semibold text-center w-10">Room</th>
                    <th className="border-r border-gray-400 px-1 py-1 font-semibold text-center w-14">Type</th>
                    <th className="border-r border-gray-400 px-1 py-1 font-semibold text-center w-20">Guests</th>
                    <th className="border-r border-gray-400 px-1 py-1 font-semibold text-center w-14">Tariff/Night</th>
                    <th className="border-r border-gray-400 px-1 py-1 font-semibold text-center w-18">Check-in</th>
                    <th className="px-1 py-1 font-semibold text-center w-18">Check-out</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.rooms?.map((room, idx) => (
                    <tr key={idx} className="border-b border-gray-300">
                      <td className="border-r border-gray-300 px-1 py-1 text-center font-medium">{room.roomNo}</td>
                      <td className="border-r border-gray-300 px-1 py-1 text-center">{room.roomType}</td>
                      <td className="border-r border-gray-300 px-1 py-1 text-center">
                        <div className="text-[8px] leading-tight">
                          {room.guests && room.guests.length > 0
                            ? room.guests.join(", ")
                            : `${room.adults || 0} Adult${room.adults !== 1 ? "s" : ""}`}
                        </div>
                      </td>
                      <td className="border-r border-gray-300 px-1 py-1 text-center">₹{room.tariff?.toLocaleString()}</td>
                      <td className="border-r border-gray-300 px-1 py-1 text-center">{room.checkIn}</td>
                      <td className="px-1 py-1 text-center">{room.checkOut}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[8px] text-gray-600 italic mt-1 px-1">
                Note: I / We have received the room in good condition and agree to inform the reception of any damage / loss.
              </p>
            </div>

            {/* Accompanying Guests */}
            <div className="p-3 border-b border-gray-400">
              <h3 className="text-[10px] font-black text-gray-800 border border-gray-400 px-2 py-1 mb-2">
                4. ACCOMPANYING GUESTS
              </h3>
              <table className="w-full border border-gray-400 text-[9px]">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-400">
                    <th className="border-r border-gray-400 px-1 py-1 font-semibold text-center w-8">Sl.</th>
                    <th className="border-r border-gray-400 px-1 py-1 font-semibold text-center">Name</th>
                    <th className="border-r border-gray-400 px-1 py-1 font-semibold text-center w-10">Age</th>
                    <th className="border-r border-gray-400 px-1 py-1 font-semibold text-center w-12">Gender</th>
                    <th className="border-r border-gray-400 px-1 py-1 font-semibold text-center">ID Proof Type</th>
                    <th className="px-1 py-1 font-semibold text-center">ID Proof Number</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.accompanyingGuests?.length > 0 ? (
                    data.accompanyingGuests.map((guest, idx) => (
                      <tr key={idx} className="border-b border-gray-300">
                        <td className="border-r border-gray-300 px-1 py-1 text-center">{guest.sl}</td>
                        <td className="border-r border-gray-300 px-1 py-1">{guest.name}</td>
                        <td className="border-r border-gray-300 px-1 py-1 text-center">{guest.age}</td>
                        <td className="border-r border-gray-300 px-1 py-1 text-center">{guest.gender}</td>
                        <td className="border-r border-gray-300 px-1 py-1 text-center">{guest.idProofType}</td>
                        <td className="px-1 py-1 text-center">{guest.idProofNumber}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-1 py-2 text-center text-gray-400 italic">No accompanying guests</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Vehicle Details - Conditional */}
            {hasVehicles && (
              <div className="p-3 border-b border-gray-400">
                <h3 className="text-[10px] font-black text-gray-800 border border-gray-400 px-2 py-1 mb-2">
                  5. VEHICLE DETAILS (OPTIONAL)
                </h3>
                <table className="w-full border border-gray-400 text-[9px]">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-400">
                      <th className="border-r border-gray-400 px-1 py-1 font-semibold text-center">Vehicle No.</th>
                      <th className="border-r border-gray-400 px-1 py-1 font-semibold text-center">Vehicle Type</th>
                      <th className="border-r border-gray-400 px-1 py-1 font-semibold text-center">Driver Name</th>
                      <th className="px-1 py-1 font-semibold text-center">Contact No.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.vehicles.filter(v => v.vehicleNo).map((vehicle, idx) => (
                      <tr key={idx} className="border-b border-gray-300">
                        <td className="border-r border-gray-300 px-1 py-1 text-center font-medium">{vehicle.vehicleNo}</td>
                        <td className="border-r border-gray-300 px-1 py-1 text-center">{vehicle.vehicleType}</td>
                        <td className="border-r border-gray-300 px-1 py-1 text-center">{vehicle.driverName}</td>
                        <td className="px-1 py-1 text-center">{vehicle.driverContact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Payment Details */}
            <div className="p-3 border-b border-gray-400">
              <h3 className="text-[10px] font-black text-gray-800 border border-gray-400 px-2 py-1 mb-2">
                6. PAYMENT DETAILS
              </h3>
              <div className="grid grid-cols-4 gap-2">
                <div className="border border-gray-400 p-2 text-center">
                  <span className="text-[8px] font-semibold text-gray-500 block">Payment Mode</span>
                  <span className="text-[10px] font-bold">{data?.payment?.mode || "-"}</span>
                </div>
                <div className="border border-gray-400 p-2 text-center">
                  <span className="text-[8px] font-semibold text-gray-500 block">Advance Received</span>
                  <span className="text-[10px] font-bold">₹{data?.payment?.advanceReceived?.toLocaleString() || 0}</span>
                </div>
                <div className="border border-gray-400 p-2 text-center">
                  <span className="text-[8px] font-semibold text-gray-500 block">Balance / Due</span>
                  <span className="text-[10px] font-bold">₹{data?.payment?.balance?.toLocaleString() || 0}</span>
                </div>
                <div className="border border-gray-400 p-2 text-center">
                  <span className="text-[8px] font-semibold text-gray-500 block">Company / Self Paid</span>
                  <span className="text-[10px] font-bold">{data?.payment?.paidBy || "-"}</span>
                </div>
              </div>
            </div>

            {/* Terms Section */}
            <div className="p-3 border-b border-gray-400">
              <h3 className="text-[10px] font-black text-gray-800 border border-gray-400 px-2 py-1 mb-2">TERMS & CONDITIONS</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[8px]">
                <div className="flex gap-1">
                  <span>•</span>
                  <span>Check-out time is 11:00 AM. Late checkout subject to availability.</span>
                </div>
                <div className="flex gap-1">
                  <span>•</span>
                  <span>Valid ID proof (Aadhar/Passport/Driving License) mandatory.</span>
                </div>
                <div className="flex gap-1">
                  <span>•</span>
                  <span>Smoking strictly prohibited in rooms and public areas.</span>
                </div>
                <div className="flex gap-1">
                  <span>•</span>
                  <span>Guest responsible for any damage to hotel property.</span>
                </div>
                <div className="flex gap-1">
                  <span>•</span>
                  <span>Payment to be settled before checkout.</span>
                </div>
                <div className="flex gap-1">
                  <span>•</span>
                  <span>Management reserves right to refuse service.</span>
                </div>
              </div>
            </div>

            {/* Declaration */}
            <div className="p-3 border-b border-gray-400 text-center">
              <p className="text-[9px] italic">
                I / We hereby confirm that the above information is true and correct and agree to abide by the rules and regulations of the hotel.
              </p>
            </div>

            {/* Signature Section */}
            <div className="p-3 border-b border-gray-400">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[9px] font-semibold mb-2">Date</p>
                  <div className="border-b-2 border-dashed border-gray-400 h-8"></div>
                </div>
                <div>
                  <p className="text-[9px] font-semibold mb-2">Signature of Guest</p>
                  <div className="border-b-2 border-dashed border-gray-400 h-8"></div>
                </div>
                <div>
                  <p className="text-[9px] font-semibold mb-2">Signature of Hotel Staff</p>
                  <div className="border-b-2 border-dashed border-gray-400 h-8"></div>
                </div>
              </div>
            </div>

            {/* Hotel Use Only */}
            <div className="p-3">
              <div className="border border-gray-400 p-2">
                <h3 className="text-[9px] font-black text-center border-b border-gray-400 pb-1 mb-2">FOR HOTEL USE ONLY</h3>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <span className="text-[8px] font-semibold block">Prepared By</span>
                    <span className="text-[8px]">{data?.preparedBy || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-semibold block">Verified By</span>
                    <span className="text-[8px]">{data?.verifiedBy || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-semibold block">ID Verified</span>
                    <span className="text-[8px] font-bold">YES / NO</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-semibold block">Remarks</span>
                    <span className="text-[8px]">{data?.remarks || "-"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Message */}
            <div className="bg-gray-800 text-white p-3 text-center">
              <p className="text-[11px] font-black tracking-wider">THANK YOU FOR CHOOSING SIDDHARAJ RESORT</p>
              <p className="text-[9px] mt-0.5">WE WISH YOU A COMFORTABLE STAY!</p>
            </div>
          </div>
        </div>
      </>
    );
  }
);

GuestRegistrationCard.displayName = "GuestRegistrationCard";

export default GuestRegistrationCard;

