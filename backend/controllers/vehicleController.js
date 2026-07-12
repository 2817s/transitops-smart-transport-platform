const db = require("../database/db");

const getVehicles = (req, res) => {
  try {
    const vehicles = db
      .prepare("SELECT * FROM vehicles ORDER BY id DESC")
      .all();

    return res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles,
    });
  } catch (error) {
    console.error("Get vehicles error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch vehicles",
    });
  }
};

const createVehicle = (req, res) => {
  try {
    const {
      registration_number,
      vehicle_name,
      vehicle_model,
      vehicle_type,
      maximum_load_capacity,
      odometer,
      acquisition_cost,
      region,
      status,
    } = req.body;

    if (
      !registration_number ||
      !vehicle_name ||
      !vehicle_type ||
      maximum_load_capacity === undefined ||
      odometer === undefined ||
      acquisition_cost === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required vehicle details",
      });
    }

    const normalizedRegistration = registration_number
      .trim()
      .toUpperCase();

    const existingVehicle = db
      .prepare(`
        SELECT id
        FROM vehicles
        WHERE UPPER(registration_number) = ?
      `)
      .get(normalizedRegistration);

    if (existingVehicle) {
      return res.status(409).json({
        success: false,
        message: "Vehicle registration number already exists",
      });
    }

    const allowedStatuses = [
      "Available",
      "On Trip",
      "In Shop",
      "Retired",
    ];

    const vehicleStatus = status || "Available";

    if (!allowedStatuses.includes(vehicleStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle status",
      });
    }

    if (Number(maximum_load_capacity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Maximum load capacity must be greater than 0",
      });
    }

    if (Number(odometer) < 0) {
      return res.status(400).json({
        success: false,
        message: "Odometer cannot be negative",
      });
    }

    if (Number(acquisition_cost) < 0) {
      return res.status(400).json({
        success: false,
        message: "Acquisition cost cannot be negative",
      });
    }

    const result = db
      .prepare(`
        INSERT INTO vehicles (
          registration_number,
          vehicle_name,
          vehicle_model,
          vehicle_type,
          maximum_load_capacity,
          odometer,
          acquisition_cost,
          region,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        normalizedRegistration,
        vehicle_name.trim(),
        vehicle_model?.trim() || null,
        vehicle_type.trim(),
        Number(maximum_load_capacity),
        Number(odometer),
        Number(acquisition_cost),
        region?.trim() || null,
        vehicleStatus
      );

    const vehicle = db
      .prepare("SELECT * FROM vehicles WHERE id = ?")
      .get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: "Vehicle registered successfully",
      vehicle,
    });
  } catch (error) {
    console.error("Create vehicle error:", error);

    if (
      error.code === "SQLITE_CONSTRAINT_UNIQUE" ||
      error.message?.includes("UNIQUE constraint failed")
    ) {
      return res.status(409).json({
        success: false,
        message: "Vehicle registration number already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to register vehicle",
    });
  }
};

module.exports = {
  getVehicles,
  createVehicle,
};