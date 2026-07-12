const express = require("express");

const {
  getDashboardOverview,
} = require("../controllers/dashboardController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/overview",
  authMiddleware,
  getDashboardOverview
);

module.exports = router;