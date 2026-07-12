const db = require("../database/db");

const getMaintenanceLogs = (req, res) => {
  try {
    const maintenanceLogs = db
      .prepare(`
        SELECT
          maintenance_logs.id,
          maintenance_logs.vehicle_id,
          maintenance_logs.service_type,
          maintenance_logs.description,
          maintenance_logs.cost,
          maintenance_logs.service_date,
          maintenance_logs.status,
          maintenance_logs.completed_at,
          maintenance_logs.created_at,
          vehicles.registration_number,
          vehicles.vehicle_name,
          vehicles.vehicle_model,
          vehicles.vehicle_type,
          vehicles.region,
          vehicles.status AS vehicle_status
        FROM maintenance_logs
        INNER JOIN vehicles
          ON maintenance_logs.vehicle_id = vehicles.id
        ORDER BY maintenance_logs.id DESC
      `)
      .all();

    return res.status(200).json({
      success: true,
      maintenanceLogs,
    });
  } catch (error) {
    console.error("Get maintenance logs error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load maintenance records",
    });
  }
};

const createMaintenanceLog = (req, res) => {
  try {
    const {
      vehicle_id,
      service_type,
      description,
      cost,
      service_date,
    } = req.body;

    if (!vehicle_id || !service_type || !service_date) {
      return res.status(400).json({
        success: false,
        message:
          "Vehicle, service type and service date are required",
      });
    }

    const vehicle = db
      .prepare(`
        SELECT *
        FROM vehicles
        WHERE id = ?
      `)
      .get(vehicle_id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    if (vehicle.status === "On Trip") {
      return res.status(400).json({
        success: false,
        message:
          "Vehicle currently on a trip cannot enter maintenance",
      });
    }

    if (vehicle.status === "Retired") {
      return res.status(400).json({
        success: false,
        message:
          "Retired vehicle cannot enter active maintenance",
      });
    }

    if (vehicle.status === "In Shop") {
      return res.status(400).json({
        success: false,
        message: "Vehicle is already in maintenance",
      });
    }

    const maintenanceCost = Number(cost || 0);

    if (
      Number.isNaN(maintenanceCost) ||
      maintenanceCost < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Maintenance cost must be valid",
      });
    }

    const createMaintenanceTransaction =
      db.transaction(() => {
        const result = db
          .prepare(`
            INSERT INTO maintenance_logs (
              vehicle_id,
              service_type,
              description,
              cost,
              service_date,
              status
            )
            VALUES (?, ?, ?, ?, ?, 'Active')
          `)
          .run(
            vehicle_id,
            service_type.trim(),
            description?.trim() || null,
            maintenanceCost,
            service_date
          );

        db.prepare(`
          UPDATE vehicles
          SET status = 'In Shop'
          WHERE id = ?
        `).run(vehicle_id);

        return result.lastInsertRowid;
      });

    const maintenanceId =
      createMaintenanceTransaction();

    const maintenanceLog = db
      .prepare(`
        SELECT
          maintenance_logs.*,
          vehicles.registration_number,
          vehicles.vehicle_name
        FROM maintenance_logs
        INNER JOIN vehicles
          ON maintenance_logs.vehicle_id = vehicles.id
        WHERE maintenance_logs.id = ?
      `)
      .get(maintenanceId);

    return res.status(201).json({
      success: true,
      message: "Vehicle moved to maintenance",
      maintenanceLog,
    });
  } catch (error) {
    console.error("Create maintenance error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create maintenance record",
    });
  }
};

const completeMaintenance = (req, res) => {
  try {
    const { id } = req.params;

    const maintenanceLog = db
      .prepare(`
        SELECT *
        FROM maintenance_logs
        WHERE id = ?
      `)
      .get(id);

    if (!maintenanceLog) {
      return res.status(404).json({
        success: false,
        message: "Maintenance record not found",
      });
    }

    if (maintenanceLog.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: "Maintenance is already completed",
      });
    }

    const completeMaintenanceTransaction =
      db.transaction(() => {
        db.prepare(`
          UPDATE maintenance_logs
          SET
            status = 'Completed',
            completed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(id);

        db.prepare(`
          UPDATE vehicles
          SET status = 'Available'
          WHERE id = ?
        `).run(maintenanceLog.vehicle_id);
      });

    completeMaintenanceTransaction();

    const completedMaintenance = db
      .prepare(`
        SELECT
          maintenance_logs.*,
          vehicles.registration_number,
          vehicles.vehicle_name,
          vehicles.status AS vehicle_status
        FROM maintenance_logs
        INNER JOIN vehicles
          ON maintenance_logs.vehicle_id = vehicles.id
        WHERE maintenance_logs.id = ?
      `)
      .get(id);

    return res.status(200).json({
      success: true,
      message: "Maintenance completed successfully",
      maintenanceLog: completedMaintenance,
    });
  } catch (error) {
    console.error("Complete maintenance error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to complete maintenance",
    });
  }
};

module.exports = {
  getMaintenanceLogs,
  createMaintenanceLog,
  completeMaintenance,
};