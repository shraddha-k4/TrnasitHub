
import MSRTCBus from "../model/msrtcBusModel.js";
import PmplModel from "../model/PmplModel.js";
import TrainSchedule from "../model/trainModel.js";

function text(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    return String(
      value.name ??
      value.stop_name ??
      value.station_name ??
      value.code ??
      ""
    );
  }
  return String(value);
}

function toStops(value) {
  if (!Array.isArray(value)) {
    if (typeof value === "string") {
      return value.split(",").map(s => s.trim()).filter(Boolean);
    }
    return [];
  }

  return value.map(item => {
    if (typeof item === "string") return item.trim();

    return text(
      item?.stop_name ??
      item?.station_name ??
      item?.name ??
      item?.stop ??
      item?.location ??
      ""
    ).trim();
  }).filter(Boolean);
}

function addRoute(results, route) {
  route.stops = toStops(route.stops);

  // Include endpoint names in the searchable stop list.
  const allStops = [
    route.from,
    ...route.stops,
    route.to
  ].map(text).filter(Boolean);

  route.stops = allStops.filter(
    (stop, index) =>
      allStops.findIndex(
        item => item.toLowerCase() === stop.toLowerCase()
      ) === index
  );

  results.push({
    mode: route.mode || "",
    route_number: text(route.route_number),
    route_name: text(route.route_name),
    from: text(route.from),
    to: text(route.to),
    operator: text(route.operator),
    departure_time: text(route.departure_time),
    arrival_time: text(route.arrival_time),
    duration: text(route.duration),
    stops: route.stops,
    searchable: [
      route.mode,
      route.route_number,
      route.route_name,
      route.from,
      route.to,
      route.operator,
      route.bus_type,
      ...route.stops
    ].map(text).filter(Boolean).join(" ")
  });
}

export async function getAllRoutesForC(req, res) {
  try {
    const [buses, pmplRoutes, trainRoutes] = await Promise.all([
      MSRTCBus.find({}).lean(),
      PmplModel.find({}).lean(),
      TrainSchedule.find({}).lean()
    ]);

    const results = [];

    // 1. MSRTC buses
    for (const bus of buses) {
      const stops = [
        ...toStops(bus.route_via),
        ...toStops(bus.stops)
      ];

      addRoute(results, {
        mode: "MSRTC",
        route_number: bus.bus_id ?? bus.route_number ?? "",
        route_name: bus.bus_type ?? bus.operator ?? "MSRTC Bus",
        from: bus.from,
        to: bus.to ?? bus.destination,
        operator: bus.operator ?? "MSRTC",
        departure_time: bus.departure_time,
        arrival_time: bus.arrival_time,
        duration: bus.duration,
        bus_type: bus.bus_type,
        stops
      });
    }

    // 2. PMPML routes. Each trip becomes a separate result.
    for (const item of pmplRoutes) {
      const info = item.route_info ?? item.route ?? {};
      const routeStops = toStops(item.stops);
      const trips = Array.isArray(item.trips) ? item.trips : [];

      if (trips.length === 0) {
        addRoute(results, {
          mode: "PMPML",
          route_number: info.route_number ?? item.route_number,
          route_name: info.operator ?? "PMPML City Bus",
          from: info.source ?? item.source,
          to: info.destination ?? item.destination,
          operator: info.operator ?? "PMPML",
          departure_time: item.departure_time,
          arrival_time: item.arrival_time,
          duration: info.estimated_duration ?? item.duration,
          stops: routeStops
        });
      }

      for (const trip of trips) {
        addRoute(results, {
          mode: "PMPML",
          route_number: info.route_number ?? item.route_number,
          route_name: trip.bus_number ?? "PMPML City Bus",
          from: info.source ?? item.source,
          to: info.destination ?? item.destination,
          operator: info.operator ?? "PMPML",
          departure_time: trip.departure_time,
          arrival_time: trip.arrival_time,
          duration: trip.duration ?? info.estimated_duration,
          stops: routeStops
        });
      }
    }

    // 3. Trains. Each train becomes a separate result.
    for (const item of trainRoutes) {
      const route = item.route ?? {};
      const trains = Array.isArray(item.trains) ? item.trains : [];

      for (const train of trains) {
        const trainStops = toStops(train.stops);

        addRoute(results, {
          mode: "Train",
          route_number: train.train_number ?? train.trainNo,
          route_name: train.train_name ?? train.trainName,
          from: route.from ?? item.source ?? train.source,
          to: route.to ?? item.destination ?? train.destination,
          operator: "Indian Railways",
          departure_time: train.departure_time ?? train.departure,
          arrival_time: train.arrival_time ?? train.arrival,
          duration: train.duration,
          stops: trainStops
        });
      }
    }

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error("C route data error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch route data",
      error: error.message
    });
  }
}
