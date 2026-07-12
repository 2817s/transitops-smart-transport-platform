const express = require("express");

const {
  getVehicles,
  createVehicle,
} = require("../controllers/vehicleController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getVehicles);

router.post("/", authMiddleware, createVehicle);

module.exports = router;