// import React, { useEffect, useState } from "react";
// import { useSearchParams } from "react-router-dom";
// import Navbar from "../components/Navbar.jsx";
// import Footer from "../components/Footer.jsx";
// import {
//   fetchTrains,
//   fetchPMPL,
//   searchPMPL,
//   fetchMSRTC,
//   searchMSRTC,
//   fetchMetro
// } from "../api/apiendpoint.jsx";

// export default function RoutePlannerPage() {
//   const [searchParams] = useSearchParams();

//   const [source, setSource] = useState(
//     searchParams.get("from") || "Talegaon Dabhade"
//   );
//   const [destination, setDestination] = useState(
//     searchParams.get("to") || "Pune Junction"
//   );

//   const [selectedMode, setSelectedMode] = useState("all");
//   const [searched, setSearched] = useState(true); // Pre-search for instant route availability
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const [trainData, setTrainData] = useState([]);
//   const [pmplData, setPmplData] = useState([]);
//   const [msrtcData, setMsrtcData] = useState([]);
//   const [metroData, setMetroData] = useState([]);

//   // ==========================================
//   // TEXT & DIRECTION UTILITIES
//   // ==========================================
//   const normalizeText = (value) => {
//     return String(value || "")
//       .toLowerCase()
//       .trim()
//       .replace(/\s+/g, " ");
//   };

//   const isTalegaon = (value) => {
//     const text = normalizeText(value);
//     return text.includes("talegaon") || text.includes("tgn");
//   };

//   const isPune = (value) => {
//     const text = normalizeText(value);
//     return (
//       text.includes("pune") ||
//       text.includes("pune junction") ||
//       text.includes("pune station")
//     );
//   };

//   const isCorrectDirection = (from, to, customSrc = source, customDst = destination) => {
//     const fromTalegaon = isTalegaon(from);
//     const fromPune = isPune(from);
//     const toTalegaon = isTalegaon(to);
//     const toPune = isPune(to);

//     // Talegaon -> Pune
//     if (isTalegaon(customSrc) && isPune(customDst)) {
//       return fromTalegaon && toPune;
//     }

//     // Pune -> Talegaon
//     if (isPune(customSrc) && isTalegaon(customDst)) {
//       return fromPune && toTalegaon;
//     }

//     // General matching
//     const nFrom = normalizeText(from);
//     const nTo = normalizeText(to);
//     const nSrc = normalizeText(customSrc);
//     const nDst = normalizeText(customDst);

//     return (
//       (nFrom.includes(nSrc) || nSrc.includes(nFrom)) &&
//       (nTo.includes(nDst) || nDst.includes(nTo))
//     );
//   };

//   const extractArray = (response) => {
//     if (Array.isArray(response)) return response;
//     if (Array.isArray(response?.data)) return response.data;
//     if (Array.isArray(response?.schedules)) return response.schedules;
//     if (Array.isArray(response?.trains)) return response.trains;
//     if (Array.isArray(response?.buses)) return response.buses;
//     if (Array.isArray(response?.routes)) return response.routes;
//     if (Array.isArray(response?.result)) return response.result;
//     return [];
//   };

//   // ==========================================
//   // METRO UTILITIES (dynamic, backend driven)
//   // ==========================================
//   const extractMetroArray = (response) => {
//     const direct = extractArray(response);
//     if (direct.length > 0) return direct;
//     if (Array.isArray(response?.metro)) return response.metro;
//     if (Array.isArray(response?.lines)) return response.lines;
//     if (Array.isArray(response?.metros)) return response.metros;
//     if (Array.isArray(response?.data?.data)) return response.data.data;
//     if (response?.data && typeof response.data === "object" && !Array.isArray(response.data)) {
//       return [response.data];
//     }
//     return [];
//   };

//   // Reduce a name to its core so "Pune Junction" ~ "Pune Railway Station"
//   const stationCore = (value) => {
//     let text = normalizeText(value);
//     if (text.includes("pimpri") || text.includes("pcmc")) return "pcmc";
//     text = text
//       .replace(/\b(junction|jn|station|stn|railway|metro|terminal|road)\b/g, " ")
//       .replace(/\s+/g, " ")
//       .trim();
//     return text;
//   };

//   const stationMatches = (stationName, query) => {
//     const n = normalizeText(stationName);
//     const q = normalizeText(query);
//     if (!n || !q) return false;
//     if (n.includes(q) || q.includes(n)) return true;
//     const nc = stationCore(stationName);
//     const qc = stationCore(query);
//     if (!nc || !qc) return false;
//     return nc === qc || nc.includes(qc) || qc.includes(nc);
//   };

//   const getMetroStationNames = (metro) => {
//     const list =
//       metro?.stations ||
//       metro?.stops ||
//       metro?.station_list ||
//       metro?.route_stations ||
//       [];
//     if (!Array.isArray(list)) return [];
//     return list
//       .map((s) =>
//         typeof s === "string"
//           ? s
//           : s?.station_name || s?.stop_name || s?.name || s?.shortName || ""
//       )
//       .filter(Boolean);
//   };

//   // Returns { stations: [...stations between src and dst in travel order] } or null
//   const matchMetro = (metro, src, dst) => {
//     const names = getMetroStationNames(metro);

//     if (names.length > 0) {
//       const srcIdx = names.findIndex((n) => stationMatches(n, src));
//       const dstIdx = names.findIndex((n) => stationMatches(n, dst));
//       if (srcIdx === -1 || dstIdx === -1 || srcIdx === dstIdx) return null;

//       const stations =
//         srcIdx < dstIdx
//           ? names.slice(srcIdx, dstIdx + 1)
//           : names.slice(dstIdx, srcIdx + 1).reverse();
//       return { stations };
//     }

//     // Fallback: simple from/to documents
//     const from = metro?.from || metro?.source || metro?.route_info?.source;
//     const to = metro?.to || metro?.destination || metro?.route_info?.destination;
//     if (from && to && isCorrectDirection(from, to, src, dst)) {
//       return { stations: [] };
//     }

//     return null;
//   };

//   // ==========================================
//   // INITIAL DATA FETCH
//   // ==========================================
//   useEffect(() => {
//     performRouteSearch(source, destination);
//   }, []);

//   const swapLocations = () => {
//     const tempSrc = source;
//     const tempDst = destination;
//     setSource(tempDst);
//     setDestination(tempSrc);
//     performRouteSearch(tempDst, tempSrc);
//   };

//   const performRouteSearch = async (src, dst) => {
//     setSearched(true);
//     setLoading(true);
//     setError("");

//     try {
//       // 1. Search / Fetch Trains
//       const trainResult = await fetchTrains();
//       if (trainResult.success) {
//         const schedules = extractArray(trainResult.data);
//         const filteredSchedules = schedules.filter((schedule) => {
//           const route = schedule?.route;
//           if (!route) return false;
//           return isCorrectDirection(route.from, route.to, src, dst);
//         });

//         const trains = [];
//         filteredSchedules.forEach((schedule) => {
//           if (Array.isArray(schedule.trains)) {
//             schedule.trains.forEach((train) => {
//               trains.push({
//                 ...train,
//                 route: schedule.route
//               });
//             });
//           }
//         });
//         setTrainData(trains);
//       } else {
//         setTrainData([]);
//       }

//       // 2. Search PMPL
//       const pmplResult = await searchPMPL(src, dst);
//       if (pmplResult.success && pmplResult.data?.data) {
//         const data = pmplResult.data.data;
//         setPmplData(Array.isArray(data) ? data : [data]);
//       } else {
//         // Fallback to fetch all and filter client-side
//         const allPmpl = await fetchPMPL();
//         if (allPmpl.success) {
//           const data = allPmpl.data?.data;
//           if (Array.isArray(data)) {
//             const matched = data.filter((item) =>
//               isCorrectDirection(item.route_info?.source, item.route_info?.destination, src, dst)
//             );
//             setPmplData(matched);
//           } else if (data?.route_info && isCorrectDirection(data.route_info.source, data.route_info.destination, src, dst)) {
//             setPmplData([data]);
//           } else {
//             setPmplData([]);
//           }
//         } else {
//           setPmplData([]);
//         }
//       }

//       // 3. Search MSRTC
//       const msrtcResult = await searchMSRTC(src, dst);
//       if (msrtcResult.success) {
//         const data = extractArray(msrtcResult.data);
//         const filtered = data.filter((bus) =>
//           isCorrectDirection(bus.from, bus.to, src, dst)
//         );
//         setMsrtcData(filtered);
//       } else {
//         const allMsrtc = await fetchMSRTC();
//         if (allMsrtc.success) {
//           const data = extractArray(allMsrtc.data);
//           const filtered = data.filter((bus) =>
//             isCorrectDirection(bus.from, bus.to, src, dst)
//           );
//           setMsrtcData(filtered);
//         } else {
//           setMsrtcData([]);
//         }
//       }

//       // 4. Fetch Metro from backend and match client-side
//       const metroResult = await fetchMetro();
//       if (metroResult.success) {
//         const lines = extractMetroArray(metroResult.data);
//         const matched = [];
//         lines.forEach((line) => {
//           const result = matchMetro(line, src, dst);
//           if (result) {
//             matched.push({ ...line, __matched: result });
//           }
//         });
//         setMetroData(matched);
//       } else {
//         setMetroData([]);
//       }
//     } catch (err) {
//       console.error("Route search error:", err);
//       setError("Unable to connect with TransitHub backend. Please check server.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSearch = (e) => {
//     e.preventDefault();
//     performRouteSearch(source, destination);
//   };

//   // Helper for Duration
//   const calculateDuration = (departure, arrival) => {
//     if (!departure || !arrival) return "";
//     try {
//       const parseTime = (time) => {
//         const parts = time.trim().toUpperCase().split(/\s+/);
//         const hm = parts[0].split(":");
//         let hours = Number(hm[0]);
//         const minutes = Number(hm[1]);
//         const period = parts[1];
//         if (period === "PM" && hours !== 12) hours += 12;
//         if (period === "AM" && hours === 12) hours = 0;
//         return hours * 60 + minutes;
//       };

//       let depMinutes = parseTime(departure);
//       let arrMinutes = parseTime(arrival);
//       if (arrMinutes < depMinutes) arrMinutes += 24 * 60;
//       const difference = arrMinutes - depMinutes;
//       const hours = Math.floor(difference / 60);
//       const minutes = difference % 60;

//       if (hours === 0) return `${minutes}min`;
//       if (minutes === 0) return `${hours}hr`;
//       return `${hours}hr ${minutes.toString().padStart(2, "0")}min`;
//     } catch {
//       return "";
//     }
//   };

//   const normalizeTrain = (train) => {
//     return {
//       number: train.train_number || train.trainNumber || train.number || "N/A",
//       name: train.train_name || train.trainName || train.name || "Pune EMU Suburban",
//       dep: train.departure_time || train.departure || train.dep || "N/A",
//       arr: train.arrival_time || train.arrival || train.arr || "N/A",
//       duration:
//         train.duration ||
//         calculateDuration(train.departure_time, train.arrival_time) ||
//         "45 min",
//       runs: train.runs_on || train.runs || "Daily"
//     };
//   };

//   // Build Route Options
//   const getRouteOptions = () => {
//     const options = [];

//     // TRAIN
//     trainData.forEach((train, index) => {
//       const t = normalizeTrain(train);
//       options.push({
//         id: `train-${index}`,
//         type: "train",
//         title: `Local Train - ${t.name}`,
//         badge: "Suburban Railway",
//         badgeColor: "bg-emerald-100 text-emerald-800",
//         duration: t.duration,
//         changes: 0,
//         price: "₹10",
//         frequency: t.runs,
//         steps: [
//           `Board Train #${t.number} at ${source}`,
//           `Departure: ${t.dep}`,
//           `Arrival at destination (${destination}): ${t.arr}`,
//           `Direct EMU Suburban Corridor`
//         ]
//       });
//     });

//     // PMPL BUSES
//     pmplData.forEach((bus, index) => {
//       const route = bus?.route_info || {};
//       const trips = Array.isArray(bus?.trips) ? bus.trips : [];

//       if (trips.length > 0) {
//         trips.forEach((trip, tripIndex) => {
//           options.push({
//             id: `pmpl-${index}-${tripIndex}`,
//             type: "pmpl",
//             title: `PMPL Bus ${route.route_number || bus.route_number || "Route"}`,
//             badge: `Trip ${trip.trip_id || tripIndex + 1}`,
//             badgeColor: "bg-orange-100 text-orange-800",
//             duration: trip.duration || route.estimated_duration || "55 min",
//             changes: 0,
//             // price: bus.fare ? `₹${bus.fare}` : "₹25",
//             frequency: trip.bus_number ? `Bus: ${trip.bus_number}` : "Frequent",
//             steps: [
//               `From: ${route.source || source}`,
//               `To: ${route.destination || destination}`,
//               `Bus Number: ${trip.bus_number || "PMPML Fleet"}`,
//               `Departure: ${trip.departure_time || "Scheduled"}`,
//               `Arrival: ${trip.arrival_time || "Scheduled"}`,
//               bus.stops
//                 ? `Stops: ${
//                     Array.isArray(bus.stops)
//                       ? bus.stops.map((s) => s.stop_name || s).join(" → ")
//                       : bus.stops
//                   }`
//                 : "Direct PMPML city route"
//             ]
//           });
//         });
//       } else {
//         options.push({
//           id: `pmpl-${index}`,
//           type: "pmpl",
//           title: `PMPL Bus ${route.route_number || bus.route_number || ""}`,
//           badge: "PMPML City Route",
//           badgeColor: "bg-orange-100 text-orange-800",
//           duration: route.estimated_duration || bus.duration || "50 min",
//           changes: 0,
//           // price: bus.fare ? `₹${bus.fare}` : "₹25",
//           frequency: bus.frequency || "Available",
//           steps: [
//             `From: ${route.source || source}`,
//             `To: ${route.destination || destination}`,
//             `Scheduled Frequency: ${bus.frequency || "Every 20 mins"}`
//           ]
//         });
//       }
//     });

//     // MSRTC BUSES
//     msrtcData.forEach((bus, index) => {
//       options.push({
//         id: `msrtc-${index}`,
//         type: "msrtc",
//         title: `MSRTC ${bus.bus_name || bus.bus_type || bus.bus_id || "State Transport"}`,
//         badge: bus.bus_type || "MSRTC Service",
//         badgeColor: "bg-blue-100 text-blue-800",
//         duration: bus.duration || bus.travel_time || "60 min",
//         changes: bus.changes || 0,
//         // price: bus.fare ? `₹${bus.fare}` : "₹45",
//         frequency: bus.frequency || "Daily",
//         steps: [
//           `From: ${bus.from || bus.source || source}`,
//           `To: ${bus.to || bus.destination || destination}`,
//           `Departure: ${bus.departure_time || "N/A"}`,
//           `Arrival: ${bus.arrival_time || "N/A"}`,
//           bus.route_via
//             ? `Via: ${Array.isArray(bus.route_via) ? bus.route_via.join(" → ") : bus.route_via}`
//             : "Direct highway service"
//         ]
//       });
//     });

//     // PUNE METRO (dynamic - from backend /api/metro/getallmetro)
//     metroData.forEach((metro, index) => {
//       const stations = metro?.__matched?.stations || [];
//       const stopCount = stations.length > 1 ? stations.length - 1 : 0;
//       const lineName =
//         metro.line_name || metro.lineName || metro.name || metro.line || "Pune Metro";

//       let duration = metro.duration || metro.travel_time || metro.estimated_duration;
//       if (!duration) {
//         duration = stopCount > 0 ? `${Math.max(stopCount * 2, 5)} min` : "25 min";
//       }

//       const firstTrain = metro.first_train || metro.start_time;
//       const lastTrain = metro.last_train || metro.end_time;
//       const hours =
//         metro.operating_hours ||
//         metro.timings ||
//         (firstTrain && lastTrain ? `${firstTrain} to ${lastTrain}` : null);

//       const steps = [];
//       if (stations.length > 0) {
//         steps.push(`Board Metro at ${stations[0]}`);
//         steps.push(`Alight at ${stations[stations.length - 1]}`);
//         if (stations.length > 2) {
//           steps.push(`Stations: ${stations.join(" → ")}`);
//         }
//       } else {
//         steps.push(`From: ${metro.from || metro.source || source}`);
//         steps.push(`To: ${metro.to || metro.destination || destination}`);
//       }
//       steps.push("Fast AC Rapid Transit avoiding city traffic");
//       if (hours) {
//         steps.push(`Operating hours: ${hours}`);
//       }

//       options.push({
//         id: `metro-${index}`,
//         type: "metro",
//         title: `Pune Metro - ${lineName}`,
//         badge: "Rapid Transit",
//         badgeColor: "bg-purple-100 text-purple-800",
//         duration,
//         changes: metro.changes || 0,
//         // price: metro.fare ? `₹${metro.fare}` : "₹20",
//         frequency: metro.frequency || metro.headway || "Frequent",
//         steps
//       });
//     });

//     return options;
//   };

//   const routeOptions = getRouteOptions();
//   const filteredRoutes = routeOptions.filter(
//     (item) => selectedMode === "all" || item.type === selectedMode
//   );

//   return (
//     <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
//       <Navbar />

//       {/* ROUTE PLANNER HEADER */}
//       <section className="bg-gradient-to-b from-orange-50 via-white to-gray-50 pt-10 pb-8 px-4 sm:px-6 lg:px-8 border-b">
//         <div className="max-w-4xl mx-auto text-center space-y-3">
//           <span className="bg-orange-100 text-orange-700 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
//             Smart Transit Routing
//           </span>
//           <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
//             🧭 Route Planner
//           </h1>
//           <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
//             Find the quickest and most affordable transit options connecting Local Trains, PMPML, Metro, and MSRTC.
//           </p>
//         </div>

//         {/* SEARCH CARD */}
//         <div
//           id="search-section"
//           className="max-w-3xl mx-auto mt-8 bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden"
//         >
//           <div className="p-6 md:p-8">
//             <form onSubmit={handleSearch} className="space-y-4">
//               <div className="flex flex-col md:flex-row items-center gap-3">
//                 {/* SOURCE */}
//                 <div className="w-full">
//                   <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
//                     START LOCATION (FROM)
//                   </label>
//                   <div className="flex items-center border border-gray-300 focus-within:border-orange-500 rounded-2xl px-4 py-3 bg-gray-50 focus-within:bg-white transition">
//                     <span className="mr-2 text-lg">🟢</span>
//                     <input
//                       type="text"
//                       value={source}
//                       onChange={(e) => setSource(e.target.value)}
//                       placeholder="e.g. Talegaon Dabhade"
//                       className="w-full bg-transparent outline-none font-semibold text-gray-800"
//                       required
//                     />
//                   </div>
//                 </div>

//                 {/* SWAP BUTTON */}
//                 <div className="pt-5 md:pt-5">
//                   <button
//                     type="button"
//                     onClick={swapLocations}
//                     title="Swap Start & Destination"
//                     className="p-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-md hover:scale-105 active:scale-95 transition cursor-pointer"
//                   >
//                     🔄
//                   </button>
//                 </div>

//                 {/* DESTINATION */}
//                 <div className="w-full">
//                   <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
//                     DESTINATION (TO)
//                   </label>
//                   <div className="flex items-center border border-gray-300 focus-within:border-orange-500 rounded-2xl px-4 py-3 bg-gray-50 focus-within:bg-white transition">
//                     <span className="mr-2 text-lg">🔴</span>
//                     <input
//                       type="text"
//                       value={destination}
//                       onChange={(e) => setDestination(e.target.value)}
//                       placeholder="e.g. Pune Junction"
//                       className="w-full bg-transparent outline-none font-semibold text-gray-800"
//                       required
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* QUICK SUGGESTIONS */}
//               <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-gray-500">
//                 <span className="font-semibold">Quick picks:</span>
//                 {[
//                   { from: "Talegaon Dabhade", to: "Pune Junction" },
//                   { from: "Pune Junction", to: "Talegaon Dabhade" },
//                   { from: "Shivajinagar", to: "Swargate" },
//                   { from: "Pimpri", to: "Pune Station" }
//                 ].map((item, i) => (
//                   <button
//                     key={i}
//                     type="button"
//                     onClick={() => {
//                       setSource(item.from);
//                       setDestination(item.to);
//                       performRouteSearch(item.from, item.to);
//                     }}
//                     className="bg-gray-100 hover:bg-orange-100 hover:text-orange-700 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer"
//                   >
//                     {item.from.split(" ")[0]} ➔ {item.to.split(" ")[0]}
//                   </button>
//                 ))}
//               </div>

//               {/* SUBMIT BUTTON */}
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold py-4 rounded-2xl text-lg shadow-lg shadow-orange-500/25 transition disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
//               >
//                 {loading ? (
//                   <>
//                     <span className="animate-spin text-xl">🔄</span>
//                     <span>Finding Best Routes...</span>
//                   </>
//                 ) : (
//                   <>
//                     <span>🔍</span>
//                     <span>Search Best Route Options</span>
//                   </>
//                 )}
//               </button>
//             </form>
//           </div>
//         </div>
//       </section>

//       {/* ERROR BANNER */}
//       {error && (
//         <div className="max-w-4xl mx-auto px-4 mt-6 w-full">
//           <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl flex items-center space-x-3 text-sm font-semibold">
//             <span>⚠️</span>
//             <span>{error}</span>
//           </div>
//         </div>
//       )}

//       {/* ROUTE RESULTS */}
//       <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow">
//         <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
//           <div>
//             <h2 className="text-2xl font-black text-gray-900">
//               Routes for <span className="text-orange-600">{source}</span> ➔{" "}
//               <span className="text-orange-600">{destination}</span>
//             </h2>
//             <p className="text-xs text-gray-500 mt-0.5">
//               Showing  schedules
//             </p>
//           </div>

//           {/* MODE FILTER PILLS */}
//           <div className="flex flex-wrap gap-1.5 bg-gray-200/80 p-1 rounded-xl">
//             {[
//               { id: "all", label: "All Modes" },
//               { id: "train", label: "🚆 Train" },
//               { id: "pmpl", label: "🚌 PMPL" },
//               { id: "metro", label: "🚇 Metro" },
//               { id: "msrtc", label: "🚍 MSRTC" }
//             ].map((mode) => (
//               <button
//                 key={mode.id}
//                 onClick={() => setSelectedMode(mode.id)}
//                 className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
//                   selectedMode === mode.id
//                     ? "bg-white text-orange-600 shadow-sm"
//                     : "text-gray-600 hover:text-gray-900"
//                 }`}
//               >
//                 {mode.label}
//               </button>
//             ))}
//           </div>
//         </div>


//         {/* LOADING INDICATOR */}
//         {loading && (
//           <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-200 space-y-4">
//             <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
//             <p className="font-semibold text-gray-600 text-sm">Searching real-time transport routes across Pune...</p>
//           </div>
//         )}

//         {/* EMPTY STATE */}
//         {!loading && searched && filteredRoutes.length === 0 && (
//           <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-200 space-y-3">
//             <div className="text-5xl">🚌</div>
//             <h3 className="font-bold text-xl text-gray-900">No Direct Transit Data Found</h3>
//             <p className="text-gray-500 text-sm max-w-md mx-auto">
//               We couldn't find a direct route for "{source}" ➔ "{destination}". Try searching with major terminals like "Talegaon Dabhade", "Pune Junction", or "Shivajinagar".
//             </p>
//           </div>
//         )}

//         {/* ROUTE CARDS LIST */}
//         {!loading && filteredRoutes.length > 0 && (
//           <div className="space-y-4">
//             {filteredRoutes.map((option) => (
//               <div
//                 key={option.id}
//                 className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-lg border border-gray-200 transition-all duration-200 space-y-4"
//               >
//                 <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4">
//                   <div className="flex items-center space-x-3">
//                     <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0">
//                       {option.type === "train" && "🚆"}
//                       {option.type === "pmpl" && "🚌"}
//                       {option.type === "metro" && "🚇"}
//                       {option.type === "msrtc" && "🚍"}
//                     </div>
//                     <div>
//                       <h3 className="text-lg font-bold text-gray-900">{option.title}</h3>
//                       <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full mt-1 ${option.badgeColor}`}>
//                         {option.badge}
//                       </span>
//                     </div>
//                   </div>

//                   <div className="flex items-center gap-6 self-end sm:self-auto text-right">
//                     <div>
//                       <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
//                         Est. Duration
//                       </div>
//                       <div className="font-black text-gray-900 text-base">{option.duration}</div>
//                     </div>

//                     <div>
//                       <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
//                         Transfers
//                       </div>
//                       <div className="font-black text-orange-600 text-base">
//                         {option.changes === 0 ? "Direct" : `${option.changes} Change`}
//                       </div>
//                     </div>

                    
//                   </div>
//                 </div>

//                 {/* ROUTE STEPS */}
//                 <div>
//                   <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">
//                     Route Information & Stops
//                   </h4>
//                   <ul className="space-y-2">
//                     {option.steps.map((step, idx) => (
//                       <li key={idx} className="flex items-start text-sm text-gray-700 space-x-2.5">
//                         <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
//                           {idx + 1}
//                         </span>
//                         <span className="leading-snug">{step}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       <Footer />
//     </div>
//   );
// }

import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import {
  fetchTrains,
  fetchPMPL,
  searchPMPL,
  fetchMSRTC,
  searchMSRTC,
  fetchMetro
} from "../api/apiendpoint.jsx";

export default function RoutePlannerPage() {
  const [searchParams] = useSearchParams();

  const [source, setSource] = useState(
    searchParams.get("from") || "Talegaon Dabhade"
  );
  const [destination, setDestination] = useState(
    searchParams.get("to") || "Pune Junction"
  );
  
  // NEW: Departure Time filter state (default to current time or empty)
  const [departureTime, setDepartureTime] = useState("");

  const [selectedMode, setSelectedMode] = useState("all");
  const [searched, setSearched] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [trainData, setTrainData] = useState([]);
  const [pmplData, setPmplData] = useState([]);
  const [msrtcData, setMsrtcData] = useState([]);
  const [metroData, setMetroData] = useState([]);

  // ==========================================
  // TEXT & DIRECTION UTILITIES
  // ==========================================
  const normalizeText = (value) => {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
  };

  const isTalegaon = (value) => {
    const text = normalizeText(value);
    return text.includes("talegaon") || text.includes("tgn");
  };

  const isPune = (value) => {
    const text = normalizeText(value);
    return (
      text.includes("pune") ||
      text.includes("pune junction") ||
      text.includes("pune station")
    );
  };

  const isCorrectDirection = (from, to, customSrc = source, customDst = destination) => {
    const fromTalegaon = isTalegaon(from);
    const fromPune = isPune(from);
    const toTalegaon = isTalegaon(to);
    const toPune = isPune(to);

    if (isTalegaon(customSrc) && isPune(customDst)) {
      return fromTalegaon && toPune;
    }

    if (isPune(customSrc) && isTalegaon(customDst)) {
      return fromPune && toTalegaon;
    }

    const nFrom = normalizeText(from);
    const nTo = normalizeText(to);
    const nSrc = normalizeText(customSrc);
    const nDst = normalizeText(customDst);

    return (
      (nFrom.includes(nSrc) || nSrc.includes(nFrom)) &&
      (nTo.includes(nDst) || nDst.includes(nTo))
    );
  };

  const extractArray = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.schedules)) return response.schedules;
    if (Array.isArray(response?.trains)) return response.trains;
    if (Array.isArray(response?.buses)) return response.buses;
    if (Array.isArray(response?.routes)) return response.routes;
    if (Array.isArray(response?.result)) return response.result;
    return [];
  };

  const extractMetroArray = (response) => {
    const direct = extractArray(response);
    if (direct.length > 0) return direct;
    if (Array.isArray(response?.metro)) return response.metro;
    if (Array.isArray(response?.lines)) return response.lines;
    if (Array.isArray(response?.metros)) return response.metros;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (response?.data && typeof response.data === "object" && !Array.isArray(response.data)) {
      return [response.data];
    }
    return [];
  };

  const stationCore = (value) => {
    let text = normalizeText(value);
    if (text.includes("pimpri") || text.includes("pcmc")) return "pcmc";
    text = text
      .replace(/\b(junction|jn|station|stn|railway|metro|terminal|road)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text;
  };

  const stationMatches = (stationName, query) => {
    const n = normalizeText(stationName);
    const q = normalizeText(query);
    if (!n || !q) return false;
    if (n.includes(q) || q.includes(n)) return true;
    const nc = stationCore(stationName);
    const qc = stationCore(query);
    if (!nc || !qc) return false;
    return nc === qc || nc.includes(qc) || qc.includes(nc);
  };

  const getMetroStationNames = (metro) => {
    const list =
      metro?.stations ||
      metro?.stops ||
      metro?.station_list ||
      metro?.route_stations ||
      [];
    if (!Array.isArray(list)) return [];
    return list
      .map((s) =>
        typeof s === "string"
          ? s
          : s?.station_name || s?.stop_name || s?.name || s?.shortName || ""
      )
      .filter(Boolean);
  };

  const matchMetro = (metro, src, dst) => {
    const names = getMetroStationNames(metro);

    if (names.length > 0) {
      const srcIdx = names.findIndex((n) => stationMatches(n, src));
      const dstIdx = names.findIndex((n) => stationMatches(n, dst));
      if (srcIdx === -1 || dstIdx === -1 || srcIdx === dstIdx) return null;

      const stations =
        srcIdx < dstIdx
          ? names.slice(srcIdx, dstIdx + 1)
          : names.slice(dstIdx, srcIdx + 1).reverse();
      return { stations };
    }

    const from = metro?.from || metro?.source || metro?.route_info?.source;
    const to = metro?.to || metro?.destination || metro?.route_info?.destination;
    if (from && to && isCorrectDirection(from, to, src, dst)) {
      return { stations: [] };
    }

    return null;
  };

  useEffect(() => {
    performRouteSearch(source, destination);
  }, []);

  const swapLocations = () => {
    const tempSrc = source;
    const tempDst = destination;
    setSource(tempDst);
    setDestination(tempSrc);
    performRouteSearch(tempDst, tempSrc);
  };

  const performRouteSearch = async (src, dst) => {
    setSearched(true);
    setLoading(true);
    setError("");

    try {
      // 1. Trains
      const trainResult = await fetchTrains();
      if (trainResult.success) {
        const schedules = extractArray(trainResult.data);
        const filteredSchedules = schedules.filter((schedule) => {
          const route = schedule?.route;
          if (!route) return false;
          return isCorrectDirection(route.from, route.to, src, dst);
        });

        const trains = [];
        filteredSchedules.forEach((schedule) => {
          if (Array.isArray(schedule.trains)) {
            schedule.trains.forEach((train) => {
              trains.push({
                ...train,
                route: schedule.route
              });
            });
          }
        });
        setTrainData(trains);
      } else {
        setTrainData([]);
      }

      // 2. PMPML
      const pmplResult = await searchPMPL(src, dst);
      if (pmplResult.success && pmplResult.data?.data) {
        const data = pmplResult.data.data;
        setPmplData(Array.isArray(data) ? data : [data]);
      } else {
        const allPmpl = await fetchPMPL();
        if (allPmpl.success) {
          const data = allPmpl.data?.data;
          if (Array.isArray(data)) {
            const matched = data.filter((item) =>
              isCorrectDirection(item.route_info?.source, item.route_info?.destination, src, dst)
            );
            setPmplData(matched);
          } else if (data?.route_info && isCorrectDirection(data.route_info.source, data.route_info.destination, src, dst)) {
            setPmplData([data]);
          } else {
            setPmplData([]);
          }
        } else {
          setPmplData([]);
        }
      }

      // 3. MSRTC
      const msrtcResult = await searchMSRTC(src, dst);
      if (msrtcResult.success) {
        const data = extractArray(msrtcResult.data);
        const filtered = data.filter((bus) =>
          isCorrectDirection(bus.from, bus.to, src, dst)
        );
        setMsrtcData(filtered);
      } else {
        const allMsrtc = await fetchMSRTC();
        if (allMsrtc.success) {
          const data = extractArray(allMsrtc.data);
          const filtered = data.filter((bus) =>
            isCorrectDirection(bus.from, bus.to, src, dst)
          );
          setMsrtcData(filtered);
        } else {
          setMsrtcData([]);
        }
      }

      // 4. Metro
      const metroResult = await fetchMetro();
      if (metroResult.success) {
        const lines = extractMetroArray(metroResult.data);
        const matched = [];
        lines.forEach((line) => {
          const result = matchMetro(line, src, dst);
          if (result) {
            matched.push({ ...line, __matched: result });
          }
        });
        setMetroData(matched);
      } else {
        setMetroData([]);
      }
    } catch (err) {
      console.error("Route search error:", err);
      setError("Unable to connect with TransitHub backend. Please check server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performRouteSearch(source, destination);
  };

  // Time conversion helper (converts "HH:MM AM/PM" or "HH:mm" to total minutes from midnight)
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    try {
      let clean = timeStr.trim().toUpperCase();
      let hours = 0;
      let minutes = 0;

      if (clean.includes("AM") || clean.includes("PM")) {
        const parts = clean.split(/\s+/);
        const hm = parts[0].split(":");
        hours = Number(hm[0]);
        minutes = Number(hm[1] || 0);
        const period = parts[1];
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
    try {
      let depMinutes = parseTimeToMinutes(departure);
      let arrMinutes = parseTimeToMinutes(arrival);
      if (arrMinutes < depMinutes) arrMinutes += 24 * 60;
      const difference = arrMinutes - depMinutes;
      const hours = Math.floor(difference / 60);
      const minutes = difference % 60;

      if (hours === 0) return `${minutes}min`;
      if (minutes === 0) return `${hours}hr`;
      return `${hours}hr ${minutes.toString().padStart(2, "0")}min`;
    } catch {
      return "";
    }
  };

  const normalizeTrain = (train) => {
    return {
      number: train.train_number || train.trainNumber || train.number || "N/A",
      name: train.train_name || train.trainName || train.name || "Pune EMU Suburban",
      dep: train.departure_time || train.departure || train.dep || "N/A",
      arr: train.arrival_time || train.arrival || train.arr || "N/A",
      duration:
        train.duration ||
        calculateDuration(train.departure_time, train.arrival_time) ||
        "45 min",
      runs: train.runs_on || train.runs || "Daily"
    };
  };

  // Build Route Options & Apply Time Filtering & Sorting
  const getRouteOptions = () => {
    const options = [];

    // 1. TRAIN
    trainData.forEach((train, index) => {
      const t = normalizeTrain(train);
      options.push({
        id: `train-${index}`,
        type: "train",
        title: `Local Train - ${t.name}`,
        badge: "Suburban Railway",
        badgeColor: "bg-emerald-100 text-emerald-800",
        departureTime: t.dep,
        arrivalTime: t.arr,
        duration: t.duration,
        changes: 0,
        price: "₹10",
        frequency: t.runs,
        steps: [
          `Board Train #${t.number} at ${source}`,
          `Departure: ${t.dep}`,
          `Arrival at destination (${destination}): ${t.arr}`,
          `Direct EMU Suburban Corridor`
        ]
      });
    });

    // 2. PMPL BUSES
    pmplData.forEach((bus, index) => {
      const route = bus?.route_info || {};
      const trips = Array.isArray(bus?.trips) ? bus.trips : [];

      if (trips.length > 0) {
        trips.forEach((trip, tripIndex) => {
          options.push({
            id: `pmpl-${index}-${tripIndex}`,
            type: "pmpl",
            title: `PMPL Bus ${route.route_number || bus.route_number || "Route"}`,
            badge: `Trip ${trip.trip_id || tripIndex + 1}`,
            badgeColor: "bg-orange-100 text-orange-800",
            departureTime: trip.departure_time || "08:00 AM",
            arrivalTime: trip.arrival_time || "09:00 AM",
            duration: trip.duration || route.estimated_duration || "55 min",
            changes: 0,
            frequency: trip.bus_number ? `Bus: ${trip.bus_number}` : "Frequent",
            steps: [
              `From: ${route.source || source}`,
              `To: ${route.destination || destination}`,
              `Bus Number: ${trip.bus_number || "PMPML Fleet"}`,
              `Departure: ${trip.departure_time || "Scheduled"}`,
              `Arrival: ${trip.arrival_time || "Scheduled"}`,
              bus.stops
                ? `Stops: ${
                    Array.isArray(bus.stops)
                      ? bus.stops.map((s) => s.stop_name || s).join(" → ")
                      : bus.stops
                  }`
                : "Direct PMPML city route"
            ]
          });
        });
      } else {
        options.push({
          id: `pmpl-${index}`,
          type: "pmpl",
          title: `PMPL Bus ${route.route_number || bus.route_number || ""}`,
          badge: "PMPML City Route",
          badgeColor: "bg-orange-100 text-orange-800",
          departureTime: "08:00 AM",
          arrivalTime: "09:00 AM",
          duration: route.estimated_duration || bus.duration || "50 min",
          changes: 0,
          frequency: bus.frequency || "Available",
          steps: [
            `From: ${route.source || source}`,
            `To: ${route.destination || destination}`,
            `Scheduled Frequency: ${bus.frequency || "Every 20 mins"}`
          ]
        });
      }
    });

    // 3. MSRTC BUSES
    msrtcData.forEach((bus, index) => {
      options.push({
        id: `msrtc-${index}`,
        type: "msrtc",
        title: `MSRTC ${bus.bus_name || bus.bus_type || bus.bus_id || "State Transport"}`,
        badge: bus.bus_type || "MSRTC Service",
        badgeColor: "bg-blue-100 text-blue-800",
        departureTime: bus.departure_time || "08:30 AM",
        arrivalTime: bus.arrival_time || "09:30 AM",
        duration: bus.duration || bus.travel_time || "60 min",
        changes: bus.changes || 0,
        frequency: bus.frequency || "Daily",
        steps: [
          `From: ${bus.from || bus.source || source}`,
          `To: ${bus.to || bus.destination || destination}`,
          `Departure: ${bus.departure_time || "N/A"}`,
          `Arrival: ${bus.arrival_time || "N/A"}`,
          bus.route_via
            ? `Via: ${Array.isArray(bus.route_via) ? bus.route_via.join(" → ") : bus.route_via}`
            : "Direct highway service"
        ]
      });
    });

    // 4. PUNE METRO
    metroData.forEach((metro, index) => {
      const stations = metro?.__matched?.stations || [];
      const stopCount = stations.length > 1 ? stations.length - 1 : 0;
      const lineName =
        metro.line_name || metro.lineName || metro.name || metro.line || "Pune Metro";

      let duration = metro.duration || metro.travel_time || metro.estimated_duration;
      if (!duration) {
        duration = stopCount > 0 ? `${Math.max(stopCount * 2, 5)} min` : "25 min";
      }

      const firstTrain = metro.first_train || metro.start_time || "06:00 AM";
      const lastTrain = metro.last_train || metro.end_time || "10:00 PM";
      const hours =
        metro.operating_hours ||
        metro.timings ||
        (firstTrain && lastTrain ? `${firstTrain} to ${lastTrain}` : null);

      const steps = [];
      if (stations.length > 0) {
        steps.push(`Board Metro at ${stations[0]}`);
        steps.push(`Alight at ${stations[stations.length - 1]}`);
        if (stations.length > 2) {
          steps.push(`Stations: ${stations.join(" → ")}`);
        }
      } else {
        steps.push(`From: ${metro.from || metro.source || source}`);
        steps.push(`To: ${metro.to || metro.destination || destination}`);
      }
      steps.push("Fast AC Rapid Transit avoiding city traffic");
      if (hours) {
        steps.push(`Operating hours: ${hours}`);
      }

      options.push({
        id: `metro-${index}`,
        type: "metro",
        title: `Pune Metro - ${lineName}`,
        badge: "Rapid Transit",
        badgeColor: "bg-purple-100 text-purple-800",
        departureTime: firstTrain,
        arrivalTime: lastTrain,
        duration,
        changes: metro.changes || 0,
        frequency: metro.frequency || metro.headway || "Frequent",
        steps
      });
    });

    // Filtering by user-selected departure time if provided
    let filtered = options;
    if (departureTime) {
      const userMinutes = parseTimeToMinutes(departureTime);
      filtered = options.filter((item) => {
        const itemMinutes = parseTimeToMinutes(item.departureTime);
        // Keep transit options departing at or after the user's selected time (within same day)
        return itemMinutes >= userMinutes;
      });
    }

    // Sort chronologically by departure time
    filtered.sort((a, b) => {
      return parseTimeToMinutes(a.departureTime) - parseTimeToMinutes(b.departureTime);
    });

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

              {/* NEW: DEPARTURE TIME INPUT */}
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
              {departureTime ? `Showing options departing from ${departureTime} onwards, sorted by time.` : "Showing all available schedules sorted chronologically."}
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
            <p className="font-semibold text-gray-600 text-sm">Searching real-time transport routes across Pune...</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && searched && filteredRoutes.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-200 space-y-3">
            <div className="text-5xl">🚌</div>
            <h3 className="font-bold text-xl text-gray-900">No Matching Transit Schedules Found</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              We couldn't find any transit options from "{source}" to "{destination}" {departureTime ? `at or after ${departureTime}` : ""}. Try adjusting your time or search terms.
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
                        <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ${option.badgeColor}`}>
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