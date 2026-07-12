const express = require("express");

const {
  getDrivers,
  createDriver,
  updateDriverStatus,
} = require("../controllers/driverController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getDrivers);

router.post("/", authMiddleware, createDriver);

router.patch(
  "/:id/status",
  authMiddleware,
  updateDriverStatus
);

module.exports = router;