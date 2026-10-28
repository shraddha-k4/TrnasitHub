
// import MSRTCBus from "../model/msrtcBusModel.js";
// import PmplModel from "../model/PmplModel.js";
// import TrainSchedule from "../model/trainModel.js";

// const normalize = (value) =>
//   String(value ?? "").trim().toLowerCase();

// const matchesLocation = (storedLocation, searchLocation) =>
//   normalize(storedLocation).includes(normalize(searchLocation));

// export const getRoutePlanner = async (req, res) => {
//   try {
//     const { from, to } = req.query;

//     if (!from || !to) {
//       return res.status(400).json({
//         success: false,
//         message: "Starting location and destination are required",
//       });
//     }

//     const [buses, pmplRoutes, schedules] = await Promise.all([
//       MSRTCBus.find().lean(),
//       PmplModel.find().lean(),
//       TrainSchedule.find().lean(),
//     ]);

//     const results = [];

//     // 1. Search MSRTC buses
//     for (const bus of buses) {
//       const startMatches = matchesLocation(bus.from, from);

//       const destinationMatches =
//         matchesLocation(bus.to, to) ||
//         matchesLocation(bus.destination, to) ||
//         (bus.route_via ?? []).some((stop) =>
//           matchesLocation(stop, to)
//         );

//       if (startMatches && destinationMatches) {
//         results.push({
//           mode: "MSRTC",
//           id: bus.bus_id,
//           from: bus.from,
//           to: bus.to,
//           operator: bus.operator ?? "MSRTC",
//           departure_time: bus.departure_time ?? "",
//           arrival_time: bus.arrival_time ?? "",
//           duration: bus.duration ?? "",
//         });
//       }
//     }

    
    
//     // 2. Search PMPML routes using source, destination and stops
//     for (const route of pmplRoutes) {
//       const info = route.route_info ?? {};
//       const stops = (route.stops ?? []).map((stop) =>
//         normalize(stop.stop_name)
//       );

//       const source = info.source ?? "";
//       const destination = info.destination ?? "";

//       const sourceMatches = matchesLocation(source, from) ||
//         stops.some((stop) => stop.includes(normalize(from)));

//       const destinationMatches =
//         matchesLocation(destination, to) ||
//         stops.some((stop) => stop.includes(normalize(to)));

//       // Ensure destination occurs at or after the starting stop
//       const startIndex = stops.findIndex((stop) =>
//         stop.includes(normalize(from))
//       );
//       const endIndex = stops.findIndex((stop) =>
//         stop.includes(normalize(to))
//       );

//       const validStopOrder =
//         startIndex !== -1 && endIndex !== -1 && endIndex > startIndex;

//       if (
//         (sourceMatches && destinationMatches) &&
//         (
//           matchesLocation(source, from) &&
//           matchesLocation(destination, to) ||
//           validStopOrder
//         )
//       ) {
//         for (const trip of route.trips ?? []) {
//           results.push({
//             mode: "PMPML",
//             id: trip.trip_id ?? info.route_number ?? "",
//             from,
//             to,
//             operator: info.operator ?? "PMPML",
//             departure_time: trip.departure_time ?? "",
//             arrival_time: trip.arrival_time ?? "",
//             duration: trip.duration ?? info.estimated_duration ?? "",
//           });
//         }
//       }
//     }

//     // 3. Search Train schedules
//     const stationMatches = (stored, search) => {
//       const s = normalize(stored);
//       const q = normalize(search);

//       if (s.includes(q)) return true;

//       if (q === "talegaon") return s.includes("talegaon") || s.includes("tgn");
//       if (q === "pune") return s.includes("pune");
//       if (q === "shivajinagar") return s.includes("shivajinagar");

//       return false;
//     };

//     for (const schedule of schedules) {
//       const routeInfo = schedule.route ?? {};
//       const source = routeInfo.from ?? "";
//       const destination = routeInfo.to ?? "";

//       if (
//         stationMatches(source, from) &&
//         stationMatches(destination, to)
//       ) {
//         for (const train of schedule.trains ?? []) {
//           results.push({
//             mode: "Train",
//             id: train.train_number ?? "",
//             from: source,
//             to: destination,
//             operator: train.train_name ?? "Indian Railways",
//             departure_time: train.departure_time ?? "",
//             arrival_time: train.arrival_time ?? "",
//             duration: train.duration ?? "",
//           });
//         }
//       }
//     }

//     // 4. Sort routes by departure time
//     const getMinutes = (time) => {
//       if (!time) return Infinity;

//       const match = time
//         .trim()
//         .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

//       if (!match) return Infinity;

//       let hours = Number(match[1]);
//       const minutes = Number(match[2]);
//       const period = match[3].toUpperCase();

//       if (period === "AM" && hours === 12) hours = 0;
//       if (period === "PM" && hours !== 12) hours += 12;

//       return hours * 60 + minutes;
//     };

//     results.sort(
//       (a, b) =>
//         getMinutes(a.departure_time) -
//         getMinutes(b.departure_time)
//     );

//     return res.status(200).json({
//       success: true,
//       count: results.length,
//       data: results,
//     });
//   } catch (error) {
//     console.error("Route planner error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch routes",
//       error: error.message,
//     });
//   }
// };



import MSRTCBus from "../model/msrtcBusModel.js";
import PmplModel from "../model/PmplModel.js";
import TrainSchedule from "../model/trainModel.js";

const normalize = (value) =>
  String(value ?? "").trim().toLowerCase();

const matchesLocation = (stored, search) => {
  const s = normalize(stored);
  const q = normalize(search);

  if (!s || !q) return false;
  if (s === q || s.includes(q)) return true;

  // Common station aliases
  const aliases = {
    talegaon: ["talegaon", "tgn"],
    pune: ["pune", "pune junction"],
    shivajinagar: ["shivajinagar", "shivaji nagar"],
    pcmc: ["pcmc", "pimpri-chinchwad"],
  };

  const searchAliases = Object.entries(aliases).find(
    ([key, values]) =>
      key === q || values.some((value) => value === q)
  )?.[1];

  return searchAliases
    ? searchAliases.some((value) => s.includes(value))
    : false;
};

// Convert time into minutes for sorting
const getMinutes = (time) => {
  if (!time) return Infinity;

  const match = String(time)
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) return Infinity;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();

  if (hours < 1 || hours > 12 || minutes > 59) {
    return Infinity;
  }

  if (period === "AM" && hours === 12) hours = 0;
  if (period === "PM" && hours !== 12) hours += 12;

  return hours * 60 + minutes;
};

export const getRoutePlanner = async (req, res) => {
  try {
    const { from, to, mode } = req.query;

    if (!from?.trim() || !to?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Starting location and destination are required",
      });
    }

    if (normalize(from) === normalize(to)) {
      return res.status(400).json({
        success: false,
        message: "Starting location and destination must be different",
      });
    }

    const selectedMode = normalize(mode || "all");

    if (!["all", "train", "msrtc", "pmpl", "pmpml"].includes(selectedMode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mode. Use all, train, msrtc, or pmpl",
      });
    }

    const searchMSRTC =
      selectedMode === "all" || selectedMode === "msrtc";

    const searchPMPML =
      selectedMode === "all" ||
      selectedMode === "pmpl" ||
      selectedMode === "pmpml";

    const searchTrains =
      selectedMode === "all" || selectedMode === "train";

    const [buses, pmplRoutes, schedules] = await Promise.all([
      searchMSRTC ? MSRTCBus.find().lean() : [],
      searchPMPML ? PmplModel.find().lean() : [],
      searchTrains ? TrainSchedule.find().lean() : [],
    ]);

    const results = [];

    // 1. Search MSRTC buses
    for (const bus of buses) {
      const startMatches = matchesLocation(bus.from, from);

      const destinationMatches =
        matchesLocation(bus.to, to) ||
        matchesLocation(bus.destination, to) ||
        (bus.route_via ?? []).some((stop) =>
          matchesLocation(stop, to)
        );

      if (startMatches && destinationMatches) {
        results.push({
          mode: "MSRTC",
          id: bus.bus_id ?? String(bus._id),
          from: bus.from,
          to: bus.to,
          operator: bus.operator ?? "MSRTC",
          departure_time: bus.departure_time ?? "",
          arrival_time: bus.arrival_time ?? "",
          duration: bus.duration ?? "",
          bus_type: bus.bus_type ?? "",
          route_via: bus.route_via ?? [],
          frequency: bus.frequency ?? "",
        });
      }
    }

    // 2. Search PMPML routes
    for (const route of pmplRoutes) {
      const info = route.route_info ?? {};

      // stops is an array of objects, not strings
      const stops = (route.stops ?? [])
        .slice()
        .sort(
          (a, b) =>
            Number(a.stop_order ?? 0) -
            Number(b.stop_order ?? 0)
        )
        .map((stop) => stop.stop_name ?? "");

      const source = info.source ?? "";
      const destination = info.destination ?? "";

      const startIndex = stops.findIndex((stop) =>
        matchesLocation(stop, from)
      );

      const endIndex = stops.findIndex((stop) =>
        matchesLocation(stop, to)
      );

      // Allow matching the route endpoints as well as intermediate stops
      const sourceMatches = matchesLocation(source, from);
      const destinationMatches = matchesLocation(destination, to);

      const directRoute =
        sourceMatches && destinationMatches;

      const validStopOrder =
        startIndex !== -1 &&
        endIndex !== -1 &&
        endIndex > startIndex;

      if (!directRoute && !validStopOrder) continue;

      for (const trip of route.trips ?? []) {
        results.push({
          mode: "PMPML",
          id: trip.trip_id ?? info.route_number ?? "",
          route_number: info.route_number ?? "",
          bus_number: trip.bus_number ?? info.route_number ?? "",
          from,
          to,
          route_source: source,
          route_destination: destination,
          operator: info.operator ?? "PMPML",
          departure_time: trip.departure_time ?? "",
          arrival_time: trip.arrival_time ?? "",
          duration:
            trip.duration ?? info.estimated_duration ?? "",
          distance_km: info.total_distance_km ?? null,
          stops,
        });
      }
    }

    // 3. Search train schedules
    for (const schedule of schedules) {
      const routeInfo = schedule.route ?? {};
      const source = routeInfo.from ?? "";
      const destination = routeInfo.to ?? "";

      if (
        !matchesLocation(source, from) ||
        !matchesLocation(destination, to)
      ) {
        continue;
      }

      for (const train of schedule.trains ?? []) {
        results.push({
          mode: "Train",
          id: train.train_number ?? "",
          train_number: train.train_number ?? "",
          from,
          to,
          route_source: source,
          route_destination: destination,
          operator: train.train_name ?? "Indian Railways",
          departure_time: train.departure_time ?? "",
          arrival_time: train.arrival_time ?? "",
          duration: train.duration ?? "",
          runs_on: train.runs_on ?? "",
          stops: train.stops ?? [],
        });
      }
    }

    // 4. Sort all results by departure time
    results.sort(
      (a, b) =>
        getMinutes(a.departure_time) -
        getMinutes(b.departure_time)
    );

    return res.status(200).json({
      success: true,
      count: results.length,
      from,
      to,
      mode: selectedMode,
      data: results,
    });
  } catch (error) {
    console.error("Route planner error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch routes",
      error: error.message,
    });
  }
};
