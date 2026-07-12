const express = require("express");

const {
  getPendingUsers,
  updateUserStatus,
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

const accountApprovalRoles = [
  "Fleet Manager",
  "Dispatcher",
  "Safety Officer",
  "Financial Analyst",
];

router.get(
  "/pending",
  authMiddleware,
  allowRoles(...accountApprovalRoles),
  getPendingUsers
);

router.patch(
  "/:id/status",
  authMiddleware,
  allowRoles(...accountApprovalRoles),
  updateUserStatus
);

module.exports = router;