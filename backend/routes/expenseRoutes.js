const express = require("express");

const {
  getFuelLogs,
  createFuelLog,
  getExpenses,
  createExpense,
  getCostSummary,
} = require("../controllers/expenseController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/fuel", authMiddleware, getFuelLogs);
router.post("/fuel", authMiddleware, createFuelLog);

router.get("/expenses", authMiddleware, getExpenses);
router.post("/expenses", authMiddleware, createExpense);

router.get("/summary", authMiddleware, getCostSummary);

module.exports = router;