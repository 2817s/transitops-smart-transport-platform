const express = require("express");

const {
  getMaintenanceLogs,
  createMaintenanceLog,
  completeMaintenance,
} = require("../controllers/maintenanceController");

const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  getMaintenanceLogs
);

router.post(
  "/",
  authMiddleware,
  allowRoles("Fleet Manager"),
  createMaintenanceLog
);

router.patch(
  "/:id/complete",
  authMiddleware,
  allowRoles("Fleet Manager"),
  completeMaintenance
);

module.exports = router;