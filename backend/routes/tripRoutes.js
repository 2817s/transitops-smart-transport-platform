const express = require("express");

const {
  getTrips,
  getDispatchResources,
  createTrip,
  completeTrip,
  cancelTrip,
} = require("../controllers/tripController");

const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getTrips);

router.get(
  "/dispatch-resources",
  authMiddleware,
  getDispatchResources
);

router.post(
  "/",
  authMiddleware,
  allowRoles("Dispatcher", "Fleet Manager"),
  createTrip
);

router.patch(
  "/:id/complete",
  authMiddleware,
  allowRoles("Dispatcher", "Fleet Manager"),
  completeTrip
);

router.patch(
  "/:id/cancel",
  authMiddleware,
  allowRoles("Dispatcher", "Fleet Manager"),
  cancelTrip
);

module.exports = router;