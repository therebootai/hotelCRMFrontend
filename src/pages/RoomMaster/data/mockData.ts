
export interface MockRoom {
  _id: string;
  roomNumber: string;
  roomType: { name: string };
  basePrice: number;
  gstId: { percentage: number };
  amenities: { name: string }[];
  status: "Active" | "Maintenance" | "Blocked";
}

export const mockRooms: MockRoom[] = Array.from({ length: 120 }).map((_, i) => {
  const isExecutive = i % 5 === 0;
  const isDeluxe = i % 2 === 0;
  
  return {
    _id: `room_${i + 1}`,
    roomNumber: `${101 + i}`,
    roomType: { 
      name: isExecutive ? "Executive Room" : isDeluxe ? "Deluxe Suite" : "Standard Single" 
    },
    basePrice: isExecutive ? 4200 : isDeluxe ? 2500 : 1200,
    gstId: { 
      percentage: isExecutive ? 18 : isDeluxe ? 12 : 5 
    },
    amenities: isExecutive 
      ? [{ name: "AC" }, { name: "WIFI" }, { name: "BAR" }] 
      : isDeluxe 
        ? [{ name: "AC" }, { name: "TV" }] 
        : [{ name: "WIFI" }],
    status: i % 8 === 0 ? "Maintenance" : "Active",
  };
});