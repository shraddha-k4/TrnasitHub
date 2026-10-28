import mongoose from "mongoose";

// Individual station/stop details
const trainStopSchema = new mongoose.Schema(
  {
    stop_name: {
      type: String,
      required: true,
      trim: true,
    },

    arrival_time: {
      type: String,
      default: "",
    },

    departure_time: {
      type: String,
      default: "",
    },

    stop_number: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false,
  }
);

// Existing train details + new stops array
const trainSchema = new mongoose.Schema(
  {
    train_number: {
      type: String,
      required: true,
    },

    train_name: {
      type: String,
      required: true,
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
      required: true,
    },

    runs_on: {
      type: String,
      required: true,
    },

    // NEW FIELD: Intermediate stations for each train
    stops: {
      type: [trainStopSchema],
      default: [],
    },
  },
  {
    _id: false,
  }
);

// Existing route structure remains unchanged
const trainScheduleSchema = new mongoose.Schema(
  {
    route: {
      from: {
        type: String,
        required: true,
      },

      to: {
        type: String,
        required: true,
      },
    },

    trains: {
      type: [trainSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const TrainSchedule = mongoose.model(
  "TrainSchedule",
  trainScheduleSchema
);

export default TrainSchedule;
