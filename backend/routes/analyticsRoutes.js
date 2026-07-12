const express = require("express");

const {
  getAnalyticsOverview,
} = require("../controllers/analyticsController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/overview",
  authMiddleware,
  getAnalyticsOverview
);

module.exports = router;