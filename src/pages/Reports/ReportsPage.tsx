import { useState, useEffect } from "react";
import {
  FiBarChart2,
  FiCalendar,
  FiDollarSign,
  FiPercent,
  FiShield,
  FiTrendingUp,
  FiUsers,
  FiFileText,
} from "react-icons/fi";
import api from "../../lib/axios";
import { useQueryParams } from "../../hooks/useQueryParams";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface OccupancyData {
  date: string;
  occupiedRooms: number;
  totalRooms: number;
  occupancyRate: number;
}
interface RevenueData {
  totalRoomRevenue: number;
  totalFacilityRevenue: number;
  totalRestaurantRevenue: number;
  totalExtraServicesRevenue: number;
  totalTaxCollected: number;
  totalGrandTotal: number;
  totalPaid: number;
  totalDue: number;
}
interface BookingData {
  totalBookings: number;
  statusCounts: Record<string, number>;
  sourceCounts: Record<string, number>;
  averageLeadTimeDays: number;
}
interface CustomerData {
  totalCustomers: number;
  totalBookings: number;
  repeatRate: number;
  avgStayNights: number;
  topCustomers: any[];
}
interface GstData {
  period: string;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGST: number;
  invoiceCount: number;
  invoices: any[];
}
interface DueAgingData {
  bucket30: number;
  bucket60: number;
  bucket90: number;
  totalOutstanding: number;
}

type ReportTab =
  | "occupancy"
  | "revenue"
  | "bookings"
  | "customers"
  | "gst"
  | "due-aging";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

const ReportsPage = () => {
  const { getParam, updateFilters } = useQueryParams();

  const activeTab = (getParam("tab") as ReportTab) ?? "occupancy";
  const setActiveTabId = (id: ReportTab) => updateFilters("tab", id);

  const defaultFrom = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  })();
  const dateFrom = getParam("from") ?? defaultFrom;
  const dateTo = getParam("to") ?? new Date().toISOString().slice(0, 10);

  const [loading, setLoading] = useState(false);

  const [occupancy, setOccupancy] = useState<OccupancyData[]>([]);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [bookings, setBookings] = useState<BookingData | null>(null);
  const [customers, setCustomers] = useState<CustomerData | null>(null);
  const [gst, setGst] = useState<GstData | null>(null);
  const [dueAging, setDueAging] = useState<DueAgingData | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = `from=${dateFrom}&to=${dateTo}`;
      const [occRes, revRes, bookRes, custRes, gstRes, dueRes] =
        await Promise.allSettled([
          api.get(`/reports/occupancy?${params}`),
          api.get(`/reports/revenue?${params}`),
          api.get(`/reports/bookings?${params}`),
          api.get(`/reports/customers?${params}`),
          api.get(`/reports/gst-summary?period=${dateTo.slice(0, 7)}`),
          api.get("/reports/due-aging"),
        ]);

      if (occRes.status === "fulfilled" && occRes.value.data?.success)
        setOccupancy(occRes.value.data.data);
      if (revRes.status === "fulfilled" && revRes.value.data?.success)
        setRevenue(revRes.value.data.data);
      if (bookRes.status === "fulfilled" && bookRes.value.data?.success)
        setBookings(bookRes.value.data.data);
      if (custRes.status === "fulfilled" && custRes.value.data?.success)
        setCustomers(custRes.value.data.data);
      if (gstRes.status === "fulfilled" && gstRes.value.data?.success)
        setGst(gstRes.value.data.data);
      if (dueRes.status === "fulfilled" && dueRes.value.data?.success)
        setDueAging(dueRes.value.data.data);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateFrom, dateTo]);

  const kpis = [
    {
      icon: <FiDollarSign size={20} />,
      label: "Total Revenue",
      value: revenue
        ? `₹${Math.round(revenue.totalGrandTotal).toLocaleString()}`
        : "—",
      color: "primary",
      bg: "bg-primary/10",
    },
    {
      icon: <FiPercent size={20} />,
      label: "Avg Occupancy",
      value:
        occupancy.length > 0
          ? `${Math.round(occupancy.reduce((s, r) => s + r.occupancyRate, 0) / occupancy.length)}%`
          : "—",
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      icon: <FiUsers size={20} />,
      label: "Total Bookings",
      value: bookings?.totalBookings?.toLocaleString() ?? "—",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      icon: <FiShield size={20} />,
      label: "GST Collected",
      value: gst ? `₹${Math.round(gst.totalGST).toLocaleString()}` : "—",
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  const tabs: { id: ReportTab; label: string; icon: React.ReactNode }[] = [
    { id: "occupancy", label: "Occupancy", icon: <FiTrendingUp size={14} /> },
    { id: "revenue", label: "Revenue", icon: <FiDollarSign size={14} /> },
    { id: "bookings", label: "Bookings", icon: <FiBarChart2 size={14} /> },
    { id: "customers", label: "Customers", icon: <FiUsers size={14} /> },
    { id: "gst", label: "GST Summary", icon: <FiFileText size={14} /> },
    { id: "due-aging", label: "Due Aging", icon: <FiShield size={14} /> },
  ];

  const sourceChartData = bookings
    ? Object.entries(bookings.sourceCounts || {}).map(([source, count]) => ({
        name: source,
        value: count as number,
      }))
    : [];

  const statusChartData = bookings
    ? Object.entries(bookings.statusCounts || {}).map(([status, count]) => ({
        name: status,
        value: count as number,
      }))
    : [];

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      );
    }

    switch (activeTab) {
      case "occupancy":
        return (
          <div>
            <h3 className="text-sm font-bold text-text-primary mb-4">
              Daily Occupancy Rate
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={occupancy}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  formatter={(val: number) => [`${val}%`, "Occupancy"]}
                  labelFormatter={(l) => `Date: ${l}`}
                />
                <Bar
                  dataKey="occupancyRate"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  name="Occupancy %"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case "revenue":
        return revenue ? (
          <div>
            <h3 className="text-sm font-bold text-text-primary mb-4">
              Revenue Breakdown
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                {
                  label: "Room Revenue",
                  val: revenue.totalRoomRevenue,
                  color: "text-primary",
                },
                {
                  label: "Facility Revenue",
                  val: revenue.totalFacilityRevenue,
                  color: "text-blue-600",
                },
                {
                  label: "Restaurant Revenue",
                  val: revenue.totalRestaurantRevenue,
                  color: "text-green-600",
                },
                {
                  label: "Extra Services",
                  val: revenue.totalExtraServicesRevenue,
                  color: "text-purple-600",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-gray-50 border border-border rounded-xl p-4"
                >
                  <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">
                    {item.label}
                  </p>
                  <p className={`text-lg font-extrabold mt-1 ${item.color}`}>
                    ₹{Math.round(item.val).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 border border-border rounded-xl p-4 text-center">
              <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">
                Total Outstanding
              </p>
              <p className="text-2xl font-extrabold text-danger mt-1">
                ₹{Math.round(revenue.totalDue).toLocaleString()}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-text-secondary text-center py-8">
            No revenue data available
          </p>
        );

      case "bookings":
        return bookings ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-bold text-text-primary mb-3">
                Booking Sources
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={sourceChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {sourceChartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 className="text-xs font-bold text-text-primary mb-3">
                Booking Status
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <p className="text-text-secondary text-center py-8">
            No booking data available
          </p>
        );

      case "customers":
        return customers ? (
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Total Customers", val: customers.totalCustomers },
                { label: "Total Bookings", val: customers.totalBookings },
                { label: "Repeat Rate", val: `${customers.repeatRate}%` },
                { label: "Avg Stay (nights)", val: customers.avgStayNights },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-gray-50 border border-border rounded-xl p-4"
                >
                  <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">
                    {item.label}
                  </p>
                  <p className="text-xl font-extrabold text-text-primary mt-1">
                    {item.val}
                  </p>
                </div>
              ))}
            </div>
            {customers.topCustomers.length > 0 && (
              <div className="bg-white border border-border rounded-xl overflow-hidden">
                <h3 className="text-xs font-bold text-text-primary px-4 py-3 border-b border-border bg-gray-50">
                  Top Customers
                </h3>
                <table className="w-full">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase tracking-wider text-text-secondary border-b border-border">
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Phone</th>
                      <th className="px-4 py-2 text-right pr-4">Bookings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs">
                    {customers.topCustomers.map((c: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2 font-medium">
                          {c.name || "—"}
                        </td>
                        <td className="px-4 py-2 text-text-secondary">
                          {c.phone || "—"}
                        </td>
                        <td className="px-4 py-2 text-right pr-4 font-bold text-primary">
                          {c.bookingCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <p className="text-text-secondary text-center py-8">
            No customer data available
          </p>
        );

      case "gst":
        return gst ? (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                {
                  label: "Taxable Amount",
                  val: gst.taxableAmount,
                  color: "text-text-primary",
                },
                { label: "CGST", val: gst.cgst, color: "text-blue-600" },
                { label: "SGST", val: gst.sgst, color: "text-green-600" },
                { label: "IGST", val: gst.igst, color: "text-purple-600" },
                {
                  label: "Total GST",
                  val: gst.totalGST,
                  color: "text-primary font-extrabold text-xl",
                },
                {
                  label: "Invoices",
                  val: gst.invoiceCount,
                  color: "text-text-primary",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-gray-50 border border-border rounded-xl p-4"
                >
                  <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">
                    {item.label}
                  </p>
                  <p className={`${item.color} mt-1`}>
                    {"color" in item &&
                    item.color === "text-primary font-extrabold text-xl"
                      ? `₹${Math.round(item.val as number).toLocaleString()}`
                      : typeof item.val === "number" &&
                          item.label !== "Invoices"
                        ? `₹${Math.round(item.val).toLocaleString()}`
                        : item.val}
                  </p>
                </div>
              ))}
            </div>
            {gst.invoices.length > 0 && (
              <div className="bg-white border border-border rounded-xl overflow-hidden">
                <h3 className="text-xs font-bold text-text-primary px-4 py-3 border-b border-border bg-gray-50">
                  Invoice Details
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-[10px] font-bold uppercase tracking-wider text-text-secondary border-b border-border">
                        <th className="px-4 py-2 text-left">Invoice</th>
                        <th className="px-4 py-2 text-left">Customer</th>
                        <th className="px-4 py-2 text-right">Taxable</th>
                        <th className="px-4 py-2 text-right">CGST</th>
                        <th className="px-4 py-2 text-right">SGST</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs">
                      {gst.invoices.map((inv: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50/50">
                          <td className="px-4 py-2 font-medium text-primary">
                            {inv.invoiceNumber}
                          </td>
                          <td className="px-4 py-2">{inv.customerName}</td>
                          <td className="px-4 py-2 text-right">
                            ₹{Math.round(inv.taxableAmount).toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-right">
                            ₹{Math.round(inv.cgst).toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-right">
                            ₹{Math.round(inv.sgst).toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-right font-bold">
                            ₹{Math.round(inv.totalGST).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-text-secondary text-center py-8">
            No GST data available
          </p>
        );

      case "due-aging":
        if (!dueAging)
          return (
            <p className="text-text-secondary text-center py-8">
              No due aging data
            </p>
          );
        const agingData = [
          { label: "0–30 Days", amount: dueAging.bucket30, color: "#10b981" },
          { label: "31–60 Days", amount: dueAging.bucket60, color: "#f59e0b" },
          { label: "60+ Days", amount: dueAging.bucket90, color: "#ef4444" },
        ];
        return (
          <div>
            <div className="mb-6 flex justify-center">
              <ResponsiveContainer width={300} height={250}>
                <PieChart>
                  <Pie
                    data={agingData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="amount"
                    nameKey="label"
                  >
                    {agingData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) =>
                      `₹${Math.round(val).toLocaleString()}`
                    }
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {agingData.map((d) => (
                <div
                  key={d.label}
                  className="flex items-center justify-between border border-border rounded-xl p-3"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-xs font-semibold text-text-primary">
                      {d.label}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-text-primary">
                    ₹{Math.round(d.amount).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center border-2 border-primary/20 rounded-xl p-3 bg-primary/[0.03]">
                <span className="text-xs font-bold text-text-primary">
                  Total Outstanding
                </span>
                <span className="text-base font-extrabold text-primary">
                  ₹{Math.round(dueAging.totalOutstanding).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <FiBarChart2 className="text-primary" size={24} />
            Reports & Analytics
          </h1>
          <p className="text-text-secondary text-sm">
            Financial metrics, occupancy, and operational analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-border rounded-xl px-3 py-2">
            <FiCalendar size={14} className="text-text-secondary" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => updateFilters("from", e.target.value)}
              className="text-xs text-text-primary outline-none bg-transparent"
            />
            <span className="text-text-secondary text-xs">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => updateFilters("to", e.target.value)}
              className="text-xs text-text-primary outline-none bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="bg-white border border-border p-5 rounded-2xl shadow-sm flex items-center gap-3"
          >
            <div className={`p-2.5 ${k.bg} ${k.color} rounded-xl`}>
              {k.icon}
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">
                {k.label}
              </p>
              <p className="text-lg font-extrabold text-text-primary mt-0.5">
                {loading ? "…" : k.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-50 border border-border rounded-xl p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-white text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-white/50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ReportsPage;
