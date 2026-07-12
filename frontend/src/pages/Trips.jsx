import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  CircleDot,
  Clock3,
  MapPin,
  Package,
  Plus,
  Route,
  Search,
  Truck,
  UserRound,
  X,
} from "lucide-react";

import Layout from "../components/Layout";
import api from "../services/api";
import "./Trips.css";

const initialTripForm = {
  source: "",
  destination: "",
  vehicle_id: "",
  driver_id: "",
  cargo_weight: "",
  planned_distance: "",
  revenue: "",
};

const initialCompleteForm = {
  final_odometer: "",
  fuel_consumed: "",
};

function Trips() {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const [tripForm, setTripForm] = useState(initialTripForm);
  const [completeForm, setCompleteForm] =
    useState(initialCompleteForm);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [dispatchModalOpen, setDispatchModalOpen] =
    useState(false);
  const [completeModalOpen, setCompleteModalOpen] =
    useState(false);

  const [selectedTrip, setSelectedTrip] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchTrips = async () => {
    try {
      const response = await api.get("/trips");
      setTrips(response.data.trips || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load trips"
      );
    }
  };

  const fetchDispatchResources = async () => {
    try {
      const response = await api.get(
        "/trips/dispatch-resources"
      );

      setVehicles(response.data.vehicles || []);
      setDrivers(response.data.drivers || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load dispatch resources"
      );
    }
  };

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        fetchTrips(),
        fetchDispatchResources(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, []);

  const handleTripFormChange = (event) => {
    const { name, value } = event.target;

    setTripForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  };

  const handleCompleteFormChange = (event) => {
    const { name, value } = event.target;

    setCompleteForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  };

  const selectedVehicle = vehicles.find(
    (vehicle) =>
      vehicle.id === Number(tripForm.vehicle_id)
  );

  const capacityExceeded =
    selectedVehicle &&
    Number(tripForm.cargo_weight) >
      Number(selectedVehicle.maximum_load_capacity);

  const dispatchTrip = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await api.post("/trips", {
        ...tripForm,
        vehicle_id: Number(tripForm.vehicle_id),
        driver_id: Number(tripForm.driver_id),
        cargo_weight: Number(tripForm.cargo_weight),
        planned_distance: Number(
          tripForm.planned_distance
        ),
        revenue: Number(tripForm.revenue || 0),
      });

      setSuccess("Trip dispatched successfully");
      setDispatchModalOpen(false);
      setTripForm(initialTripForm);

      await loadPageData();

      window.setTimeout(() => {
        setSuccess("");
      }, 3500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to dispatch trip"
      );
    } finally {
      setSaving(false);
    }
  };

  const openCompleteModal = (trip) => {
    setSelectedTrip(trip);
    setCompleteForm({
      final_odometer: "",
      fuel_consumed: "",
    });
    setError("");
    setCompleteModalOpen(true);
  };

  const completeTrip = async (event) => {
    event.preventDefault();

    if (!selectedTrip) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await api.patch(
        `/trips/${selectedTrip.id}/complete`,
        {
          final_odometer: Number(
            completeForm.final_odometer
          ),
          fuel_consumed: Number(
            completeForm.fuel_consumed
          ),
        }
      );

      setSuccess("Trip completed successfully");
      setCompleteModalOpen(false);
      setSelectedTrip(null);

      await loadPageData();

      window.setTimeout(() => {
        setSuccess("");
      }, 3500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to complete trip"
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelTrip = async (trip) => {
    const confirmed = window.confirm(
      `Cancel ${trip.trip_number}? Vehicle and driver will become available again.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.patch(`/trips/${trip.id}/cancel`);

      setSuccess("Trip cancelled successfully");
      await loadPageData();

      window.setTimeout(() => {
        setSuccess("");
      }, 3500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to cancel trip"
      );
    }
  };

  const filteredTrips = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return trips.filter((trip) => {
      const matchesSearch =
        !query ||
        trip.trip_number.toLowerCase().includes(query) ||
        trip.source.toLowerCase().includes(query) ||
        trip.destination.toLowerCase().includes(query) ||
        (trip.vehicle_name || "")
          .toLowerCase()
          .includes(query) ||
        (trip.driver_name || "")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        trip.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [trips, searchTerm, statusFilter]);

  const metrics = useMemo(
    () => ({
      total: trips.length,
      dispatched: trips.filter(
        (trip) => trip.status === "Dispatched"
      ).length,
      completed: trips.filter(
        (trip) => trip.status === "Completed"
      ).length,
      cancelled: trips.filter(
        (trip) => trip.status === "Cancelled"
      ).length,
    }),
    [trips]
  );

  return (
    <Layout>
      <div className="trips-page">
        <section className="trips-hero">
          <div>
            <span className="trips-eyebrow">
              DISPATCH CONTROL
            </span>

            <h1>Trips & Dispatch</h1>

            <p>
              Create trips, validate resources and track each
              delivery lifecycle.
            </p>
          </div>

          <button
            className="dispatch-button"
            onClick={() => {
              setError("");
              setDispatchModalOpen(true);
            }}
          >
            <Plus size={18} />
            Create Trip
          </button>
        </section>

        {success && (
          <div className="trip-message success-message">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        {error &&
          !dispatchModalOpen &&
          !completeModalOpen && (
            <div className="trip-message error-message">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

        <section className="trip-metrics">
          <article>
            <div className="trip-metric-icon total">
              <Route size={22} />
            </div>

            <div>
              <span>Total Trips</span>
              <strong>{metrics.total}</strong>
            </div>
          </article>

          <article>
            <div className="trip-metric-icon dispatched">
              <Truck size={22} />
            </div>

            <div>
              <span>Dispatched</span>
              <strong>{metrics.dispatched}</strong>
            </div>
          </article>

          <article>
            <div className="trip-metric-icon completed">
              <CheckCircle2 size={22} />
            </div>

            <div>
              <span>Completed</span>
              <strong>{metrics.completed}</strong>
            </div>
          </article>

          <article>
            <div className="trip-metric-icon cancelled">
              <Ban size={22} />
            </div>

            <div>
              <span>Cancelled</span>
              <strong>{metrics.cancelled}</strong>
            </div>
          </article>
        </section>

        <section className="trips-panel">
          <div className="trips-toolbar">
            <div className="trip-search">
              <Search size={18} />

              <input
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search trip, route, vehicle or driver..."
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Dispatched">
                Dispatched
              </option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {loading ? (
            <div className="trips-empty">
              Loading trip operations...
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="trips-empty">
              <Route size={44} />
              <h3>No trips found</h3>
              <p>
                Create your first trip or update the filters.
              </p>
            </div>
          ) : (
            <div className="trips-table-wrapper">
              <table className="trips-table">
                <thead>
                  <tr>
                    <th>Trip</th>
                    <th>Route</th>
                    <th>Vehicle</th>
                    <th>Driver</th>
                    <th>Cargo</th>
                    <th>Distance</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTrips.map((trip) => (
                    <tr key={trip.id}>
                      <td>
                        <strong className="trip-number">
                          {trip.trip_number}
                        </strong>
                      </td>

                      <td>
                        <div className="trip-route">
                          <MapPin size={15} />

                          <div>
                            <strong>{trip.source}</strong>
                            <span>
                              → {trip.destination}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="resource-cell">
                          <Truck size={15} />
                          {trip.vehicle_name || "—"}
                        </div>
                      </td>

                      <td>
                        <div className="resource-cell">
                          <UserRound size={15} />
                          {trip.driver_name || "—"}
                        </div>
                      </td>

                      <td>{trip.cargo_weight} kg</td>

                      <td>
                        {trip.status === "Completed"
                          ? `${trip.actual_distance} km`
                          : `${trip.planned_distance} km`}
                      </td>

                      <td>
                        <span
                          className={`trip-status-badge status-${trip.status
                            .toLowerCase()
                            .replaceAll(" ", "-")}`}
                        >
                          <CircleDot size={11} />
                          {trip.status}
                        </span>
                      </td>

                      <td>
                        <div className="trip-actions">
                          {trip.status ===
                            "Dispatched" && (
                            <>
                              <button
                                className="complete-action"
                                onClick={() =>
                                  openCompleteModal(trip)
                                }
                              >
                                Complete
                              </button>

                              <button
                                className="cancel-action"
                                onClick={() =>
                                  cancelTrip(trip)
                                }
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {trip.status !==
                            "Dispatched" && (
                            <span className="no-action">
                              —
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {dispatchModalOpen && (
          <div className="trip-modal-overlay">
            <div className="trip-modal">
              <div className="trip-modal-header">
                <div>
                  <span>NEW TRANSPORT OPERATION</span>
                  <h2>Create & Dispatch Trip</h2>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!saving) {
                      setDispatchModalOpen(false);
                      setTripForm(initialTripForm);
                      setError("");
                    }
                  }}
                >
                  <X size={21} />
                </button>
              </div>

              <form onSubmit={dispatchTrip}>
                {error && (
                  <div className="trip-message error-message">
                    <AlertTriangle size={18} />
                    {error}
                  </div>
                )}

                <div className="trip-form-grid">
                  <label>
                    Source *
                    <input
                      name="source"
                      value={tripForm.source}
                      onChange={handleTripFormChange}
                      placeholder="Gandhinagar Depot"
                      required
                    />
                  </label>

                  <label>
                    Destination *
                    <input
                      name="destination"
                      value={tripForm.destination}
                      onChange={handleTripFormChange}
                      placeholder="Ahmedabad Hub"
                      required
                    />
                  </label>

                  <label>
                    Available Vehicle *
                    <select
                      name="vehicle_id"
                      value={tripForm.vehicle_id}
                      onChange={handleTripFormChange}
                      required
                    >
                      <option value="">
                        Select vehicle
                      </option>

                      {vehicles.map((vehicle) => (
                        <option
                          key={vehicle.id}
                          value={vehicle.id}
                        >
                          {vehicle.vehicle_name} —{" "}
                          {vehicle.maximum_load_capacity} kg
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Available Driver *
                    <select
                      name="driver_id"
                      value={tripForm.driver_id}
                      onChange={handleTripFormChange}
                      required
                    >
                      <option value="">
                        Select valid driver
                      </option>

                      {drivers.map((driver) => (
                        <option
                          key={driver.id}
                          value={driver.id}
                        >
                          {driver.name} —{" "}
                          {driver.license_category}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Cargo Weight (kg) *
                    <input
                      name="cargo_weight"
                      type="number"
                      min="1"
                      value={tripForm.cargo_weight}
                      onChange={handleTripFormChange}
                      placeholder="450"
                      required
                    />
                  </label>

                  <label>
                    Planned Distance (km) *
                    <input
                      name="planned_distance"
                      type="number"
                      min="1"
                      value={tripForm.planned_distance}
                      onChange={handleTripFormChange}
                      placeholder="38"
                      required
                    />
                  </label>

                  <label>
                    Expected Revenue (₹)
                    <input
                      name="revenue"
                      type="number"
                      min="0"
                      value={tripForm.revenue}
                      onChange={handleTripFormChange}
                      placeholder="8500"
                    />
                  </label>
                </div>

                {selectedVehicle && (
                  <div
                    className={`capacity-card ${
                      capacityExceeded
                        ? "capacity-error"
                        : "capacity-ok"
                    }`}
                  >
                    <Package size={19} />

                    <div>
                      <strong>
                        Vehicle Capacity:{" "}
                        {
                          selectedVehicle.maximum_load_capacity
                        }{" "}
                        kg
                      </strong>

                      <span>
                        Cargo Weight:{" "}
                        {tripForm.cargo_weight || 0} kg
                      </span>

                      {capacityExceeded && (
                        <p>
                          Capacity exceeded by{" "}
                          {Number(
                            tripForm.cargo_weight
                          ) -
                            Number(
                              selectedVehicle.maximum_load_capacity
                            )}{" "}
                          kg — dispatch blocked.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {drivers.length === 0 && (
                  <div className="dispatch-warning">
                    <AlertTriangle size={18} />
                    No valid drivers are available. Expired,
                    suspended, off-duty and on-trip drivers are
                    excluded.
                  </div>
                )}

                <div className="trip-modal-actions">
                  <button
                    type="button"
                    className="secondary-trip-button"
                    onClick={() => {
                      if (!saving) {
                        setDispatchModalOpen(false);
                        setTripForm(initialTripForm);
                        setError("");
                      }
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-trip-button"
                    disabled={
                      saving ||
                      capacityExceeded ||
                      drivers.length === 0 ||
                      vehicles.length === 0
                    }
                  >
                    {saving
                      ? "Dispatching..."
                      : "Dispatch Trip"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {completeModalOpen && selectedTrip && (
          <div className="trip-modal-overlay">
            <div className="trip-modal complete-modal">
              <div className="trip-modal-header">
                <div>
                  <span>TRIP COMPLETION</span>
                  <h2>
                    Complete {selectedTrip.trip_number}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!saving) {
                      setCompleteModalOpen(false);
                      setSelectedTrip(null);
                      setError("");
                    }
                  }}
                >
                  <X size={21} />
                </button>
              </div>

              <form onSubmit={completeTrip}>
                {error && (
                  <div className="trip-message error-message">
                    <AlertTriangle size={18} />
                    {error}
                  </div>
                )}

                <div className="completion-summary">
                  <Clock3 size={20} />

                  <div>
                    <strong>
                      Starting Odometer:{" "}
                      {selectedTrip.start_odometer} km
                    </strong>
                    <span>
                      {selectedTrip.source} →{" "}
                      {selectedTrip.destination}
                    </span>
                  </div>
                </div>

                <div className="trip-form-grid single-column">
                  <label>
                    Final Odometer (km) *
                    <input
                      name="final_odometer"
                      type="number"
                      min={selectedTrip.start_odometer}
                      value={
                        completeForm.final_odometer
                      }
                      onChange={
                        handleCompleteFormChange
                      }
                      required
                    />
                  </label>

                  <label>
                    Fuel Consumed (litres) *
                    <input
                      name="fuel_consumed"
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        completeForm.fuel_consumed
                      }
                      onChange={
                        handleCompleteFormChange
                      }
                      required
                    />
                  </label>
                </div>

                <div className="trip-modal-actions">
                  <button
                    type="button"
                    className="secondary-trip-button"
                    onClick={() => {
                      if (!saving) {
                        setCompleteModalOpen(false);
                        setSelectedTrip(null);
                        setError("");
                      }
                    }}
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    className="primary-trip-button"
                    disabled={saving}
                  >
                    {saving
                      ? "Completing..."
                      : "Complete Trip"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Trips;