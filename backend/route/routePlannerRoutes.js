import express from "express";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

const router = express.Router();
const execFileAsync = promisify(execFile);

// ---------- C program paths ----------
const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
console.log("ROUTE PLANNER FILE LOADED:", currentFile);
const cProgramDir = path.resolve(currentDir, "../C_program");
const cExecutable = path.join(cProgramDir, "route_planner");

// ---------- Helpers ----------
const str = (v) =>
  v === undefined || v === null ? "" : String(v).trim();

const toArray = (body) => {
  if (Array.isArray(body)) return body;
  if (!body || typeof body !== "object") return [];

  const keys = [
    "data",
    "schedules",
    "trains",
    "buses",
    "routes",
    "result",
  ];

  for (const key of keys) {
    if (Array.isArray(body[key])) return body[key];
  }

  if (Array.isArray(body?.data?.data)) {
    return body.data.data;
  }

  if (body.data && typeof body.data === "object") {
    return [body.data];
  }

  return [];
};

const stopName = (s) =>
  typeof s === "string"
    ? s.trim()
    : str(
        s?.stop_name ||
          s?.station_name ||
          s?.name ||
          s?.shortName
      );

const buildStops = (list, from, to) => {
  const middle = Array.isArray(list)
    ? list.map(stopName).filter(Boolean)
    : [];

  const all = [from, ...middle, to].filter(Boolean);

  return all.filter(
    (stop, index) =>
      index === 0 ||
      stop.toLowerCase() !== all[index - 1].toLowerCase()
  );
};

const makeRoute = (r) => {
  const stops = Array.isArray(r.stops) ? r.stops : [];

  return {
    mode: str(r.mode),
    route_number: str(r.route_number),
    route_name: str(r.route_name),
    from: str(r.from),
    to: str(r.to),
    operator: str(r.operator),
    departure_time: str(r.departure_time),
    arrival_time: str(r.arrival_time),
    duration: str(r.duration),
    stops,
    searchable: [
      r.mode,
      r.route_number,
      r.route_name,
      r.from,
      r.to,
      r.operator,
      ...stops,
    ]
      .map(str)
      .join(" ")
      .toLowerCase(),
  };
};

// ---------- Load existing API data ----------
const load = async (base, endpoint) => {
  try {
    const response = await fetch(`${base}${endpoint}`);

    if (!response.ok) {
      console.error(
        `route-planner: ${endpoint} returned HTTP ${response.status}`
      );
      return [];
    }

    return toArray(await response.json());
  } catch (error) {
    console.error(
      `route-planner: failed to load ${endpoint}:`,
      error.message
    );
    return [];
  }
};

// =====================================================
// GET /api/route-planner/test
// =====================================================
router.get("/test", (req, res) => {
  console.log("TEST ROUTE HIT:", req.originalUrl);

  res.json({
    success: true,
    message: "Route Planner router is connected",
  });
});

// =====================================================
// GET /api/route-planner/all-for-c
// Collect Train, PMPML and MSRTC data for C.
// =====================================================
router.get("/all-for-c", async (req, res) => {
  try {
    const base = `${req.protocol}://${req.get("host")}`;

    const [trainDocs, pmplDocs, msrtcDocs] =
      await Promise.all([
        load(base, "/api/trains/gettrain"),
        load(base, "/api/pmpl/getallpmpl"),
        load(base, "/api/msrtcbus/getallbus"),
      ]);

    const routes = [];

    // ---------- 1. TRAINS ----------
    trainDocs.forEach((schedule) => {
      const from = str(schedule?.route?.from);
      const to = str(schedule?.route?.to);

      const trains = Array.isArray(schedule?.trains)
        ? schedule.trains
        : [];

      trains.forEach((train) => {
        routes.push(
          makeRoute({
            mode: "train",
            route_number:
              train.train_number ||
              train.trainNumber ||
              train.number,
            route_name:
              train.train_name ||
              train.trainName ||
              train.name ||
              "Pune EMU Suburban",
            from,
            to,
            operator: "Indian Railways",
            departure_time:
              train.departure_time ||
              train.departure ||
              train.dep,
            arrival_time:
              train.arrival_time ||
              train.arrival ||
              train.arr,
            duration: train.duration,
            stops: buildStops(
              train.stops ||
                schedule.stops ||
                schedule.route?.stops,
              from,
              to
            ),
          })
        );
      });
    });

    // ---------- 2. PMPML ----------
    pmplDocs.forEach((bus) => {
      const info = bus?.route_info || {};

      const from = str(
        info.source || bus.source || bus.from
      );

      const to = str(
        info.destination || bus.destination || bus.to
      );

      const baseRoute = {
        mode: "pmpl",
        route_number:
          info.route_number || bus.route_number,
        route_name:
          info.route_name || `${from} - ${to}`,
        from,
        to,
        operator: "PMPML",
        stops: buildStops(bus.stops, from, to),
      };

      const trips = Array.isArray(bus.trips)
        ? bus.trips
        : [];

      if (trips.length > 0) {
        trips.forEach((trip) => {
          routes.push(
            makeRoute({
              ...baseRoute,
              departure_time: trip.departure_time,
              arrival_time: trip.arrival_time,
              duration:
                trip.duration || info.estimated_duration,
            })
          );
        });
      } else {
        routes.push(
          makeRoute({
            ...baseRoute,
            duration:
              info.estimated_duration || bus.duration,
          })
        );
      }
    });

    // ---------- 3. MSRTC ----------
    msrtcDocs.forEach((bus) => {
      const from = str(bus.from || bus.source);
      const to = str(bus.to || bus.destination);

      const via = Array.isArray(bus.route_via)
        ? bus.route_via
        : bus.route_via
          ? [bus.route_via]
          : [];

      routes.push(
        makeRoute({
          mode: "msrtc",
          route_number: bus.bus_id || bus.route_number,
          route_name:
            bus.bus_name || bus.bus_type || "MSRTC",
          from,
          to,
          operator: "MSRTC",
          departure_time: bus.departure_time,
          arrival_time: bus.arrival_time,
          duration: bus.duration || bus.travel_time,
          stops: buildStops(via, from, to),
        })
      );
    });

    return res.status(200).json({
      success: true,
      count: routes.length,
      data: routes,
    });
  } catch (error) {
    console.error("route-planner error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to build route list",
    });
  }
});

// =====================================================
// GET /api/route-planner/search-c
// Run C program to search and sort routes.
// =====================================================
router.get("/search-c", async (req, res) => {
  console.log("SEARCH-C ROUTE HIT:", req.originalUrl);

  try {
    const from = str(req.query.from);
    const to = str(req.query.to);
    const departureTime =
      str(req.query.departureTime) || "00:00";
    const keyword = str(req.query.keyword) || "-";

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: "Both from and to locations are required.",
      });
    }

    if (
      from.length > 100 ||
      to.length > 100 ||
      departureTime.length > 20 ||
      keyword.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Search input is too long.",
      });
    }

    const { stdout, stderr } = await execFileAsync(
      cExecutable,
      [from, to, departureTime, keyword],
      {
        cwd: cProgramDir,
        windowsHide: true,
        timeout: 30000,
        maxBuffer: 10 * 1024 * 1024,
      }
    );

    if (stderr) {
      console.log("C program stderr:", stderr);
    }

    const result = JSON.parse(stdout.trim());

    return res.status(200).json(result);
  } catch (error) {
    console.error("C route search failed:", error);

    return res.status(500).json({
      success: false,
      message: "C route search failed.",
      error: error.message,
    });
  }
});

export default router;