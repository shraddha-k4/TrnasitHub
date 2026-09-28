import mongoose from "mongoose";

const stopSchema = new mongoose.Schema(
  {
    stop_order: {
      type: Number,
      required: true
    },
    stop_name: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    trip_id: {
      type: String,
      required: true
    },
    bus_number: {
      type: String,
      required: true
    },
    departure_time: {
      type: String,
      required: true
    },
    arrival_time: {
      type: String,
      required: true
    },
    duration: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const busRouteSchema = new mongoose.Schema(
  {
    route_info: {
      route_number: {
        type: String,
        required: true
      },
      source: {
        type: String,
        required: true
      },
      destination: {
        type: String,
        required: true
      },
      total_distance_km: {
        type: Number,
        required: true
      },
      estimated_duration: {
        type: String,
        required: true
      },
      operator: {
        type: String,
        required: true
      }
    },

    stops: {
      type: [stopSchema],
      required: true
    },

    trips: {
      type: [tripSchema],
      required: true
    }
  },
  {
    timestamps: true
  }
);

const PmplModel = mongoose.model("PmplRoute", busRouteSchema);

export default PmplModel;