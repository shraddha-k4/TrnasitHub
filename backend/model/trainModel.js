import mongoose from "mongoose";

const trainSchema = new mongoose.Schema(
  {
    train_number: {
      type: String,
      required: true
    },

    train_name: {
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
    },

    runs_on: {
      type: String,
      required: true
    }
  },
  {
    _id: false
  }
);

const trainScheduleSchema = new mongoose.Schema(
  {
    route: {
      from: {
        type: String,
        required: true
      },

      to: {
        type: String,
        required: true
      }
    },

    trains: {
      type: [trainSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

const TrainSchedule = mongoose.model(
  "TrainSchedule",
  trainScheduleSchema
);

export default TrainSchedule;