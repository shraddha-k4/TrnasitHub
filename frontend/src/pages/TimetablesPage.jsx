import React, { useEffect, useState, useMemo, useCallback } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import {
  fetchTrains,
  fetchPMPL,
  fetchMSRTC,
  fetchMetro
} from "../api/apiendpoint.jsx";

const METRO_STYLES = {
  purple: { color: "from-purple-600 to-indigo-700", border: "border-purple-300" },
  aqua: { color: "from-cyan-600 to-blue-700", border: "border-cyan-300" },
  default: { color: "from-orange-500 to-red-600", border: "border-orange-300" }
};

const getMetroStyle = (line) => {
  const key = `${line.id || ""} ${line.name || ""}`.toLowerCase();
  if (key.includes("purple")) return METRO_STYLES.purple;
  if (key.includes("aqua")) return METRO_STYLES.aqua;
  return METRO_STYLES.default;
};

// Time Parser Helper (minutes from midnight for sorting)
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 9999;
  try {
    const parts = timeStr.trim().toUpperCase().split(/\s+/);
    if (!parts[0]) return 9999;
    const [h, m] = parts[0].split(":").map(Number);
    if (isNaN(h)) return 9999;
    let hours = h;
    const minutes = isNaN(m) ? 0 : m;
    const period = parts[1];

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    return hours * 60 + minutes;
  } catch {
    return 9999;
  }
}

// Accepts: [..] | {data:[..]} | {schedules:[..]} | {trains:[..]} | ...
const extractArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.schedules)) return res.schedules;
  if (Array.isArray(res?.trains)) return res.trains;
  if (Array.isArray(res?.buses)) return res.buses;
  if (Array.isArray(res?.routes)) return res.routes;
  if (Array.isArray(res?.lines)) return res.lines;
  if (Array.isArray(res?.result)) return res.result;
  return [];
};

// Runs one API call and never throws
const loadSource = async (fetcher) => {
  try {
    const res = await fetcher();
    if (res?.success) {
      return { ok: true, data: extractArray(res.data) };
    }
    return { ok: false, data: [] };
  } catch {
    return { ok: false, data: [] };
  }
};

// ============================================================================
// MAIN TIMETABLES PAGE COMPONENT
// ============================================================================
export default function TimetablesPage() {
  const [selectedMode, setSelectedMode] = useState("msrtc"); // "msrtc" | "pmpl" | "train" | "metro"
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [apiStatus, setApiStatus] = useState("Connecting to live transit server...");
  const [statusType, setStatusType] = useState("ok"); // "ok" | "warn" | "error"

  // Quick Table Search / Filter (Single filter query)
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("departure"); // "departure" | "asc" | "desc"

  // Raw Dynamic Datasets (all from backend)
  const [msrtcData, setMsrtcData] = useState([]);
  const [pmplData, setPmplData] = useState([]);
  const [trainData, setTrainData] = useState([]);
  const [metroData, setMetroData] = useState([]);

  // Which sources failed to load (so empty state can explain why)
  const [failed, setFailed] = useState({ msrtc: false, pmpl: false, train: false, metro: false });

  // Expanded stops toggle for PMPML (keyed by unique trip key)
  const [expandedPmpl, setExpandedPmpl] = useState({});

  const togglePmplStops = (key) => {
    setExpandedPmpl((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Dynamic Fetch Function - all four sources load in parallel
  const loadDynamicTimetables = useCallback(async () => {
    setLoading(true);
    setApiStatus("Syncing live timetable records from backend...");
    setStatusType("ok");

    const [msrtc, pmpl, train, metro] = await Promise.all([
      loadSource(fetchMSRTC),
      loadSource(fetchPMPL),
      loadSource(fetchTrains),
      loadSource(fetchMetro)
    ]);

    setMsrtcData(msrtc.data);
    setPmplData(pmpl.data);
    setTrainData(train.data);
    setMetroData(metro.data);

    setFailed({
      msrtc: !msrtc.ok,
      pmpl: !pmpl.ok,
      train: !train.ok,
      metro: !metro.ok
    });

    const results = [msrtc, pmpl, train, metro];
    const okCount = results.filter((r) => r.ok).length;

    if (okCount === results.length) {
      setApiStatus("Live schedules dynamically synchronized");
      setStatusType("ok");
    } else if (okCount === 0) {
      setApiStatus("Backend unavailable - please try again");
      setStatusType("error");
    } else {
      setApiStatus("Some schedules could not be loaded");
      setStatusType("warn");
    }

    setLastUpdated(
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDynamicTimetables();
  }, [loadDynamicTimetables]);

  // Reset filter when switching tabs so a leftover query doesn't hide a table
  useEffect(() => {
    setSearchQuery("");
  }, [selectedMode]);

  // ============================================================================
  // FILTERED TIMETABLE LISTS
  // ============================================================================

  // 1. MSRTC Filtered List
  const filteredMsrtc = useMemo(() => {
    let list = [...msrtcData];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((bus) => {
        const id = String(bus.bus_id || "").toLowerCase();
        const type = String(bus.bus_type || "").toLowerCase();
        const op = String(bus.operator || "").toLowerCase();
        const from = String(bus.from || "").toLowerCase();
        const to = String(bus.to || bus.destination || "").toLowerCase();
        const via = Array.isArray(bus.route_via)
          ? bus.route_via.join(" ").toLowerCase()
          : String(bus.route_via || "").toLowerCase();
        return id.includes(q) || type.includes(q) || op.includes(q) || from.includes(q) || to.includes(q) || via.includes(q);
      });
    }

    return list.sort((a, b) => {
      if (sortOrder === "departure") {
        return parseTimeToMinutes(a.departure_time) - parseTimeToMinutes(b.departure_time);
      }
      return String(a.bus_id || "").localeCompare(String(b.bus_id || ""));
    });
  }, [msrtcData, searchQuery, sortOrder]);

  // 2. PMPL Flattened Trips Filtered List
  const filteredPmpl = useMemo(() => {
    let list = [];
    pmplData.forEach((routeObj, rIdx) => {
      const routeInfo = routeObj.route_info || {};
      const stops = Array.isArray(routeObj.stops) ? routeObj.stops : [];
        // Only real trips from the backend are shown (no invented placeholder trips)
      const trips = Array.isArray(routeObj.trips) ? routeObj.trips : [];

      trips.forEach((trip, tIdx) => {
        list.push({
          key: `${routeInfo.route_number || "r"}-${rIdx}-${tIdx}-${trip.bus_number || ""}`,
          routeNumber: routeInfo.route_number || "--",
          busNumber: trip.bus_number || "--",
          operator: routeInfo.operator || "PMPML",
          source: routeInfo.source || "--",
          destination: routeInfo.destination || "--",
          departureTime: trip.departure_time || "--",
          arrivalTime: trip.arrival_time || "--",
          duration: trip.duration || routeInfo.estimated_duration || "--",
          stops: stops
        });
      });
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => {
        const num = String(item.routeNumber).toLowerCase();
        const busNum = String(item.busNumber).toLowerCase();
        const src = String(item.source).toLowerCase();
        const dst = String(item.destination).toLowerCase();
        const stopsStr = item.stops.map((s) => String(s.stop_name || s)).join(" ").toLowerCase();
        return num.includes(q) || busNum.includes(q) || src.includes(q) || dst.includes(q) || stopsStr.includes(q);
      });
    }

    return list.sort((a, b) => {
      if (sortOrder === "departure") {
        return parseTimeToMinutes(a.departureTime) - parseTimeToMinutes(b.departureTime);
      }
      return String(a.routeNumber).localeCompare(String(b.routeNumber));
    });
  }, [pmplData, searchQuery, sortOrder]);

  // 3. Train Filtered List
  const filteredTrains = useMemo(() => {
    let list = [];

    const pushTrain = (t, route) => {
      list.push({
        key: `${t.train_number || "t"}-${list.length}`,
        trainNumber: t.train_number || "--",
        trainName: t.train_name || "--",
        trainType: t.train_type || "--",
        from: t.from || route?.from || "--",
        to: t.to || route?.to || "--",
        departureTime: t.departure_time || "--",
        arrivalTime: t.arrival_time || "--",
        duration: t.duration || "--",
        frequency: t.frequency || "--",
        runsOn: t.runs_on || t.frequency || "--",
        });
    };

    trainData.forEach((schedule) => {
      if (Array.isArray(schedule.trains)) {
        // { route: {from,to}, trains: [...] }
        schedule.trains.forEach((t) => pushTrain(t, schedule.route));
      } else if (schedule.train_number) {
        // flat train document
        pushTrain(schedule, schedule.route);
      }
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((t) => {
        const num = String(t.trainNumber).toLowerCase();
        const name = String(t.trainName).toLowerCase();
        const from = String(t.from).toLowerCase();
        const to = String(t.to).toLowerCase();
        return num.includes(q) || name.includes(q) || from.includes(q) || to.includes(q);
      });
    }

    return list.sort((a, b) => {
      if (sortOrder === "departure") {
        return parseTimeToMinutes(a.departureTime) - parseTimeToMinutes(b.departureTime);
      }
      return String(a.trainNumber).localeCompare(String(b.trainNumber));
    });
  }, [trainData, searchQuery, sortOrder]);

  // 4. Metro Lines Filtered List
  const filteredMetro = useMemo(() => {
    const lines = metroData.map((line, idx) => {
      const style = getMetroStyle(line);
      const stations = Array.isArray(line.stations)
        ? line.stations.map((s) => (typeof s === "string" ? s : s.station_name || s.name || ""))
        : [];
      return {
        id: line.id || line._id || `line-${idx}`,
        name: line.name || "Metro Line",
        tag: line.tag || "",
        color: line.color || style.color,
        border: line.border || style.border,
        from: line.from || "--",
        to: line.to || "--",
        operator: line.operator || "Maha Metro",
        firstTrain: line.firstTrain || line.first_train || "--",
        lastTrain: line.lastTrain || line.last_train || "--",
        frequencyPeak: line.frequencyPeak || line.frequency_peak || "--",
        interchange: line.interchange || "--",
        stations
      };
    });

    if (!searchQuery.trim()) return lines;
    const q = searchQuery.toLowerCase().trim();
    return lines.filter((line) => {
      const name = line.name.toLowerCase();
      const from = String(line.from).toLowerCase();
      const to = String(line.to).toLowerCase();
      const stns = line.stations.join(" ").toLowerCase();
      return name.includes(q) || from.includes(q) || to.includes(q) || stns.includes(q);
    });
  }, [metroData, searchQuery]);

  // Empty-state text: explains whether it's a failed load or just no match
  const emptyText = (label, key, hasData) => {
    if (failed[key]) return `Could not load ${label} schedules from the server. Press Refresh to retry.`;
    if (!hasData) return `No ${label} schedules are available yet.`;
    return `No ${label} schedules matching your query.`;
  };

  const statusStyles =
    statusType === "error"
      ? { box: "text-red-700 bg-red-50 border-red-200", dot: "bg-red-500" }
      : statusType === "warn"
      ? { box: "text-amber-700 bg-amber-50 border-amber-200", dot: "bg-amber-500" }
      : { box: "text-emerald-700 bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800 overflow-x-hidden w-full">
      <Navbar />

      {/* HEADER SECTION (NO FROM-TO SEARCH - CLEAN TIMETABLE HEADER) */}
      <section className="bg-gradient-to-b from-orange-50 via-white to-gray-50 pt-10 pb-8 px-4 sm:px-6 lg:px-8 border-b">
        <div className="max-w-5xl mx-auto space-y-3 text-center">
          <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-800 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            <span>🕒 Live Transit Timetables & Schedules</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">
            Pune Transit Timetables
          </h1>

          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Real-time verified timetable schedules for MSRTC State Buses, PMPML City Buses, Suburban EMU Local Trains, and Maha Metro.
          </p>
        </div>

        {/* TRANSIT MODE SELECTION TABS */}
        <div className="max-w-5xl mx-auto mt-8 px-2">
        <div className="flex flex-nowrap justify-start sm:justify-center gap-2.5 overflow-x-auto sm:overflow-x-visible scrollbar-hide pb-2">
            {[
            { id: "msrtc", label: "🚍 MSRTC State Buses", count: filteredMsrtc.length },
            { id: "pmpl", label: "🚌 PMPML City Buses", count: filteredPmpl.length },
            { id: "train", label: "🚆 Local Trains", count: filteredTrains.length },
            { id: "metro", label: "🚇 Pune Metro", count: filteredMetro.length }
            ].map((tab) => (
            <button
                key={tab.id}
                onClick={() => setSelectedMode(tab.id)}
                className={`shrink-0 whitespace-nowrap px-4 sm:px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-sm ${
                selectedMode === tab.id
                    ? "bg-orange-500 text-white shadow-orange-500/30 shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
            >
                <span>{tab.label}</span>
                <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                    selectedMode === tab.id
                    ? "bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
                >
                {tab.count}
                </span>
            </button>
            ))}
        </div>
        </div>
      </section>

      {/* TIMETABLE CONTROLS & QUICK FILTER BAR */}
      
      

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 w-full">
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-200 shadow-sm flex flex-row items-center justify-between gap-4">

            {/* SEARCH BAR */}
            <div className="flex-1 min-w-0 flex items-center border border-gray-200 focus-within:border-orange-500 rounded-xl px-3 py-2 bg-gray-50 focus-within:bg-white transition">
            <span className="text-gray-400 mr-2 text-sm shrink-0">🔍</span>

            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Filter ${selectedMode.toUpperCase()} timetable...`}
                className="w-full min-w-0 bg-transparent outline-none text-xs sm:text-sm font-medium text-gray-800 placeholder:text-gray-400"
            />

            {searchQuery && (
                <button
                onClick={() => setSearchQuery("")}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold ml-1 cursor-pointer shrink-0"
                >
                ✕
                </button>
            )}
            </div>

            {/* REFRESH BUTTON */}
            <div className="flex items-center shrink-0">
            <button
                onClick={loadDynamicTimetables}
                disabled={loading}
                title="Reload live schedule data from server"
                className="bg-gray-100 hover:bg-orange-100 hover:text-orange-700 active:scale-95 text-gray-700 text-xs font-bold px-3 sm:px-4 py-2 rounded-xl border border-gray-200 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
                <span className={loading ? "animate-spin" : ""}>🔄</span>
                <span>Refresh</span>
            </button>
            </div>

        </div>
        </section>


      {/* MAIN TIMETABLES CONTENT TABLES */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-grow">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-bold text-gray-600">Loading  timetables...</p>
          </div>
        ) : (
          <>
            {/* ========================================================== */}
            {/* 1. MSRTC STATE BUSES TIMETABLE */}
            {/* ========================================================== */}
            {selectedMode === "msrtc" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🚍</span>
                    <div>
                      <h2 className="text-lg font-black text-gray-900">MSRTC Bus Schedules</h2>
                      <p className="text-xs text-gray-500">Maharashtra State Road Transport Corporation Timetable</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    {filteredMsrtc.length} Scheduled Departures
                  </span>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden w-full">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-orange-500 text-white text-[11px] uppercase tracking-wider font-bold">
                          <th className="py-3.5 px-4">Bus No</th>
                          <th className="py-3.5 px-4">Type & Operator</th>
                          <th className="py-3.5 px-4">From (Origin)</th>
                          <th className="py-3.5 px-4">To (Destination)</th>
                          <th className="py-3.5 px-4 text-center">Departure</th>
                          <th className="py-3.5 px-4 text-center">Arrival</th>
                          <th className="py-3.5 px-4 text-center">Duration</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredMsrtc.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-gray-500 text-sm">
                              {emptyText("MSRTC", "msrtc", msrtcData.length > 0)}
                            </td>
                          </tr>
                        ) : (
                          filteredMsrtc.map((bus, idx) => (
                            <tr
                              key={bus.bus_id ? `${bus.bus_id}-${idx}` : idx}
                              className="hover:bg-orange-50/60 transition-colors"
                            >
                              <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                                {bus.bus_id || `MSRTC-${idx + 1}`}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                  String(bus.bus_type).includes("Shivneri")
                                    ? "bg-purple-100 text-purple-800"
                                    : String(bus.bus_type).includes("Shivshahi")
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-red-100 text-red-800"
                                }`}>
                                  {bus.bus_type || "Ordinary"}
                                </span>
                                <div className="text-[11px] text-gray-500 mt-0.5 font-medium">
                                  {bus.operator || "MSRTC"}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-bold text-gray-900">
                                {bus.from}
                              </td>
                              <td className="py-3.5 px-4 font-bold text-gray-900">
                                {bus.to || bus.destination}
                                {Array.isArray(bus.route_via) && bus.route_via.length > 0 && (
                                  <div className="text-[10px] text-gray-500 font-normal mt-0.5">
                                    Via: {bus.route_via.slice(0, 3).join(", ")}
                                    {bus.route_via.length > 3 ? "..." : ""}
                                  </div>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-center font-bold text-orange-600">
                                {bus.departure_time}
                              </td>
                              <td className="py-3.5 px-4 text-center font-semibold text-gray-700">
                                {bus.arrival_time}
                              </td>
                              <td className="py-3.5 px-4 text-center text-gray-600 text-xs">
                                {bus.duration || "--"}
                              </td>
                              </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* 2. PMPML CITY BUSES TIMETABLE */}
            {/* ========================================================== */}
            {selectedMode === "pmpl" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🚌</span>
                    <div>
                      <h2 className="text-lg font-black text-gray-900">PMPML City Bus Schedules</h2>
                      <p className="text-xs text-gray-500">Pune Mahanagar Parivahan Mahamandal Ltd Timetable</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                    {filteredPmpl.length} Bus Departures
                  </span>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden w-full">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-orange-500 text-white text-[11px] uppercase tracking-wider font-bold">
                          <th className="py-3.5 px-4">Route No</th>
                          <th className="py-3.5 px-4">Bus No</th>
                          <th className="py-3.5 px-4">From (Source)</th>
                          <th className="py-3.5 px-4">To (Destination)</th>
                          <th className="py-3.5 px-4 text-center">Departure</th>
                          <th className="py-3.5 px-4 text-center">Arrival</th>
                          <th className="py-3.5 px-4 text-center">Duration</th>
                          <th className="py-3.5 px-4 text-center">Stops</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredPmpl.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-12 text-center text-gray-500 text-sm">
                              {emptyText("PMPML", "pmpl", pmplData.length > 0)}
                            </td>
                          </tr>
                        ) : (
                          filteredPmpl.map((bus) => {
                            const isExpanded = !!expandedPmpl[bus.key];
                            return (
                              <React.Fragment key={bus.key}>
                                <tr className="hover:bg-orange-50/60 transition-colors">
                                  <td className="py-3.5 px-4 font-black text-orange-600">
                                    <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-lg text-xs font-bold">
                                      {bus.routeNumber}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 font-mono font-medium text-gray-700 text-xs">
                                    {bus.busNumber}
                                  </td>
                                  <td className="py-3.5 px-4 font-bold text-gray-900">
                                    {bus.source}
                                  </td>
                                  <td className="py-3.5 px-4 font-bold text-gray-900">
                                    {bus.destination}
                                  </td>
                                  <td className="py-3.5 px-4 text-center font-bold text-orange-600">
                                    {bus.departureTime}
                                  </td>
                                  <td className="py-3.5 px-4 text-center font-semibold text-gray-700">
                                    {bus.arrivalTime}
                                  </td>
                                  <td className="py-3.5 px-4 text-center text-gray-600 text-xs">
                                    {bus.duration}
                                  </td>
                                 <td className="py-3.5 px-4 text-center">
                                    {bus.stops && bus.stops.length > 0 ? (
                                      <button
                                        type="button"
                                        onClick={() => togglePmplStops(bus.key)}
                                        className="text-[11px] bg-gray-100 hover:bg-orange-200 text-gray-800 font-bold px-2 py-1 rounded transition cursor-pointer"
                                      >
                                        {isExpanded ? "Hide Stops ▲" : `${bus.stops.length} Stops ▼`}
                                      </button>
                                    ) : (
                                      <span className="text-gray-400 text-xs">--</span>
                                    )}
                                  </td>
                                </tr>

                                {/* EXPANDED STOPS TIMELINE ROW */}
                                {isExpanded && bus.stops && (
                                  <tr className="bg-orange-50/40">
                                    <td colSpan={9} className="px-6 py-4">
                                      <div className="text-xs font-bold text-gray-700 mb-2 flex items-center space-x-1.5">
                                        <span>🚏 Route Stops Sequence ({bus.routeNumber}):</span>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                        {bus.stops.map((stop, sIdx) => {
                                          const stopName = typeof stop === "string" ? stop : (stop.stop_name || `Stop ${sIdx + 1}`);
                                          return (
                                            <React.Fragment key={sIdx}>
                                              <span className="bg-white border border-gray-200 px-2 py-0.5 rounded shadow-2xs font-medium text-gray-800">
                                                {stopName}
                                              </span>
                                              {sIdx < bus.stops.length - 1 && (
                                                <span className="text-orange-400 font-bold">➔</span>
                                              )}
                                            </React.Fragment>
                                          );
                                        })}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* 3. LOCAL TRAINS TIMETABLE */}
            {/* ========================================================== */}
            {selectedMode === "train" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🚆</span>
                    <div>
                      <h2 className="text-lg font-black text-gray-900">Pune EMU Suburban Local Trains</h2>
                      <p className="text-xs text-gray-500">Central Railway - Pune Jn ⇄ Shivajinagar ⇄ Talegaon ⇄ Lonavala</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                    {filteredTrains.length} Daily Trains
                  </span>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden w-full">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-orange-500 text-white text-[11px] uppercase tracking-wider font-bold">
                          <th className="py-3.5 px-4">Train No</th>
                          <th className="py-3.5 px-4">Train Name</th>
                          <th className="py-3.5 px-4">From</th>
                          <th className="py-3.5 px-4">To</th>
                          <th className="py-3.5 px-4 text-center">Departure</th>
                          <th className="py-3.5 px-4 text-center">Arrival</th>
                          <th className="py-3.5 px-4 text-center">Duration</th>
                          <th className="py-3.5 px-4 text-center">Runs On</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredTrains.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-12 text-center text-gray-500 text-sm">
                              {emptyText("train", "train", trainData.length > 0)}
                            </td>
                          </tr>
                        ) : (
                          filteredTrains.map((train) => (
                            <tr
                              key={train.key}
                              className="hover:bg-orange-50/60 transition-colors"
                            >
                              <td className="py-3.5 px-4 font-mono font-black text-emerald-800">
                                {train.trainNumber}
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-gray-900">{train.trainName}</div>
                                <span className="inline-block text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded mt-0.5">
                                  {train.trainType}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-gray-800">
                                {train.from}
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-gray-800">
                                {train.to}
                              </td>
                              <td className="py-3.5 px-4 text-center font-bold text-orange-600">
                                {train.departureTime}
                              </td>
                              <td className="py-3.5 px-4 text-center font-semibold text-gray-700">
                                {train.arrivalTime}
                              </td>
                              <td className="py-3.5 px-4 text-center text-gray-600 text-xs">
                                {train.duration}
                              </td>
                              <td className="py-3.5 px-4 text-center text-xs font-semibold text-gray-700">
                                <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-bold">
                                  {train.runsOn}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* 4. PUNE METRO TIMETABLE */}
            {/* ========================================================== */}
            {selectedMode === "metro" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🚇</span>
                    <div>
                      <h2 className="text-lg font-black text-gray-900">Pune Metro Line Schedules</h2>
                      <p className="text-xs text-gray-500">Maha Metro Rapid Transit Network</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                    {filteredMetro.length} {filteredMetro.length === 1 ? "Line" : "Lines"}
                  </span>
                </div>

                {filteredMetro.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center text-gray-500 text-sm shadow-sm">
                    {emptyText("metro", "metro", metroData.length > 0)}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {filteredMetro.map((line) => (
                      <div
                        key={line.id}
                        className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          {/* LINE HEADER */}
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full text-white bg-gradient-to-r ${line.color}`}>
                              {line.name}
                            </span>
                            {line.tag && (
                              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
                                {line.tag}
                              </span>
                            )}
                          </div>

                          <div className="text-xl font-black text-gray-900 mb-1">
                            {line.from} ⇄ {line.to}
                          </div>
                          <p className="text-xs text-gray-500 mb-4">
                            Operated by {line.operator} • Interchange: <strong className="text-gray-700">{line.interchange}</strong>
                          </p>

                          {/* TIMINGS & FREQUENCY GRID */}
                          <div className="grid grid-cols-2 gap-3 mb-5 text-xs bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <div>
                              <span className="text-gray-400 block font-bold text-[10px] uppercase">First Train</span>
                              <span className="font-bold text-orange-600 text-sm">{line.firstTrain}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 block font-bold text-[10px] uppercase">Last Train</span>
                              <span className="font-bold text-gray-900 text-sm">{line.lastTrain}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 block font-bold text-[10px] uppercase">Peak Frequency</span>
                              <span className="font-bold text-gray-800">{line.frequencyPeak}</span>
                            </div>
                          </div>

                          {/* STATIONS LIST */}
                          <div>
                            <div className="text-xs font-black text-gray-800 uppercase tracking-wider mb-2">
                              Stations Along Line ({line.stations.length}):
                            </div>
                            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                              {line.stations.map((stn, sIdx) => {
                                const isInterchange = stn.includes("Interchange");
                                return (
                                  <span
                                    key={sIdx}
                                    className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold ${
                                      isInterchange
                                        ? "bg-purple-600 text-white shadow-xs font-bold"
                                        : "bg-gray-100 text-gray-700 border border-gray-200"
                                    }`}
                                  >
                                    {isInterchange ? `★ ${stn}` : stn}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
