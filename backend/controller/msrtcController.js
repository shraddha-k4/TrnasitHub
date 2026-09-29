import MSRTCBus from "../model/msrtcBusModel.js";


export const createBus = async (req, res) => {
  try {
    const { route, bus_schedule } = req.body;

    const buses = bus_schedule.map((bus) => ({
      bus_id: bus.bus_id,
      from: route.from,
      to: route.to,
      operator: route.operator,
      departure_time: bus.departure_time,
      arrival_time: bus.arrival_time,
      duration: "1 hour 30 minutes",
      bus_type: bus.bus_type,
      route_via: bus.route_via.split(",").map((stop) => stop.trim()),
      destination: bus.destination,
      frequency: bus.frequency,
    }));

    const createdBuses = await MSRTCBus.insertMany(buses);

    res.status(201).json({
      success: true,
      message: "MSRTC buses created successfully",
      count: createdBuses.length,
      data: createdBuses,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// GET ALL BUSES
export const getAllBuses = async (req, res) => {
  try {
    const buses = await MSRTCBus.find();

    res.status(200).json({
      success: true,
      count: buses.length,
      data: buses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// GET BUS BY ID
export const getBusById = async (req, res) => {
  try {
    const bus = await MSRTCBus.findOne({
      bus_id: req.params.busId,
    });

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found",
      });
    }

    res.status(200).json({
      success: true,
      data: bus,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// UPDATE BUS
export const updateBus = async (req, res) => {
  try {
    const bus = await MSRTCBus.findOneAndUpdate(
      {
        bus_id: req.params.busId,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Bus updated successfully",
      data: bus,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// DELETE BUS
export const deleteBus = async (req, res) => {
  try {
    const bus = await MSRTCBus.findOneAndDelete({
      bus_id: req.params.busId,
    });

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Bus deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// GET STOPS
export const getStops = async (req, res) => {
  try {
    const bus = await MSRTCBus.findOne({
      bus_id: req.params.busId,
    });

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found",
      });
    }

    res.status(200).json({
      success: true,
      bus_id: bus.bus_id,
      from: bus.from,
      destination: bus.destination,
      stops: bus.route_via,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// GET TIME
export const getBusTime = async (req, res) => {
  try {
    const bus = await MSRTCBus.findOne({
      bus_id: req.params.busId,
    });

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found",
      });
    }

    res.status(200).json({
      success: true,
      bus_id: bus.bus_id,
      departure_time: bus.departure_time,
      arrival_time: bus.arrival_time,
      duration: bus.duration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// SEARCH BUS
export const searchBus = async (req, res) => {
  try {
    const { from, to } = req.query;

    const buses = await MSRTCBus.find({
      from: {
        $regex: from || "",
        $options: "i",
      },
      to: {
        $regex: to || "",
        $options: "i",
      },
    });

    res.status(200).json({
      success: true,
      count: buses.length,
      data: buses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};