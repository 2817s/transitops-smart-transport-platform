const express = require("express");

const {
  getTrips,
  getDispatchResources,
  createTrip,
  completeTrip,
  cancelTrip,
} = require("../controllers/tripController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getTrips);

router.get(
  "/dispatch-resources",
  authMiddleware,
  getDispatchResources
);

router.post("/", authMiddleware, createTrip);

router.patch(
  "/:id/complete",
  authMiddleware,
  completeTrip
);

router.patch(
  "/:id/cancel",
  authMiddleware,
  cancelTrip
);

module.exports = router;