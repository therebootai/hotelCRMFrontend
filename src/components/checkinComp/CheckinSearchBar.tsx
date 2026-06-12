import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../lib/axios";
import { FiSearch } from "react-icons/fi";

/**
 * Search bar used on check‑in pages to find a booking by ID or guest name.
 * It queries `/bookings/search?term=...` and displays a dropdown of results.
 * Selecting a result navigates to the current page with `?bookingId=<id>`.
 */
const CheckinSearchBar: React.FC = () => {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<
    Array<{ id: string; guestName: string }>
  >([]);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const category = searchParams.get("category") || "Room Stay";

  // Debounce the search input – simple timeout implementation
  useEffect(() => {
    if (!term) {
      setResults([]);
      return;
    }
    const handler = setTimeout(async () => {
      try {
        // Updated to use the correct endpoint that supports the `search` query
        const resp = await api.get("/bookings/list", {
          params: { search: term, bookingCategory: category, status: "Pending,Confirmed" },
        });
        // Extract the bookings array (may be nested under .data)
        const bookings = resp.data?.data ?? [];
        const formatted = bookings.map((b: any) => ({
          id: b._id,
          guestName:
            `${b.bookingId}` + // show the bookingId first
              (b.bookingContact?.name ? ` – ${b.bookingContact.name}` : "") ||
            b.customerId?.name ||
            "Unknown Guest",
        }));
        setResults(formatted);
      } catch (err) {
        console.error("Error searching bookings:", err);
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [term]);

  const handleSelect = (id: string) => {
    // Preserve current pathname, replace query with bookingId
    const base = location.pathname;
    navigate(`${base}?bookingId=${id}&category=${encodeURIComponent(category)}`);
    setTerm("");
    setResults([]);
  };

  return (
    <div className="relative ml-4">
      <div className="flex items-center border border-gray-300 rounded-md px-2 py-1 bg-white">
        <FiSearch className="text-gray-500 mr-2" />
        <input
          type="text"
          placeholder="Search booking…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          className="outline-none w-48"
        />
      </div>
      {results.length > 0 && (
        <ul className="absolute left-0 right-0 bg-white border border-t-0 border-gray-300 rounded-b-md max-h-60 overflow-y-auto z-10">
          {results.map((r) => (
            <li
              key={r.id}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(r.id)}
            >
              {r.guestName}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CheckinSearchBar;
