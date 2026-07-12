const db = require("../database/db");

const getDrivers = (req, res) => {
  try {
    const drivers = db
      .prepare("SELECT * FROM drivers ORDER BY id DESC")
      .all();

    const today = new Date().toISOString().split("T")[0];

    const driversWithLicenseStatus = drivers.map((driver) => ({
      ...driver,
      license_expired:
        driver.license_expiry_date < today,
    }));

    return res.status(200).json({
      success: true,
      count: drivers.length,
      drivers: driversWithLicenseStatus,
    });
  } catch (error) {
    console.error("Get drivers error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch drivers",
    });
  }
};

const createDriver = (req, res) => {
  try {
    const {
      name,
      license_number,
      license_category,
      license_expiry_date,
      contact_number,
      safety_score,
      region,
      status,
    } = req.body;

    if (
      !name ||
      !license_number ||
      !license_category ||
      !license_expiry_date
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, licence number, category and expiry date are required",
      });
    }

    const normalizedLicense = license_number
      .trim()
      .toUpperCase();

    const existingDriver = db
      .prepare(`
        SELECT id
        FROM drivers
        WHERE UPPER(license_number) = ?
      `)
      .get(normalizedLicense);

    if (existingDriver) {
      return res.status(409).json({
        success: false,
        message: "Driver licence number already exists",
      });
    }

    const allowedStatuses = [
      "Available",
      "On Trip",
      "Off Duty",
      "Suspended",
    ];

    const driverStatus = status || "Available";

    if (!allowedStatuses.includes(driverStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid driver status",
      });
    }

    const numericSafetyScore =
      safety_score === undefined ||
      safety_score === ""
        ? 100
        : Number(safety_score);

    if (
      Number.isNaN(numericSafetyScore) ||
      numericSafetyScore < 0 ||
      numericSafetyScore > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Safety score must be between 0 and 100",
      });
    }

    const result = db
      .prepare(`
        INSERT INTO drivers (
          name,
          license_number,
          license_category,
          license_expiry_date,
          contact_number,
          safety_score,
          region,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        name.trim(),
        normalizedLicense,
        license_category.trim(),
        license_expiry_date,
        contact_number?.trim() || null,
        numericSafetyScore,
        region?.trim() || null,
        driverStatus
      );

    const driver = db
      .prepare("SELECT * FROM drivers WHERE id = ?")
      .get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: "Driver registered successfully",
      driver,
    });
  } catch (error) {
    console.error("Create driver error:", error);

    if (
      error.code === "SQLITE_CONSTRAINT_UNIQUE" ||
      error.message?.includes("UNIQUE constraint failed")
    ) {
      return res.status(409).json({
        success: false,
        message: "Driver licence number already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to register driver",
    });
  }
};

const updateDriverStatus = (req, res) => {
  try {
    const { status } = req.body;
    const driverId = Number(req.params.id);

    const allowedStatuses = [
      "Available",
      "On Trip",
      "Off Duty",
      "Suspended",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid driver status",
      });
    }

    const driver = db
      .prepare("SELECT * FROM drivers WHERE id = ?")
      .get(driverId);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    db.prepare(`
      UPDATE drivers
      SET status = ?
      WHERE id = ?
    `).run(status, driverId);

    const updatedDriver = db
      .prepare("SELECT * FROM drivers WHERE id = ?")
      .get(driverId);

    return res.status(200).json({
      success: true,
      message: "Driver status updated successfully",
      driver: updatedDriver,
    });
  } catch (error) {
    console.error("Update driver status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update driver status",
    });
  }
};

module.exports = {
  getDrivers,
  createDriver,
  updateDriverStatus,
};