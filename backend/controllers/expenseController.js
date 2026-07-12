const db = require("../database/db");

const getFuelLogs = (req, res) => {
  try {
    const fuelLogs = db
      .prepare(`
        SELECT
          fuel_logs.*,
          vehicles.vehicle_name,
          vehicles.registration_number,
          trips.trip_number
        FROM fuel_logs
        INNER JOIN vehicles
          ON fuel_logs.vehicle_id = vehicles.id
        LEFT JOIN trips
          ON fuel_logs.trip_id = trips.id
        ORDER BY fuel_logs.id DESC
      `)
      .all();

    return res.status(200).json({
      success: true,
      fuelLogs,
    });
  } catch (error) {
    console.error("Get fuel logs error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load fuel logs",
    });
  }
};

const createFuelLog = (req, res) => {
  try {
    const {
      vehicle_id,
      trip_id,
      liters,
      fuel_cost,
      fuel_date,
      odometer,
    } = req.body;

    if (!vehicle_id || !liters || !fuel_cost || !fuel_date) {
      return res.status(400).json({
        success: false,
        message:
          "Vehicle, litres, fuel cost and fuel date are required",
      });
    }

    const vehicle = db
      .prepare("SELECT * FROM vehicles WHERE id = ?")
      .get(Number(vehicle_id));

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    const numericLiters = Number(liters);
    const numericFuelCost = Number(fuel_cost);
    const numericOdometer =
      odometer === "" || odometer === undefined
        ? null
        : Number(odometer);

    if (
      Number.isNaN(numericLiters) ||
      numericLiters <= 0 ||
      numericLiters > 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "Litres must be between 0 and 1000",
      });
    }

    if (
      Number.isNaN(numericFuelCost) ||
      numericFuelCost < 0 ||
      numericFuelCost > 1000000
    ) {
      return res.status(400).json({
        success: false,
        message: "Fuel cost is invalid",
      });
    }

    if (
      numericOdometer !== null &&
      (Number.isNaN(numericOdometer) ||
        numericOdometer < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Odometer is invalid",
      });
    }

    const result = db
      .prepare(`
        INSERT INTO fuel_logs (
          vehicle_id,
          trip_id,
          liters,
          fuel_cost,
          fuel_date,
          odometer
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(
        Number(vehicle_id),
        trip_id ? Number(trip_id) : null,
        numericLiters,
        numericFuelCost,
        fuel_date,
        numericOdometer
      );

    const fuelLog = db
      .prepare(`
        SELECT
          fuel_logs.*,
          vehicles.vehicle_name,
          vehicles.registration_number,
          trips.trip_number
        FROM fuel_logs
        INNER JOIN vehicles
          ON fuel_logs.vehicle_id = vehicles.id
        LEFT JOIN trips
          ON fuel_logs.trip_id = trips.id
        WHERE fuel_logs.id = ?
      `)
      .get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: "Fuel log recorded successfully",
      fuelLog,
    });
  } catch (error) {
    console.error("Create fuel log error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create fuel log",
    });
  }
};

const getExpenses = (req, res) => {
  try {
    const expenses = db
      .prepare(`
        SELECT
          expenses.*,
          vehicles.vehicle_name,
          vehicles.registration_number,
          trips.trip_number
        FROM expenses
        INNER JOIN vehicles
          ON expenses.vehicle_id = vehicles.id
        LEFT JOIN trips
          ON expenses.trip_id = trips.id
        ORDER BY expenses.id DESC
      `)
      .all();

    return res.status(200).json({
      success: true,
      expenses,
    });
  } catch (error) {
    console.error("Get expenses error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load expenses",
    });
  }
};

const createExpense = (req, res) => {
  try {
    const {
      vehicle_id,
      trip_id,
      expense_type,
      description,
      amount,
      expense_date,
    } = req.body;

    if (
      !vehicle_id ||
      !expense_type ||
      amount === undefined ||
      !expense_date
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Vehicle, expense type, amount and date are required",
      });
    }

    const vehicle = db
      .prepare("SELECT id FROM vehicles WHERE id = ?")
      .get(Number(vehicle_id));

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    const numericAmount = Number(amount);

    if (
      Number.isNaN(numericAmount) ||
      numericAmount < 0 ||
      numericAmount > 10000000
    ) {
      return res.status(400).json({
        success: false,
        message: "Expense amount is invalid",
      });
    }

    const result = db
      .prepare(`
        INSERT INTO expenses (
          vehicle_id,
          trip_id,
          expense_type,
          description,
          amount,
          expense_date
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(
        Number(vehicle_id),
        trip_id ? Number(trip_id) : null,
        expense_type.trim(),
        description?.trim() || null,
        numericAmount,
        expense_date
      );

    const expense = db
      .prepare(`
        SELECT
          expenses.*,
          vehicles.vehicle_name,
          vehicles.registration_number,
          trips.trip_number
        FROM expenses
        INNER JOIN vehicles
          ON expenses.vehicle_id = vehicles.id
        LEFT JOIN trips
          ON expenses.trip_id = trips.id
        WHERE expenses.id = ?
      `)
      .get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: "Expense recorded successfully",
      expense,
    });
  } catch (error) {
    console.error("Create expense error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create expense",
    });
  }
};

const getCostSummary = (req, res) => {
  try {
    const fuelTotal = db
      .prepare(`
        SELECT COALESCE(SUM(fuel_cost), 0) AS total
        FROM fuel_logs
      `)
      .get().total;

    const expenseTotal = db
      .prepare(`
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM expenses
      `)
      .get().total;

    const maintenanceTotal = db
      .prepare(`
        SELECT COALESCE(SUM(cost), 0) AS total
        FROM maintenance_logs
      `)
      .get().total;

    return res.status(200).json({
      success: true,
      summary: {
        fuelTotal,
        expenseTotal,
        maintenanceTotal,
        operationalTotal:
          Number(fuelTotal) +
          Number(expenseTotal) +
          Number(maintenanceTotal),
      },
    });
  } catch (error) {
    console.error("Get cost summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to calculate cost summary",
    });
  }
};

module.exports = {
  getFuelLogs,
  createFuelLog,
  getExpenses,
  createExpense,
  getCostSummary,
};