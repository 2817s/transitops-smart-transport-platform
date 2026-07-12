const express = require("express");

const {
  getDrivers,
  createDriver,
  updateDriverStatus,
} = require("../controllers/driverController");

const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getDrivers);

router.post(
  "/",
  authMiddleware,
  allowRoles("Safety Officer", "Fleet Manager"),
  createDriver
);

router.patch(
  "/:id/status",
  authMiddleware,
  allowRoles("Safety Officer", "Fleet Manager"),
  updateDriverStatus
);

module.exports = router;