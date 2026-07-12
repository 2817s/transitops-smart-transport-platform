const db = require("../database/db");

const getDashboardOverview = (req, res) => {
  try {
    const vehicleSummary = db
      .prepare(`
        SELECT
          COUNT(*) AS totalVehicles,
          SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END)
            AS availableVehicles,
          SUM(CASE WHEN status = 'On Trip' THEN 1 ELSE 0 END)
            AS onTripVehicles,
          SUM(CASE WHEN status = 'In Shop' THEN 1 ELSE 0 END)
            AS maintenanceVehicles,
          SUM(CASE WHEN status = 'Retired' THEN 1 ELSE 0 END)
            AS retiredVehicles
        FROM vehicles
      `)
      .get();

    const driverSummary = db
      .prepare(`
        SELECT
          COUNT(*) AS totalDrivers,
          SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END)
            AS availableDrivers,
          SUM(CASE WHEN status = 'On Trip' THEN 1 ELSE 0 END)
            AS onTripDrivers,
          SUM(CASE WHEN status = 'Off Duty' THEN 1 ELSE 0 END)
            AS offDutyDrivers,
          SUM(CASE WHEN status = 'Suspended' THEN 1 ELSE 0 END)
            AS suspendedDrivers
        FROM drivers
      `)
      .get();

    const tripSummary = db
      .prepare(`
        SELECT
          COUNT(*) AS totalTrips,
          SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END)
            AS draftTrips,
          SUM(CASE WHEN status = 'Dispatched' THEN 1 ELSE 0 END)
            AS activeTrips,
          SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END)
            AS completedTrips,
          SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END)
            AS cancelledTrips
        FROM trips
      `)
      .get();

    const costSummary = db
      .prepare(`
        SELECT
          (
            SELECT COALESCE(SUM(fuel_cost), 0)
            FROM fuel_logs
          ) AS fuelCost,

          (
            SELECT COALESCE(SUM(amount), 0)
            FROM expenses
          ) AS otherExpenses,

          (
            SELECT COALESCE(SUM(cost), 0)
            FROM maintenance_logs
          ) AS maintenanceCost
      `)
      .get();

    const recentTrips = db
      .prepare(`
        SELECT
          trips.id,
          trips.trip_number,
          trips.source,
          trips.destination,
          trips.status,
          trips.planned_distance,
          trips.actual_distance,
          trips.revenue,
          trips.created_at,
          vehicles.vehicle_name,
          vehicles.registration_number,
          drivers.name AS driver_name
        FROM trips
        LEFT JOIN vehicles
          ON trips.vehicle_id = vehicles.id
        LEFT JOIN drivers
          ON trips.driver_id = drivers.id
        ORDER BY trips.id DESC
        LIMIT 5
      `)
      .all();

    const totalVehicles = Number(
      vehicleSummary.totalVehicles || 0
    );

    const availableVehicles = Number(
      vehicleSummary.availableVehicles || 0
    );

    const onTripVehicles = Number(
      vehicleSummary.onTripVehicles || 0
    );

    const maintenanceVehicles = Number(
      vehicleSummary.maintenanceVehicles || 0
    );

    const totalOperationalCost =
      Number(costSummary.fuelCost || 0) +
      Number(costSummary.otherExpenses || 0) +
      Number(costSummary.maintenanceCost || 0);

    const fleetUtilization =
      totalVehicles === 0
        ? 0
        : Math.round(
            (onTripVehicles / totalVehicles) * 100
          );

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalVehicles,
          availableVehicles,
          onTripVehicles,
          maintenanceVehicles,
          totalDrivers: Number(
            driverSummary.totalDrivers || 0
          ),
          availableDrivers: Number(
            driverSummary.availableDrivers || 0
          ),
          activeTrips: Number(
            tripSummary.activeTrips || 0
          ),
          completedTrips: Number(
            tripSummary.completedTrips || 0
          ),
          fleetUtilization,
          totalOperationalCost,
        },

        vehicles: {
          total: totalVehicles,
          available: availableVehicles,
          onTrip: onTripVehicles,
          inShop: maintenanceVehicles,
          retired: Number(
            vehicleSummary.retiredVehicles || 0
          ),
        },

        drivers: {
          total: Number(driverSummary.totalDrivers || 0),
          available: Number(
            driverSummary.availableDrivers || 0
          ),
          onTrip: Number(
            driverSummary.onTripDrivers || 0
          ),
          offDuty: Number(
            driverSummary.offDutyDrivers || 0
          ),
          suspended: Number(
            driverSummary.suspendedDrivers || 0
          ),
        },

        trips: {
          total: Number(tripSummary.totalTrips || 0),
          draft: Number(tripSummary.draftTrips || 0),
          dispatched: Number(
            tripSummary.activeTrips || 0
          ),
          completed: Number(
            tripSummary.completedTrips || 0
          ),
          cancelled: Number(
            tripSummary.cancelledTrips || 0
          ),
        },

        costs: {
          fuelCost: Number(costSummary.fuelCost || 0),
          otherExpenses: Number(
            costSummary.otherExpenses || 0
          ),
          maintenanceCost: Number(
            costSummary.maintenanceCost || 0
          ),
          totalOperationalCost,
        },

        recentTrips,
      },
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard overview",
    });
  }
};

module.exports = {
  getDashboardOverview,
};