// import TrainSchedule from "../model/trainModel.js";


// // ======================================
// // CREATE COMPLETE TRAIN DATASET
// // ======================================
// export const createTrainSchedule = async (req, res) => {
//   try {
//     const { route, trains } = req.body;

//     // Check route
//     if (!route || !route.from || !route.to) {
//       return res.status(400).json({
//         success: false,
//         message: "Route information is required"
//       });
//     }

//     // Check trains
//     if (!trains || !Array.isArray(trains)) {
//       return res.status(400).json({
//         success: false,
//         message: "Trains must be an array"
//       });
//     }

//     // Check if schedule already exists
//     const existingSchedule = await TrainSchedule.findOne({
//       "route.from": route.from,
//       "route.to": route.to
//     });

//     if (existingSchedule) {
//       return res.status(400).json({
//         success: false,
//         message: "Train schedule for this route already exists"
//       });
//     }

//     // Create dataset
//     const schedule = new TrainSchedule({
//       route: route,
//       trains: trains
//     });

//     await schedule.save();

//     res.status(201).json({
//       success: true,
//       message: "Train dataset created successfully",
//       route: schedule.route,
//       count: schedule.trains.length,
//       trains: schedule.trains
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };


// // ======================================
// // GET ALL TRAIN DATA
// // ======================================
// export const getTrains = async (req, res) => {
//   try {
//     const schedules = await TrainSchedule.find();

//     if (!schedules || schedules.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Train schedules not found"
//       });
//     }

//     res.status(200).json({
//       success: true,
//       count: schedules.length,
//       schedules: schedules
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };
// // ======================================
// // PUSH - ADD ONE NEW TRAIN
// // ======================================
// export const pushTrain = async (req, res) => {
//   try {
//     const newTrain = req.body;

//     const schedule = await TrainSchedule.findOne();

//     if (!schedule) {
//       return res.status(404).json({
//         success: false,
//         message: "Train schedule not found. Create dataset first."
//       });
//     }

//     // Duplicate check
//     const alreadyExists = schedule.trains.some(
//       train => train.train_number === newTrain.train_number
//     );

//     if (alreadyExists) {
//       return res.status(400).json({
//         success: false,
//         message: "Train already exists"
//       });
//     }

//     // Add train
//     schedule.trains.push(newTrain);

//     await schedule.save();

//     res.status(201).json({
//       success: true,
//       message: "Train added successfully",
//       train: newTrain,
//       count: schedule.trains.length
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };


// // ======================================
// // POP - REMOVE LAST TRAIN
// // ======================================
// export const popTrain = async (req, res) => {
//   try {
//     const schedule = await TrainSchedule.findOne();

//     if (!schedule) {
//       return res.status(404).json({
//         success: false,
//         message: "Train schedule not found"
//       });
//     }

//     if (schedule.trains.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "No trains available"
//       });
//     }

//     // Remove last train
//     const removedTrain = schedule.trains.pop();

//     await schedule.save();

//     res.status(200).json({
//       success: true,
//       message: "Last train removed successfully",
//       removedTrain: removedTrain,
//       count: schedule.trains.length
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };


// // ======================================
// // PUT - UPDATE TRAIN
// // ======================================
// export const updateTrain = async (req, res) => {
//   try {
//     const { train_number } = req.params;

//     const schedule = await TrainSchedule.findOne();

//     if (!schedule) {
//       return res.status(404).json({
//         success: false,
//         message: "Train schedule not found"
//       });
//     }

//     const train = schedule.trains.find(
//       train => train.train_number === train_number
//     );

//     if (!train) {
//       return res.status(404).json({
//         success: false,
//         message: "Train not found"
//       });
//     }

//     // Update fields
//     train.train_name = req.body.train_name;
//     train.departure_time = req.body.departure_time;
//     train.arrival_time = req.body.arrival_time;
//     train.duration = req.body.duration;
//     train.runs_on = req.body.runs_on;

//     await schedule.save();

//     res.status(200).json({
//       success: true,
//       message: "Train updated successfully",
//       train: train
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };


import TrainSchedule from "../model/trainModel.js";

// ======================================
// CREATE COMPLETE TRAIN DATASET
// ======================================
export const createTrainSchedule = async (req, res) => {
  try {
    const { route, trains } = req.body;

    if (!route?.from || !route?.to) {
      return res.status(400).json({
        success: false,
        message: "Route information is required",
      });
    }

    if (!Array.isArray(trains)) {
      return res.status(400).json({
        success: false,
        message: "Trains must be an array",
      });
    }

    const existingSchedule = await TrainSchedule.findOne({
      "route.from": route.from,
      "route.to": route.to,
    });

    if (existingSchedule) {
      return res.status(400).json({
        success: false,
        message: "Train schedule for this route already exists",
      });
    }

    const schedule = new TrainSchedule({
      route: {
        from: route.from,
        to: route.to,
      },
      trains: trains.map((train) => ({
        ...train,
        stops: Array.isArray(train.stops) ? train.stops : [],
      })),
    });

    await schedule.save();

    return res.status(201).json({
      success: true,
      message: "Train dataset created successfully",
      route: schedule.route,
      count: schedule.trains.length,
      trains: schedule.trains,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// GET ALL TRAIN DATA
// ======================================
export const getTrains = async (req, res) => {
  try {
    const schedules = await TrainSchedule.find().lean();

    if (schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Train schedules not found",
      });
    }

    return res.status(200).json({
      success: true,
      count: schedules.length,
      schedules,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// PUSH - ADD ONE NEW TRAIN
// ======================================
export const pushTrain = async (req, res) => {
  try {
    const newTrain = req.body;

    if (!newTrain.train_number) {
      return res.status(400).json({
        success: false,
        message: "Train number is required",
      });
    }

    const schedule = await TrainSchedule.findOne();

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Train schedule not found. Create dataset first.",
      });
    }

    const alreadyExists = schedule.trains.some(
      (train) => train.train_number === newTrain.train_number
    );

    if (alreadyExists) {
      return res.status(400).json({
        success: false,
        message: "Train already exists",
      });
    }

    schedule.trains.push({
      ...newTrain,
      stops: Array.isArray(newTrain.stops) ? newTrain.stops : [],
    });

    await schedule.save();

    const addedTrain = schedule.trains.find(
      (train) => train.train_number === newTrain.train_number
    );

    return res.status(201).json({
      success: true,
      message: "Train added successfully",
      train: addedTrain,
      count: schedule.trains.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// POP - REMOVE LAST TRAIN
// ======================================
export const popTrain = async (req, res) => {
  try {
    const schedule = await TrainSchedule.findOne();

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Train schedule not found",
      });
    }

    if (schedule.trains.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No trains available",
      });
    }

    const removedTrain = schedule.trains.pop();

    await schedule.save();

    return res.status(200).json({
      success: true,
      message: "Last train removed successfully",
      removedTrain,
      count: schedule.trains.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// PUT - UPDATE TRAIN DETAILS AND STOPS
// ======================================
export const updateTrain = async (req, res) => {
  try {
    const { train_number } = req.params;

    const schedule = await TrainSchedule.findOne({
      "trains.train_number": train_number,
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Train not found",
      });
    }

    const train = schedule.trains.find(
      (item) => item.train_number === train_number
    );

    // Update only fields supplied in the request.
    if (req.body.train_name !== undefined) {
      train.train_name = req.body.train_name;
    }

    if (req.body.departure_time !== undefined) {
      train.departure_time = req.body.departure_time;
    }

    if (req.body.arrival_time !== undefined) {
      train.arrival_time = req.body.arrival_time;
    }

    if (req.body.duration !== undefined) {
      train.duration = req.body.duration;
    }

    if (req.body.runs_on !== undefined) {
      train.runs_on = req.body.runs_on;
    }

    // Add or replace stops only when stops is supplied.
    if (req.body.stops !== undefined) {
      if (!Array.isArray(req.body.stops)) {
        return res.status(400).json({
          success: false,
          message: "Stops must be an array",
        });
      }

      train.stops = req.body.stops;
    }

    await schedule.save();

    return res.status(200).json({
      success: true,
      message: "Train updated successfully",
      train,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
