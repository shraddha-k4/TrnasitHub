import PmplModel from "../model/pmplmodel.js";



// Get all bus routes
export const getAllBusRoutes = async (req, res) => {
  try {
    const routes = await PmplModel.find();

    res.status(200).json({
      success: true,
      count: routes.length,
      data: routes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch bus routes",
      error: error.message
    });
  }
};


// Get route by route number
export const getBusRouteByNumber = async (req, res) => {
  try {
    const { routeNumber } = req.params;

    const route = await PmplModel.findOne({
      "route_info.route_number": routeNumber
    });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: `Bus route ${routeNumber} not found`
      });
    }

    res.status(200).json({
      success: true,
      data: route
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch bus route",
      error: error.message
    });
  }
};


// Search route by source and destination
export const searchBusRoute = async (req, res) => {
  try {
    const { source, destination } = req.query;

    if (!source || !destination) {
      return res.status(400).json({
        success: false,
        message: "Source and destination are required"
      });
    }

    const route = await PmplModel.findOne({
      "route_info.source": {
        $regex: source,
        $options: "i"
      },
      "route_info.destination": {
        $regex: destination,
        $options: "i"
      }
    });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "No bus route found"
      });
    }

    res.status(200).json({
      success: true,
      data: route
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to search bus route",
      error: error.message
    });
  }
};


// Get all trips of a particular route
export const getTrips = async (req, res) => {
  try {
    const { routeNumber } = req.params;

    const route = await PmplModel.findOne({
      "route_info.route_number": routeNumber
    });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Route not found"
      });
    }

    res.status(200).json({
      success: true,
      route_number: route.route_info.route_number,
      trips: route.trips
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch trips",
      error: error.message
    });
  }
};


// Get all stops of a particular route
export const getStops = async (req, res) => {
  try {
    const { routeNumber } = req.params;

    const route = await PmplModel.findOne({
      "route_info.route_number": routeNumber
    });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Route not found"
      });
    }

    res.status(200).json({
      success: true,
      route_number: route.route_info.route_number,
      stops: route.stops
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch stops",
      error: error.message
    });
  }
};



// Create Bus Route
export const createBusRoute = async (req, res) => {
  try {
    const { route_info, stops, trips } = req.body;

    // Basic validation
    if (!route_info || !stops || !trips) {
      return res.status(400).json({
        success: false,
        message: "route_info, stops and trips are required"
      });
    }

    // Check if route already exists
    const existingRoute = await PmplModel.findOne({
      "route_info.route_number": route_info.route_number
    });

    if (existingRoute) {
      return res.status(409).json({
        success: false,
        message: `Route ${route_info.route_number} already exists`
      });
    }

    // Create route in MongoDB
    const newRoute = await PmplModel.create({
      route_info,
      stops,
      trips
    });

    res.status(201).json({
      success: true,
      message: "PMPML bus route created successfully",
      data: newRoute
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create bus route",
      error: error.message
    });
  }
};