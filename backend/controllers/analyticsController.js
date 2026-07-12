const db = require("../database/db");

const getAnalyticsOverview = (req, res) => {
  try {
    const vehicleSummary = db
      .prepare(`
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) AS available,
          SUM(CASE WHEN status = 'On Trip' THEN 1 ELSE 0 END) AS onTrip,
          SUM(CASE WHEN status = 'In Shop' THEN 1 ELSE 0 END) AS inShop,
          SUM(CASE WHEN status = 'Retired' THEN 1 ELSE 0 END) AS retired
        FROM vehicles
      `)
      .get();

    const driverSummary = db
      .prepare(`
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) AS available,
          SUM(CASE WHEN status = 'On Trip' THEN 1 ELSE 0 END) AS onTrip,
          SUM(CASE WHEN status = 'Off Duty' THEN 1 ELSE 0 END) AS offDuty,
          SUM(CASE WHEN status = 'Suspended' THEN 1 ELSE 0 END) AS suspended
        FROM drivers
      `)
      .get();

    const tripSummary = db
      .prepare(`
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END) AS draft,
          SUM(CASE WHEN status = 'Dispatched' THEN 1 ELSE 0 END) AS dispatched,
          SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed,
          SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled,
          COALESCE(SUM(actual_distance), 0) AS totalDistance,
          COALESCE(SUM(revenue), 0) AS totalRevenue
        FROM trips
      `)
      .get();

    const maintenanceSummary = db
      .prepare(`
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS active,
          SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed,
          COALESCE(SUM(cost), 0) AS totalCost
        FROM maintenance_logs
      `)
      .get();

    const fuelSummary = db
      .prepare(`
        SELECT
          COUNT(*) AS totalRecords,
          COALESCE(SUM(liters), 0) AS totalLiters,
          COALESCE(SUM(fuel_cost), 0) AS totalCost
        FROM fuel_logs
      `)
      .get();

    const expenseSummary = db
      .prepare(`
        SELECT
          COUNT(*) AS totalRecords,
          COALESCE(SUM(amount), 0) AS totalCost
        FROM expenses
      `)
      .get();

    const totalOperationalCost =
      Number(fuelSummary.totalCost || 0) +
      Number(expenseSummary.totalCost || 0) +
      Number(maintenanceSummary.totalCost || 0);

    const fleetUtilization =
      Number(vehicleSummary.total || 0) === 0
        ? 0
        : Math.round(
            (Number(vehicleSummary.onTrip || 0) /
              Number(vehicleSummary.total)) *
              100
          );

    const tripCompletionRate =
      Number(tripSummary.total || 0) === 0
        ? 0
        : Math.round(
            (Number(tripSummary.completed || 0) /
              Number(tripSummary.total)) *
              100
          );

    const fuelEfficiency =
      Number(fuelSummary.totalLiters || 0) === 0
        ? 0
        : Number(
            (
              Number(tripSummary.totalDistance || 0) /
              Number(fuelSummary.totalLiters)
            ).toFixed(2)
          );

    const roi =
      totalOperationalCost === 0
        ? 0
        : Number(
            (
              ((Number(tripSummary.totalRevenue || 0) -
                totalOperationalCost) /
                totalOperationalCost) *
              100
            ).toFixed(2)
          );

    const vehicleCosts = db
      .prepare(`
        SELECT
          vehicles.id,
          vehicles.vehicle_name,
          vehicles.registration_number,
          vehicles.acquisition_cost,

          COALESCE((
            SELECT SUM(fuel_logs.fuel_cost)
            FROM fuel_logs
            WHERE fuel_logs.vehicle_id = vehicles.id
          ), 0) AS fuelCost,

          COALESCE((
            SELECT SUM(expenses.amount)
            FROM expenses
            WHERE expenses.vehicle_id = vehicles.id
          ), 0) AS expenseCost,

          COALESCE((
            SELECT SUM(maintenance_logs.cost)
            FROM maintenance_logs
            WHERE maintenance_logs.vehicle_id = vehicles.id
          ), 0) AS maintenanceCost,

          COALESCE((
            SELECT SUM(trips.revenue)
            FROM trips
            WHERE trips.vehicle_id = vehicles.id
              AND trips.status = 'Completed'
          ), 0) AS revenue

        FROM vehicles
        ORDER BY vehicles.id DESC
      `)
      .all()
      .map((vehicle) => {
        const operatingCost =
          Number(vehicle.fuelCost || 0) +
          Number(vehicle.expenseCost || 0) +
          Number(vehicle.maintenanceCost || 0);

        const acquisitionCost = Number(
          vehicle.acquisition_cost || 0
        );

        const vehicleRoi =
          acquisitionCost === 0
            ? 0
            : Number(
                (
                  ((Number(vehicle.revenue || 0) -
                    operatingCost) /
                    acquisitionCost) *
                  100
                ).toFixed(2)
              );

        return {
          ...vehicle,
          operatingCost,
          roi: vehicleRoi,
        };
      });

    const monthlyRevenue = db
      .prepare(`
        SELECT
          strftime('%Y-%m', completion_date) AS month,
          COALESCE(SUM(revenue), 0) AS revenue
        FROM trips
        WHERE status = 'Completed'
          AND completion_date IS NOT NULL
        GROUP BY strftime('%Y-%m', completion_date)
        ORDER BY month ASC
        LIMIT 12
      `)
      .all();

    const recentTrips = db
      .prepare(`
        SELECT
          trips.id,
          trips.trip_number,
          trips.source,
          trips.destination,
          trips.status,
          trips.actual_distance,
          trips.planned_distance,
          trips.revenue,
          vehicles.vehicle_name,
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

    return res.status(200).json({
      success: true,
      analytics: {
        vehicles: vehicleSummary,
        drivers: driverSummary,
        trips: tripSummary,
        maintenance: maintenanceSummary,
        fuel: fuelSummary,
        expenses: expenseSummary,
        totals: {
          operationalCost: totalOperationalCost,
          revenue: Number(tripSummary.totalRevenue || 0),
          fleetUtilization,
          tripCompletionRate,
          fuelEfficiency,
          roi,
        },
        vehicleCosts,
        monthlyRevenue,
        recentTrips,
      },
    });
  } catch (error) {
    console.error("Analytics overview error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load analytics overview",
    });
  }
};

module.exports = {
  getAnalyticsOverview,
};