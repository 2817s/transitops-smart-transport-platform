const db = require("../database/db");

const getTrips = (req, res) => {
  try {
    const trips = db
      .prepare(`
        SELECT
          trips.*,
          vehicles.registration_number,
          vehicles.vehicle_name,
          vehicles.vehicle_type,
          vehicles.maximum_load_capacity,
          drivers.name AS driver_name,
          drivers.license_number,
          drivers.license_expiry_date,
          drivers.safety_score
        FROM trips
        LEFT JOIN vehicles
          ON trips.vehicle_id = vehicles.id
        LEFT JOIN drivers
          ON trips.driver_id = drivers.id
        ORDER BY trips.id DESC
      `)
      .all();

    return res.status(200).json({
      success: true,
      count: trips.length,
      trips,
    });
  } catch (error) {
    console.error("Get trips error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch trips",
    });
  }
};

const getDispatchResources = (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const vehicles = db
      .prepare(`
        SELECT
          id,
          registration_number,
          vehicle_name,
          vehicle_model,
          vehicle_type,
          maximum_load_capacity,
          odometer,
          region,
          status
        FROM vehicles
        WHERE status = 'Available'
        ORDER BY vehicle_name ASC
      `)
      .all();

    const drivers = db
      .prepare(`
        SELECT
          id,
          name,
          license_number,
          license_category,
          license_expiry_date,
          contact_number,
          safety_score,
          region,
          status
        FROM drivers
        WHERE status = 'Available'
          AND license_expiry_date >= ?
        ORDER BY name ASC
      `)
      .all(today);

    return res.status(200).json({
      success: true,
      vehicles,
      drivers,
    });
  } catch (error) {
    console.error("Get dispatch resources error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load dispatch resources",
    });
  }
};

const createTrip = (req, res) => {
  try {
    const {
      source,
      destination,
      vehicle_id,
      driver_id,
      cargo_weight,
      planned_distance,
      revenue,
    } = req.body;

    if (
      !source ||
      !destination ||
      !vehicle_id ||
      !driver_id ||
      cargo_weight === undefined ||
      planned_distance === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required trip details",
      });
    }

    const numericVehicleId = Number(vehicle_id);
    const numericDriverId = Number(driver_id);
    const numericCargoWeight = Number(cargo_weight);
    const numericPlannedDistance = Number(planned_distance);
    const numericRevenue = Number(revenue || 0);

    if (
      Number.isNaN(numericVehicleId) ||
      Number.isNaN(numericDriverId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle or driver",
      });
    }

    if (numericCargoWeight <= 0) {
      return res.status(400).json({
        success: false,
        message: "Cargo weight must be greater than 0",
      });
    }

    if (numericPlannedDistance <= 0) {
      return res.status(400).json({
        success: false,
        message: "Planned distance must be greater than 0",
      });
    }

    if (numericRevenue < 0) {
      return res.status(400).json({
        success: false,
        message: "Revenue cannot be negative",
      });
    }

    const vehicle = db
      .prepare("SELECT * FROM vehicles WHERE id = ?")
      .get(numericVehicleId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    if (vehicle.status !== "Available") {
      return res.status(409).json({
        success: false,
        message: `${vehicle.vehicle_name} is not available for dispatch`,
      });
    }

    if (
      numericCargoWeight >
      Number(vehicle.maximum_load_capacity)
    ) {
      return res.status(400).json({
        success: false,
        message: `Cargo weight exceeds vehicle capacity of ${vehicle.maximum_load_capacity} kg`,
      });
    }

    const driver = db
      .prepare("SELECT * FROM drivers WHERE id = ?")
      .get(numericDriverId);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    if (driver.status === "Suspended") {
      return res.status(403).json({
        success: false,
        message: `${driver.name} is suspended and cannot be assigned`,
      });
    }

    if (driver.status !== "Available") {
      return res.status(409).json({
        success: false,
        message: `${driver.name} is not available for dispatch`,
      });
    }

    const today = new Date().toISOString().split("T")[0];

    if (driver.license_expiry_date < today) {
      return res.status(403).json({
        success: false,
        message: `${driver.name} has an expired driving licence`,
      });
    }

    const createTripTransaction = db.transaction(() => {
      const tripNumber = `TRP-${Date.now()}`;

      const result = db
        .prepare(`
          INSERT INTO trips (
            trip_number,
            source,
            destination,
            vehicle_id,
            driver_id,
            cargo_weight,
            planned_distance,
            start_odometer,
            revenue,
            status,
            dispatch_date
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Dispatched', CURRENT_TIMESTAMP)
        `)
        .run(
          tripNumber,
          source.trim(),
          destination.trim(),
          numericVehicleId,
          numericDriverId,
          numericCargoWeight,
          numericPlannedDistance,
          Number(vehicle.odometer),
          numericRevenue
        );

      db.prepare(`
        UPDATE vehicles
        SET status = 'On Trip'
        WHERE id = ?
      `).run(numericVehicleId);

      db.prepare(`
        UPDATE drivers
        SET status = 'On Trip'
        WHERE id = ?
      `).run(numericDriverId);

      return result.lastInsertRowid;
    });

    const tripId = createTripTransaction();

    const trip = db
      .prepare(`
        SELECT
          trips.*,
          vehicles.registration_number,
          vehicles.vehicle_name,
          drivers.name AS driver_name
        FROM trips
        LEFT JOIN vehicles
          ON trips.vehicle_id = vehicles.id
        LEFT JOIN drivers
          ON trips.driver_id = drivers.id
        WHERE trips.id = ?
      `)
      .get(tripId);

    return res.status(201).json({
      success: true,
      message: "Trip dispatched successfully",
      trip,
    });
  } catch (error) {
    console.error("Create trip error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create trip",
    });
  }
};

const completeTrip = (req, res) => {
  try {
    const tripId = Number(req.params.id);

    const {
      final_odometer,
      fuel_consumed,
    } = req.body;

    const trip = db
      .prepare("SELECT * FROM trips WHERE id = ?")
      .get(tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    if (trip.status !== "Dispatched") {
      return res.status(409).json({
        success: false,
        message: "Only dispatched trips can be completed",
      });
    }

    const numericFinalOdometer = Number(final_odometer);
    const numericFuelConsumed = Number(fuel_consumed);

    if (
      Number.isNaN(numericFinalOdometer) ||
      numericFinalOdometer < Number(trip.start_odometer)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Final odometer cannot be less than the starting odometer",
      });
    }

    if (
      Number.isNaN(numericFuelConsumed) ||
      numericFuelConsumed < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Fuel consumed cannot be negative",
      });
    }

    const actualDistance =
      numericFinalOdometer - Number(trip.start_odometer);

    const completeTripTransaction = db.transaction(() => {
      db.prepare(`
        UPDATE trips
        SET
          final_odometer = ?,
          actual_distance = ?,
          fuel_consumed = ?,
          status = 'Completed',
          completion_date = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        numericFinalOdometer,
        actualDistance,
        numericFuelConsumed,
        tripId
      );

      db.prepare(`
        UPDATE vehicles
        SET
          status = 'Available',
          odometer = ?
        WHERE id = ?
      `).run(
        numericFinalOdometer,
        trip.vehicle_id
      );

      db.prepare(`
        UPDATE drivers
        SET status = 'Available'
        WHERE id = ?
      `).run(trip.driver_id);
    });

    completeTripTransaction();

    const completedTrip = db
      .prepare(`
        SELECT
          trips.*,
          vehicles.registration_number,
          vehicles.vehicle_name,
          drivers.name AS driver_name
        FROM trips
        LEFT JOIN vehicles
          ON trips.vehicle_id = vehicles.id
        LEFT JOIN drivers
          ON trips.driver_id = drivers.id
        WHERE trips.id = ?
      `)
      .get(tripId);

    return res.status(200).json({
      success: true,
      message: "Trip completed successfully",
      trip: completedTrip,
    });
  } catch (error) {
    console.error("Complete trip error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to complete trip",
    });
  }
};

const cancelTrip = (req, res) => {
  try {
    const tripId = Number(req.params.id);

    const trip = db
      .prepare("SELECT * FROM trips WHERE id = ?")
      .get(tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    if (trip.status !== "Dispatched") {
      return res.status(409).json({
        success: false,
        message: "Only dispatched trips can be cancelled",
      });
    }

    const cancelTripTransaction = db.transaction(() => {
      db.prepare(`
        UPDATE trips
        SET status = 'Cancelled'
        WHERE id = ?
      `).run(tripId);

      db.prepare(`
        UPDATE vehicles
        SET status = 'Available'
        WHERE id = ?
      `).run(trip.vehicle_id);

      db.prepare(`
        UPDATE drivers
        SET status = 'Available'
        WHERE id = ?
      `).run(trip.driver_id);
    });

    cancelTripTransaction();

    return res.status(200).json({
      success: true,
      message:
        "Trip cancelled and dispatch resources released",
    });
  } catch (error) {
    console.error("Cancel trip error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel trip",
    });
  }
};

module.exports = {
  getTrips,
  getDispatchResources,
  createTrip,
  completeTrip,
  cancelTrip,
};