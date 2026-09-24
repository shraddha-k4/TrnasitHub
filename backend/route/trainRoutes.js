import express from "express";

import {
  createTrainSchedule,
  getTrains,
  pushTrain,
  popTrain,
  updateTrain
} from "../controller/trainController.js";

const router = express.Router();


// CREATE COMPLETE DATASET
router.post("/createtrain", createTrainSchedule);


// GET ALL TRAINS
router.get("/gettrain", getTrains);


// PUSH ONE TRAIN
router.post("/pushtrain", pushTrain);


// POP LAST TRAIN
router.delete("/poptrain", popTrain);


// UPDATE TRAIN
router.put("/:train_number", updateTrain);


export default router;