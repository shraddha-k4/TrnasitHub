import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { fetchAllRoutesForC, searchRoutesForC } from "../api/apiendpoint.jsx";

export default function RoutePlannerPage() {
  const [searchParams] = useSearchParams();

  const [source, setSource] = useState(
    searchParams.get("from") || "Talegaon Dabhade"
  );
  const [destination, setDestination] = useState(
    searchParams.get("to") || "Pune Junction"
  );
  const [departureTime, setDepartureTime] = useState("");

  const [selectedMode, setSelectedMode] = useState("all");
  const [searched, setSearched] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Raw results coming from the C route planner
  const [routesData, setRoutesData] = useState([]);

  // ==========================================
  // TEXT UTILITIES
  // ==========================================
  const normalizeText = (value) =>
    String(value || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");

  const isTalegaon = (value) => {
    const text = normalizeText(value);
    return text.includes("talegaon") || text.includes("tgn");
  };

  const isPune = (value) => normalizeText(value).includes("pune");

  const stationCore = (value) => {
    let text = normalizeText(value);
    if (text.includes("pimpri") || text.includes("pcmc")) return "pcmc";
    return text
      .replace(/\b(junction|jn|station|stn|railway|metro|terminal|road)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const stationMatches = (a, b) => {
    const n = normalizeText(a);
    const q = normalizeText(b);
    if (!n || !q) return false;
    if (n.includes(q) || q.includes(n)) return true;
    const nc = stationCore(a);
    const qc = stationCore(b);
    if (!nc || !qc) return false;
    return nc === qc || nc.includes(qc) || qc.includes(nc);
  };

  // Used only when we fall back to the "all-for-c" list and must filter on the client
  const isCorrectDirection = (from, to, src, dst) => {
    if (isTalegaon(src) && isPune(dst)) return isTalegaon(from) && isPune(to);
    if (isPune(src) && isTalegaon(dst)) return isPune(from) && isTalegaon(to);
    return stationMatches(from, src) && stationMatches(to, dst);
  };

  const extractArray = (response) => {
    if (Array.isArray(response)) return response;
    const keys = [
      "data",
      "routes",
      "results",
      "result",
      "schedules",
      "options",
      "trains",
      "buses"
    ];
    for (const k of keys) {
      if (Array.isArray(response?.[k])) return response[k];
    }
    if (Array.isArray(response?.data?.routes)) return response.data.routes;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    return [];
  };

  // ==========================================
  // TIME HELPERS
  // ==========================================
  // Converts "HH:MM AM/PM" or "HH:mm" to minutes from midnight
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    try {
      const clean = String(timeStr).trim().toUpperCase();
      let hours = 0;
      let minutes = 0;

      if (clean.includes("AM") || clean.includes("PM")) {
        const period = clean.includes("PM") ? "PM" : "AM";
        const hm = clean.replace(/AM|PM/g, "").trim().split(":");
        hours = Number(hm[0]);
        minutes = Number(hm[1] || 0);
        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;
      } else {
        const hm = clean.split(":");
        hours = Number(hm[0]);
        minutes = Number(hm[1] || 0);
      }
      return hours * 60 + minutes;
    } catch {
      return 0;
    }
  };

  const calculateDuration = (departure, arrival) => {
    if (!departure || !arrival) return "";
    const dep = parseTimeToMinutes(departure);
    let arr = parseTimeToMinutes(arrival);
    if (arr < dep) arr += 24 * 60;
    const diff = arr - dep;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}hr`;
    return `${h}hr ${m.toString().padStart(2, "0")}min`;
  };

  // ==========================================
  // API CALLS (C route planner only)
  // ==========================================
  const performRouteSearch = async (src, dst, time = departureTime) => {
    setSearched(true);
    setLoading(true);
    setError("");

    try {
      // 1. Ask the C program (through the backend) for matching routes
      const result = await searchRoutesForC({
        from: src,
        to: dst,
        departureTime: time || ""
      });

      if (result.success) {
        setRoutesData(extractArray(result.data));
        return;
      }

      // 2. Fallback: fetch everything and filter in the browser
      const all = await fetchAllRoutesForC();
      if (all.success) {
        const list = extractArray(all.data).filter((item) =>
          isCorrectDirection(
            item.from || item.source || item.route?.from,
            item.to || item.destination || item.route?.to,
            src,
            dst
          )
        );
        setRoutesData(list);
      } else {
        setRoutesData([]);
        setError("Unable to connect with TransitHub backend. Please check server.");
      }
    } catch (err) {
      console.error("Route search error:", err);
      setRoutesData([]);
      setError("Unable to connect with TransitHub backend. Please check server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performRouteSearch(source, destination);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const swapLocations = () => {
    const tempSrc = source;
    const tempDst = destination;
    setSource(tempDst);
    setDestination(tempSrc);
    performRouteSearch(tempDst, tempSrc);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performRouteSearch(source, destination);
  };

  // ==========================================
  // NORMALIZE C-PLANNER RESULTS -> UI OPTIONS
  // ==========================================
  const detectType = (item) => {
    const raw = normalizeText(
      item.type ||
        item.mode ||
        item.transport ||
        item.transport_type ||
        item.category ||
        item.service ||
        item.title ||
        item.name ||
        ""
    );
    if (raw.includes("metro")) return "metro";
    if (raw.includes("pmpl") || raw.includes("pmpml")) return "pmpl";
    if (raw.includes("msrtc") || raw.includes("st bus") || raw.includes("state")) return "msrtc";
    if (raw.includes("train") || raw.includes("rail") || raw.includes("emu") || raw.includes("local"))
      return "train";
    return "train";
  };

  const typeMeta = {
    train: { label: "Local Train", badge: "Suburban Railway", color: "bg-emerald-100 text-emerald-800" },
    pmpl: { label: "PMPL Bus", badge: "PMPML City Route", color: "bg-orange-100 text-orange-800" },
    msrtc: { label: "MSRTC", badge: "MSRTC Service", color: "bg-blue-100 text-blue-800" },
    metro: { label: "Pune Metro", badge: "Rapid Transit", color: "bg-purple-100 text-purple-800" }
  };

  const getRouteOptions = () => {
    const options = routesData.map((item, index) => {
      const type = detectType(item);
      const meta = typeMeta[type];

      const dep =
        item.departure_time || item.departureTime || item.departure || item.dep || item.time || "N/A";
      const arr =
        item.arrival_time || item.arrivalTime || item.arrival || item.arr || "N/A";
      const from = item.from || item.source || item.route?.from || source;
      const to = item.to || item.destination || item.route?.to || destination;

      const name =
        item.train_name ||
        item.trainName ||
        item.bus_name ||
        item.name ||
        item.route_name ||
        item.line_name ||
        item.title ||
        "";
      const number =
        item.train_number || item.trainNumber || item.route_number || item.bus_number || item.number || "";

      const duration =
        item.duration ||
        item.travel_time ||
        item.estimated_duration ||
        calculateDuration(dep, arr) ||
        "N/A";

      const stops = item.stops || item.via || item.route_via || item.stations;
      const stopsText = Array.isArray(stops)
        ? stops.map((s) => (typeof s === "string" ? s : s?.stop_name || s?.station_name || s?.name || "")).filter(Boolean).join(" → ")
        : stops;

      const steps = [
        `From: ${from}`,
        `To: ${to}`,
        `Departure: ${dep}`,
        `Arrival: ${arr}`
      ];
      if (number) steps.splice(2, 0, `Service No: ${number}`);
      if (stopsText) steps.push(`Stops: ${stopsText}`);
      if (item.runs_on || item.runs) steps.push(`Runs on: ${item.runs_on || item.runs}`);

      return {
        id: `${type}-${index}`,
        type,
        title: `${meta.label}${name ? ` - ${name}` : number ? ` ${number}` : ""}`,
        badge: item.bus_type || meta.badge,
        badgeColor: meta.color,
        departureTime: dep,
        arrivalTime: arr,
        duration,
        changes: item.changes || 0,
        steps
      };
    });

    // Client-side time filter (backend already filters, this keeps it safe on fallback)
    let filtered = options;
    if (departureTime) {
      const userMinutes = parseTimeToMinutes(departureTime);
      filtered = options.filter(
        (item) => parseTimeToMinutes(item.departureTime) >= userMinutes
      );
    }

    filtered.sort(
      (a, b) => parseTimeToMinutes(a.departureTime) - parseTimeToMinutes(b.departureTime)
    );

    return filtered;
  };

  const routeOptions = getRouteOptions();
  const filteredRoutes = routeOptions.filter(
    (item) => selectedMode === "all" || item.type === selectedMode
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      <Navbar />

      {/* ROUTE PLANNER HEADER */}
      <section className="bg-gradient-to-b from-orange-50 via-white to-gray-50 pt-10 pb-8 px-4 sm:px-6 lg:px-8 border-b">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <span className="bg-orange-100 text-orange-700 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            Smart Transit Routing
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            🧭 Route Planner
          </h1>
          <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
            Find the quickest and most affordable transit options connecting Local Trains, PMPML, Metro, and MSRTC.
          </p>
        </div>

        {/* SEARCH CARD */}
        <div
          id="search-section"
          className="max-w-3xl mx-auto mt-8 bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden"
        >
          <div className="p-6 md:p-8">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
                {/* SOURCE */}
                <div className="md:col-span-3">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    START LOCATION (FROM)
                  </label>
                  <div className="flex items-center border border-gray-300 focus-within:border-orange-500 rounded-2xl px-4 py-3 bg-gray-50 focus-within:bg-white transition">
                    <span className="mr-2 text-lg">🟢</span>
                    <input
                      type="text"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      placeholder="e.g. Talegaon Dabhade"
                      className="w-full bg-transparent outline-none font-semibold text-gray-800"
                      required
                    />
                  </div>
                </div>

                {/* SWAP BUTTON */}
                <div className="flex justify-center md:pt-5">
                  <button
                    type="button"
                    onClick={swapLocations}
                    title="Swap Start & Destination"
                    className="p-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-md hover:scale-105 active:scale-95 transition cursor-pointer"
                  >
                    🔄
                  </button>
                </div>

                {/* DESTINATION */}
                <div className="md:col-span-3">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    DESTINATION (TO)
                  </label>
                  <div className="flex items-center border border-gray-300 focus-within:border-orange-500 rounded-2xl px-4 py-3 bg-gray-50 focus-within:bg-white transition">
                    <span className="mr-2 text-lg">🔴</span>
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="e.g. Pune Junction"
                      className="w-full bg-transparent outline-none font-semibold text-gray-800"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* DEPARTURE TIME INPUT */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  ⏱️ Preferred Departure Time (Optional)
                </label>
                <div className="flex items-center border border-gray-300 focus-within:border-orange-500 rounded-2xl px-4 py-3 bg-gray-50 focus-within:bg-white transition max-w-xs">
                  <span className="mr-2 text-lg">🕒</span>
                  <input
                    type="time"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full bg-transparent outline-none font-semibold text-gray-800"
                  />
                  {departureTime && (
                    <button
                      type="button"
                      onClick={() => setDepartureTime("")}
                      className="text-xs text-gray-400 hover:text-gray-600 ml-2"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* QUICK SUGGESTIONS */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-gray-500">
                <span className="font-semibold">Quick picks:</span>
                {[
                  { from: "Talegaon Dabhade", to: "Pune Junction" },
                  { from: "Pune Junction", to: "Talegaon Dabhade" },
                  { from: "Shivajinagar", to: "Swargate" },
                  { from: "Pimpri", to: "Pune Station" }
                ].map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSource(item.from);
                      setDestination(item.to);
                      performRouteSearch(item.from, item.to);
                    }}
                    className="bg-gray-100 hover:bg-orange-100 hover:text-orange-700 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer"
                  >
                    {item.from.split(" ")[0]} ➔ {item.to.split(" ")[0]}
                  </button>
                ))}
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold py-4 rounded-2xl text-lg shadow-lg shadow-orange-500/25 transition disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="animate-spin text-xl">🔄</span>
                    <span>Finding Best Routes...</span>
                  </>
                ) : (
                  <>
                    <span>🔍</span>
                    <span>Search Best Route Options</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ERROR BANNER */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 mt-6 w-full">
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl flex items-center space-x-3 text-sm font-semibold">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* ROUTE RESULTS */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-black text-gray-900">
              Routes for <span className="text-orange-600">{source}</span> ➔{" "}
              <span className="text-orange-600">{destination}</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {departureTime
                ? `Showing options departing from ${departureTime} onwards, sorted by time.`
                : "Showing all available schedules sorted chronologically."}
            </p>
          </div>

          {/* MODE FILTER PILLS */}
          <div className="flex flex-wrap gap-1.5 bg-gray-200/80 p-1 rounded-xl">
            {[
              { id: "all", label: "All Modes" },
              { id: "train", label: "🚆 Train" },
              { id: "pmpl", label: "🚌 PMPL" },
              { id: "metro", label: "🚇 Metro" },
              { id: "msrtc", label: "🚍 MSRTC" }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedMode === mode.id
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* LOADING INDICATOR */}
        {loading && (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-200 space-y-4">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="font-semibold text-gray-600 text-sm">
              Searching real-time transport routes across Pune...
            </p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && searched && filteredRoutes.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-200 space-y-3">
            <div className="text-5xl">🚌</div>
            <h3 className="font-bold text-xl text-gray-900">No Matching Transit Schedules Found</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              We couldn't find any transit options from "{source}" to "{destination}"{" "}
              {departureTime ? `at or after ${departureTime}` : ""}. Try adjusting your time or search terms.
            </p>
          </div>
        )}

        {/* ROUTE CARDS LIST */}
        {!loading && filteredRoutes.length > 0 && (
          <div className="space-y-4">
            {filteredRoutes.map((option) => (
              <div
                key={option.id}
                className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-lg border border-gray-200 transition-all duration-200 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0">
                      {option.type === "train" && "🚆"}
                      {option.type === "pmpl" && "🚌"}
                      {option.type === "metro" && "🚇"}
                      {option.type === "msrtc" && "🚍"}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{option.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ${option.badgeColor}`}
                        >
                          {option.badge}
                        </span>
                        <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                          Departs: {option.departureTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 self-end sm:self-auto text-right">
                    <div>
                      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Est. Duration
                      </div>
                      <div className="font-black text-gray-900 text-base">{option.duration}</div>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Transfers
                      </div>
                      <div className="font-black text-orange-600 text-base">
                        {option.changes === 0 ? "Direct" : `${option.changes} Change`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ROUTE STEPS */}
                <div>
                  <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                    Route Information & Stops
                  </h4>
                  <ul className="space-y-2">
                    {option.steps.map((step, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-700 space-x-2.5">
                        <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-snug">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
