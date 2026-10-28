
// import express from "express";
// import { getRoutePlanner } from "../controller/routePlannerController.js";
// import { getAllRoutesForC } from "../controller/allRoutesForCController.js";
// const router = express.Router();

// router.get("/", getRoutePlanner);
// router.get("/all-for-c", getAllRoutesForC);

// export default router;

import express from "express";

const router = express.Router();

// ---------- helpers ----------
const str = (v) => (v === undefined || v === null ? "" : String(v).trim());

const toArray = (body) => {
  if (Array.isArray(body)) return body;
  if (!body || typeof body !== "object") return [];
  const keys = ["data", "schedules", "trains", "buses", "routes", "result", "metro", "lines", "metros"];
  for (const k of keys) {
    if (Array.isArray(body[k])) return body[k];
  }
  if (Array.isArray(body?.data?.data)) return body.data.data;
  if (body.data && typeof body.data === "object") return [body.data];
  return [];
};

const stopName = (s) =>
  typeof s === "string"
    ? s.trim()
    : str(s?.stop_name || s?.station_name || s?.name || s?.shortName);

const buildStops = (list, from, to) => {
  const mid = Array.isArray(list) ? list.map(stopName).filter(Boolean) : [];
  const all = [from, ...mid, to].filter(Boolean);
  // remove consecutive duplicates
  return all.filter((s, i) => i === 0 || s.toLowerCase() !== all[i - 1].toLowerCase());
};

const makeRoute = (r) => {
  const stops = r.stops || [];
  return {
    mode: r.mode,
    route_number: str(r.route_number),
    route_name: str(r.route_name),
    from: str(r.from),
    to: str(r.to),
    operator: str(r.operator),
    departure_time: str(r.departure_time),
    arrival_time: str(r.arrival_time),
    duration: str(r.duration),
    stops,
    searchable: [r.mode, r.route_number, r.route_name, r.from, r.to, r.operator, ...stops]
      .map(str)
      .join(" ")
      .toLowerCase()
  };
};

// Calls one of your existing endpoints; returns [] if it fails
const load = async (base, path) => {
  try {
    const res = await fetch(`${base}${path}`);
    if (!res.ok) return [];
    return toArray(await res.json());
  } catch (err) {
    console.error(`route-planner: failed to load ${path}:`, err.message);
    return [];
  }
};

// ---------- GET /api/route-planner/all-for-c ----------
router.get("/all-for-c", async (req, res) => {
  try {
    const base = `${req.protocol}://${req.get("host")}`;

    const [trainDocs, pmplDocs, msrtcDocs, metroDocs] = await Promise.all([
      load(base, "/api/trains/gettrain"),
      load(base, "/api/pmpl/getallpmpl"),
      load(base, "/api/msrtcbus/getallbus"),
      load(base, "/api/metro/getallmetro")
    ]);

    const routes = [];

    // 1. TRAINS: [{ route:{from,to}, trains:[...] }]
    trainDocs.forEach((schedule) => {
      const from = str(schedule?.route?.from);
      const to = str(schedule?.route?.to);
      (Array.isArray(schedule?.trains) ? schedule.trains : []).forEach((t) => {
        routes.push(
          makeRoute({
            mode: "train",
            route_number: t.train_number || t.trainNumber || t.number,
            route_name: t.train_name || t.trainName || t.name || "Pune EMU Suburban",
            from,
            to,
            operator: "Indian Railways",
            departure_time: t.departure_time || t.departure || t.dep,
            arrival_time: t.arrival_time || t.arrival || t.arr,
            duration: t.duration,
            stops: buildStops(t.stops || schedule.stops || schedule.route?.stops, from, to)
          })
        );
      });
    });

    // 2. PMPML: { route_info:{source,destination,route_number,...}, trips:[...], stops:[...] }
    pmplDocs.forEach((bus) => {
      const info = bus?.route_info || {};
      const from = str(info.source || bus.source || bus.from);
      const to = str(info.destination || bus.destination || bus.to);
      const stops = buildStops(bus.stops, from, to);
      const base_ = {
        mode: "pmpl",
        route_number: info.route_number || bus.route_number,
        route_name: info.route_name || `${from} - ${to}`,
        from,
        to,
        operator: "PMPML",
        stops
      };
      const trips = Array.isArray(bus.trips) ? bus.trips : [];
      if (trips.length > 0) {
        trips.forEach((trip) =>
          routes.push(
            makeRoute({
              ...base_,
              departure_time: trip.departure_time,
              arrival_time: trip.arrival_time,
              duration: trip.duration || info.estimated_duration
            })
          )
        );
      } else {
        routes.push(makeRoute({ ...base_, duration: info.estimated_duration || bus.duration }));
      }
    });

    // 3. MSRTC
    msrtcDocs.forEach((bus) => {
      const from = str(bus.from || bus.source);
      const to = str(bus.to || bus.destination);
      const via = Array.isArray(bus.route_via) ? bus.route_via : bus.route_via ? [bus.route_via] : [];
      routes.push(
        makeRoute({
          mode: "msrtc",
          route_number: bus.bus_id || bus.route_number,
          route_name: bus.bus_name || bus.bus_type || "MSRTC",
          from,
          to,
          operator: "MSRTC",
          departure_time: bus.departure_time,
          arrival_time: bus.arrival_time,
          duration: bus.duration || bus.travel_time,
          stops: buildStops(via, from, to)
        })
      );
    });

    // 4. METRO
    metroDocs.forEach((metro) => {
      const list = metro.stations || metro.stops || metro.station_list || metro.route_stations || [];
      const names = Array.isArray(list) ? list.map(stopName).filter(Boolean) : [];
      const from = str(metro.from || metro.source || names[0]);
      const to = str(metro.to || metro.destination || names[names.length - 1]);
      routes.push(
        makeRoute({
          mode: "metro",
          route_number: metro.line_id || metro.line || "",
          route_name: metro.line_name || metro.lineName || metro.name || "Pune Metro",
          from,
          to,
          operator: "Pune Metro",
          departure_time: metro.first_train || metro.start_time,
          arrival_time: metro.last_train || metro.end_time,
          duration: metro.duration || metro.travel_time || metro.estimated_duration,
          stops: names.length ? names : buildStops([], from, to)
        })
      );
    });

    res.status(200).json({ success: true, count: routes.length, data: routes });
  } catch (error) {
    console.error("route-planner error:", error);
    res.status(500).json({ success: false, message: "Failed to build route list" });
  }
});

export default router;