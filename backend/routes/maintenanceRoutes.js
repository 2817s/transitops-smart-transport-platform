const express = require("express");

const {
  getMaintenanceLogs,
  createMaintenanceLog,
  completeMaintenance,
} = require("../controllers/maintenanceController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  getMaintenanceLogs
);

router.post(
  "/",
  authMiddleware,
  createMaintenanceLog
);

router.patch(
  "/:id/complete",
  authMiddleware,
  completeMaintenance
);

module.exports = router;