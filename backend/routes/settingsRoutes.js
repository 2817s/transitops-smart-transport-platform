const express = require("express");

const {
  getSettings,
  updateSettings,
  getRolePermissions,
} = require("../controllers/settingsController");

const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  getSettings
);

router.put(
  "/",
  authMiddleware,
  allowRoles("Fleet Manager"),
  updateSettings
);

router.get(
  "/permissions",
  authMiddleware,
  getRolePermissions
);

module.exports = router;