const db = require("../database/db");

const allowedCurrencies = [
  "INR (Rs)",
  "USD ($)",
  "EUR (€)",
];

const allowedDistanceUnits = [
  "Kilometers",
  "Miles",
];

const getSettings = (req, res) => {
  try {
    const settings = db
      .prepare(`
        SELECT
          id,
          depot_name,
          currency,
          distance_unit,
          updated_at
        FROM settings
        WHERE id = 1
      `)
      .get();

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Get settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load settings",
    });
  }
};

const updateSettings = (req, res) => {
  try {
    const {
      depot_name,
      currency,
      distance_unit,
    } = req.body;

    if (
      !depot_name?.trim() ||
      !currency ||
      !distance_unit
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Depot name, currency and distance unit are required",
      });
    }

    if (!allowedCurrencies.includes(currency)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported currency selected",
      });
    }

    if (!allowedDistanceUnits.includes(distance_unit)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported distance unit selected",
      });
    }

    db.prepare(`
      UPDATE settings
      SET
        depot_name = ?,
        currency = ?,
        distance_unit = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(
      depot_name.trim(),
      currency,
      distance_unit
    );

    const settings = db
      .prepare(`
        SELECT
          id,
          depot_name,
          currency,
          distance_unit,
          updated_at
        FROM settings
        WHERE id = 1
      `)
      .get();

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Update settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update settings",
    });
  }
};

const getRolePermissions = (req, res) => {
  try {
    const permissions = [
      {
        role: "Fleet Manager",
        fleet: "Manage",
        drivers: "Manage",
        trips: "View",
        maintenance: "Manage",
        costs: "View",
        analytics: "View",
        settings: "Manage",
      },
      {
        role: "Dispatcher",
        fleet: "View",
        drivers: "View",
        trips: "Manage",
        maintenance: "View",
        costs: "View",
        analytics: "View",
        settings: "View",
      },
      {
        role: "Safety Officer",
        fleet: "View",
        drivers: "Manage",
        trips: "View",
        maintenance: "View",
        costs: "None",
        analytics: "View",
        settings: "View",
      },
      {
        role: "Financial Analyst",
        fleet: "View",
        drivers: "None",
        trips: "View",
        maintenance: "View",
        costs: "Manage",
        analytics: "Manage",
        settings: "View",
      },
    ];

    return res.status(200).json({
      success: true,
      permissions,
      currentUser: req.user,
    });
  } catch (error) {
    console.error("Get permissions error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load role permissions",
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getRolePermissions,
};