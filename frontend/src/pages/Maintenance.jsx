import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  IndianRupee,
  Plus,
  Search,
  Truck,
  Wrench,
  X,
} from "lucide-react";

import Layout from "../components/Layout";
import api from "../services/api";
import "./Maintenance.css";

const initialForm = {
  vehicle_id: "",
  service_type: "Oil Change",
  description: "",
  cost: "",
  service_date: new Date().toISOString().split("T")[0],
};

function Maintenance() {
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState(initialForm);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchMaintenanceLogs = async () => {
    const response = await api.get("/maintenance");
    setMaintenanceLogs(response.data.maintenanceLogs || []);
  };

  const fetchAvailableVehicles = async () => {
    const response = await api.get("/vehicles");

    const availableVehicles = (response.data.vehicles || []).filter(
      (vehicle) => vehicle.status === "Available"
    );

    setVehicles(availableVehicles);
  };

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        fetchMaintenanceLogs(),
        fetchAvailableVehicles(),
      ]);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load maintenance data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setFormData(initialForm);
    setError("");
  };

  const createMaintenance = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await api.post("/maintenance", {
        ...formData,
        vehicle_id: Number(formData.vehicle_id),
        cost: Number(formData.cost || 0),
      });

      setSuccess(
        "Maintenance record created and vehicle moved to In Shop"
      );

      setModalOpen(false);
      setFormData(initialForm);

      await loadPageData();

      window.setTimeout(() => {
        setSuccess("");
      }, 3500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create maintenance record"
      );
    } finally {
      setSaving(false);
    }
  };

  const completeMaintenance = async (maintenanceLog) => {
    const confirmed = window.confirm(
      `Complete ${maintenanceLog.service_type} for ${maintenanceLog.vehicle_name}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await api.patch(
        `/maintenance/${maintenanceLog.id}/complete`
      );

      setSuccess(
        "Maintenance completed and vehicle returned to Available"
      );

      await loadPageData();

      window.setTimeout(() => {
        setSuccess("");
      }, 3500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to complete maintenance"
      );
    }
  };

  const filteredLogs = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return maintenanceLogs.filter((log) => {
      const matchesSearch =
        !query ||
        log.vehicle_name.toLowerCase().includes(query) ||
        log.registration_number.toLowerCase().includes(query) ||
        log.service_type.toLowerCase().includes(query) ||
        (log.description || "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || log.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [maintenanceLogs, searchTerm, statusFilter]);

  const metrics = useMemo(() => {
    const active = maintenanceLogs.filter(
      (log) => log.status === "Active"
    ).length;

    const completed = maintenanceLogs.filter(
      (log) => log.status === "Completed"
    ).length;

    const totalCost = maintenanceLogs.reduce(
      (sum, log) => sum + Number(log.cost || 0),
      0
    );

    return {
      total: maintenanceLogs.length,
      active,
      completed,
      totalCost,
    };
  }, [maintenanceLogs]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  const formatDate = (value) => {
    if (!value) return "—";

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(`${value}T00:00:00`));
  };

  return (
    <Layout>
      <div className="maintenance-page">
        <section className="maintenance-hero">
          <div>
            <span className="maintenance-eyebrow">
              FLEET SERVICE OPERATIONS
            </span>

            <h1>Maintenance Management</h1>

            <p>
              Log vehicle services, monitor active repairs and
              restore fleet availability.
            </p>
          </div>

          <button
            className="add-maintenance-button"
            onClick={() => {
              setError("");
              setModalOpen(true);
            }}
          >
            <Plus size={18} />
            Log Maintenance
          </button>
        </section>

        {success && (
          <div className="maintenance-message success-message">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        {error && !modalOpen && (
          <div className="maintenance-message error-message">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        <section className="maintenance-metrics">
          <article>
            <div className="maintenance-metric-icon total">
              <Wrench size={22} />
            </div>

            <div>
              <span>Total Records</span>
              <strong>{metrics.total}</strong>
            </div>
          </article>

          <article>
            <div className="maintenance-metric-icon active">
              <Truck size={22} />
            </div>

            <div>
              <span>Vehicles In Shop</span>
              <strong>{metrics.active}</strong>
            </div>
          </article>

          <article>
            <div className="maintenance-metric-icon completed">
              <CheckCircle2 size={22} />
            </div>

            <div>
              <span>Completed Services</span>
              <strong>{metrics.completed}</strong>
            </div>
          </article>

          <article>
            <div className="maintenance-metric-icon cost">
              <IndianRupee size={22} />
            </div>

            <div>
              <span>Total Maintenance Cost</span>
              <strong>{formatCurrency(metrics.totalCost)}</strong>
            </div>
          </article>
        </section>

        <section className="maintenance-panel">
          <div className="maintenance-toolbar">
            <div className="maintenance-search">
              <Search size={18} />

              <input
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search vehicle, registration or service..."
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {loading ? (
            <div className="maintenance-empty">
              Loading maintenance operations...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="maintenance-empty">
              <Wrench size={44} />

              <h3>No maintenance records</h3>

              <p>
                Log your first vehicle service to begin tracking
                maintenance activity.
              </p>
            </div>
          ) : (
            <div className="maintenance-table-wrapper">
              <table className="maintenance-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Service</th>
                    <th>Description</th>
                    <th>Service Date</th>
                    <th>Cost</th>
                    <th>Status</th>
                    <th>Vehicle Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <div className="maintenance-vehicle-cell">
                          <div className="maintenance-vehicle-icon">
                            <Truck size={17} />
                          </div>

                          <div>
                            <strong>{log.vehicle_name}</strong>
                            <span>
                              {log.registration_number}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong>{log.service_type}</strong>
                      </td>

                      <td>
                        <span className="maintenance-description">
                          {log.description || "No description"}
                        </span>
                      </td>

                      <td>
                        <div className="maintenance-date-cell">
                          <CalendarDays size={15} />
                          {formatDate(log.service_date)}
                        </div>
                      </td>

                      <td>{formatCurrency(log.cost)}</td>

                      <td>
                        <span
                          className={`maintenance-status status-${log.status.toLowerCase()}`}
                        >
                          <CircleDot size={11} />
                          {log.status}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`vehicle-shop-status status-${log.vehicle_status
                            .toLowerCase()
                            .replaceAll(" ", "-")}`}
                        >
                          {log.vehicle_status}
                        </span>
                      </td>

                      <td>
                        {log.status === "Active" ? (
                          <button
                            className="complete-maintenance-button"
                            onClick={() =>
                              completeMaintenance(log)
                            }
                          >
                            Complete
                          </button>
                        ) : (
                          <span className="no-maintenance-action">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {modalOpen && (
          <div className="maintenance-modal-overlay">
            <div className="maintenance-modal">
              <div className="maintenance-modal-header">
                <div>
                  <span>NEW SERVICE RECORD</span>
                  <h2>Log Vehicle Maintenance</h2>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Close"
                >
                  <X size={21} />
                </button>
              </div>

              <form onSubmit={createMaintenance}>
                {error && (
                  <div className="maintenance-message error-message">
                    <AlertTriangle size={18} />
                    {error}
                  </div>
                )}

                <div className="maintenance-form-grid">
                  <label>
                    Available Vehicle *
                    <select
                      name="vehicle_id"
                      value={formData.vehicle_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">
                        Select available vehicle
                      </option>

                      {vehicles.map((vehicle) => (
                        <option
                          key={vehicle.id}
                          value={vehicle.id}
                        >
                          {vehicle.vehicle_name} —{" "}
                          {vehicle.registration_number}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Service Type *
                    <select
                      name="service_type"
                      value={formData.service_type}
                      onChange={handleChange}
                    >
                      <option value="Oil Change">
                        Oil Change
                      </option>
                      <option value="Engine Repair">
                        Engine Repair
                      </option>
                      <option value="Tyre Replacement">
                        Tyre Replacement
                      </option>
                      <option value="Brake Service">
                        Brake Service
                      </option>
                      <option value="General Inspection">
                        General Inspection
                      </option>
                      <option value="Other">Other</option>
                    </select>
                  </label>

                  <label>
                    Service Date *
                    <input
                      type="date"
                      name="service_date"
                      value={formData.service_date}
                      onChange={handleChange}
                      required
                    />
                  </label>

                  <label>
                    Estimated Cost (₹)
                    <input
                      type="number"
                      name="cost"
                      min="0"
                      value={formData.cost}
                      onChange={handleChange}
                      placeholder="2500"
                    />
                  </label>

                  <label className="full-width-field">
                    Description
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe the issue or planned service..."
                      rows="4"
                    />
                  </label>
                </div>

                {vehicles.length === 0 && (
                  <div className="maintenance-warning">
                    <AlertTriangle size={18} />
                    No available vehicles can enter maintenance.
                    Vehicles already On Trip, In Shop or Retired
                    are excluded.
                  </div>
                )}

                <div className="maintenance-modal-actions">
                  <button
                    type="button"
                    className="secondary-maintenance-button"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-maintenance-button"
                    disabled={saving || vehicles.length === 0}
                  >
                    {saving
                      ? "Creating..."
                      : "Create Maintenance"}
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

export default Maintenance;