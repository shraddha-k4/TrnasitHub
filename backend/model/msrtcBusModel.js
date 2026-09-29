import mongoose from "mongoose";

const msrtcBusSchema = new mongoose.Schema(
  {
    bus_id: {
      type: String,
      required: true,
      unique: true,
    },

    from: {
      type: String,
      required: true,
    },

    to: {
      type: String,
      required: true,
    },

    operator: {
      type: String,
      default: "MSRTC",
    },

    departure_time: {
      type: String,
      required: true,
    },

    arrival_time: {
      type: String,
      required: true,
    },

    duration: {
      type: String,
    },

    bus_type: {
      type: String,
      required: true,
    },

    route_via: {
      type: [String],
      required: true,
    },

    destination: {
      type: String,
      required: true,
    },

    frequency: {
      type: String,
      default: "Daily",
    },
  },
  {
    timestamps: true,
  }
);

const MSRTCBus = mongoose.model("MSRTCBus", msrtcBusSchema);

export default MSRTCBus;