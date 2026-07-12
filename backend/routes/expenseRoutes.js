const express = require("express");

const {
  getFuelLogs,
  createFuelLog,
  getExpenses,
  createExpense,
  getCostSummary,
} = require("../controllers/expenseController");

const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/fuel",
  authMiddleware,
  getFuelLogs
);

router.post(
  "/fuel",
  authMiddleware,
  allowRoles("Financial Analyst", "Fleet Manager"),
  createFuelLog
);

router.get(
  "/expenses",
  authMiddleware,
  getExpenses
);

router.post(
  "/expenses",
  authMiddleware,
  allowRoles("Financial Analyst", "Fleet Manager"),
  createExpense
);

router.get(
  "/summary",
  authMiddleware,
  getCostSummary
);

module.exports = router;