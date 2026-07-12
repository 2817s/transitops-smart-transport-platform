import Layout from "../components/Layout";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  UserPlus,
  Users,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  X,
  BadgeCheck,
  Phone,
} from "lucide-react";

import "./Drivers.css";

const API_URL = "http://localhost:5000/api/drivers";

const initialForm = {
  name: "",
  license_number: "",
  license_category: "LMV",
  license_expiry_date: "",
  contact_number: "",
  safety_score: "100",
  region: "",
  status: "Available",
};

function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getToken = () =>
  localStorage.getItem("transitops_token");

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load drivers");
      }

      setDrivers(data.drivers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      const query = search.toLowerCase().trim();

      const matchesSearch =
        !query ||
        driver.name.toLowerCase().includes(query) ||
        driver.license_number.toLowerCase().includes(query) ||
        (driver.region || "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        driver.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [drivers, search, statusFilter]);

  const metrics = useMemo(() => {
    return {
      total: drivers.length,
      available: drivers.filter(
        (driver) => driver.status === "Available"
      ).length,
      onTrip: drivers.filter(
        (driver) => driver.status === "On Trip"
      ).length,
      attention: drivers.filter(
        (driver) =>
          driver.status === "Suspended" ||
          driver.license_expired
      ).length,
    };
  }, [drivers]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setForm(initialForm);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          ...form,
          safety_score: Number(form.safety_score),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to register driver");
      }

      const today = new Date().toISOString().split("T")[0];

setDrivers((current) => [
  {
    ...data.driver,
    license_expired:
      data.driver.license_expiry_date < today,
  },
  ...current,
]);

      setSuccess("Driver registered successfully");
      setModalOpen(false);
      setForm(initialForm);

      window.setTimeout(() => {
        setSuccess("");
      }, 3500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (driverId, status) => {
    try {
      setError("");

      const response = await fetch(
        `${API_URL}/${driverId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update driver status"
        );
      }

      setDrivers((current) =>
        current.map((driver) =>
          driver.id === driverId
            ? {
                ...data.driver,
                license_expired: driver.license_expired,
              }
            : driver
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const getSafetyClass = (score) => {
    if (score >= 90) return "excellent";
    if (score >= 75) return "good";
    return "risk";
  };
return (
  <Layout>
    <div className="drivers-page">
      <section className="drivers-hero">
        <div>
          <span className="drivers-eyebrow">
            DRIVER OPERATIONS
          </span>

          <h1>Drivers & Safety</h1>

          <p>
            Manage driver readiness, licence compliance and
            operational safety.
          </p>
        </div>

        <button
          className="add-driver-button"
          onClick={() => {
            setError("");
            setModalOpen(true);
          }}
        >
          <UserPlus size={19} />
          Add Driver
        </button>
      </section>

      {success && (
        <div className="driver-message success-message">
          <BadgeCheck size={20} />
          {success}
        </div>
      )}

      {error && !modalOpen && (
        <div className="driver-message error-message">
          <AlertTriangle size={20} />
          {error}
        </div>
      )}

      <section className="driver-metrics">
        <article className="driver-metric-card">
          <div className="driver-metric-icon purple">
            <Users size={24} />
          </div>

          <div>
            <span>Total Drivers</span>
            <strong>{metrics.total}</strong>
          </div>
        </article>

        <article className="driver-metric-card">
          <div className="driver-metric-icon green">
            <UserCheck size={24} />
          </div>

          <div>
            <span>Available</span>
            <strong>{metrics.available}</strong>
          </div>
        </article>

        <article className="driver-metric-card">
          <div className="driver-metric-icon blue">
            <ShieldCheck size={24} />
          </div>

          <div>
            <span>On Trip</span>
            <strong>{metrics.onTrip}</strong>
          </div>
        </article>

        <article className="driver-metric-card">
          <div className="driver-metric-icon orange">
            <AlertTriangle size={24} />
          </div>

          <div>
            <span>Needs Attention</span>
            <strong>{metrics.attention}</strong>
          </div>
        </article>
      </section>

      <section className="drivers-panel">
        <div className="drivers-toolbar">
          <div className="driver-search">
            <Search size={19} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search driver, licence or region..."
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="Off Duty">Off Duty</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        {loading ? (
          <div className="drivers-empty">
            <div className="driver-loader" />
            <h3>Loading drivers</h3>
            <p>Checking driver readiness and safety records.</p>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="drivers-empty">
            <Users size={48} />
            <h3>No drivers found</h3>
            <p>
              Register your first driver or change the active
              filters.
            </p>
          </div>
        ) : (
          <div className="drivers-table-wrapper">
            <table className="drivers-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Licence</th>
                  <th>Category</th>
                  <th>Expiry</th>
                  <th>Safety</th>
                  <th>Region</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredDrivers.map((driver) => (
                  <tr key={driver.id}>
                    <td>
                      <div className="driver-identity">
                        <div className="driver-avatar">
                          {driver.name
                            .split(" ")
                            .map((part) => part[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>{driver.name}</strong>

                          <span>
                            <Phone size={12} />
                            {driver.contact_number ||
                              "No contact"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <strong>
                        {driver.license_number}
                      </strong>
                    </td>

                    <td>{driver.license_category}</td>

                    <td>
                      <span
                        className={
                          driver.license_expired
                            ? "expiry-badge expired"
                            : "expiry-badge valid"
                        }
                      >
                        {driver.license_expired
                          ? "Expired"
                          : driver.license_expiry_date}
                      </span>
                    </td>

                    <td>
                      <div className="safety-score">
                        <div className="safety-track">
                          <span
                            className={getSafetyClass(
                              driver.safety_score
                            )}
                            style={{
                              width: `${driver.safety_score}%`,
                            }}
                          />
                        </div>

                        <strong>
                          {driver.safety_score}%
                        </strong>
                      </div>
                    </td>

                    <td>{driver.region || "—"}</td>

                    <td>
                      <select
                        className={`driver-status ${driver.status
                          .toLowerCase()
                          .replace(" ", "-")}`}
                        value={driver.status}
                        onChange={(event) =>
                          updateStatus(
                            driver.id,
                            event.target.value
                          )
                        }
                      >
                        <option value="Available">
                          Available
                        </option>
                        <option value="On Trip">
                          On Trip
                        </option>
                        <option value="Off Duty">
                          Off Duty
                        </option>
                        <option value="Suspended">
                          Suspended
                        </option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="driver-modal-backdrop">
          <div className="driver-modal">
            <div className="driver-modal-header">
              <div>
                <span>NEW DRIVER PROFILE</span>
                <h2>Register Driver</h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
              >
                <X size={22} />
              </button>
            </div>

            <form
              className="driver-form"
              onSubmit={handleSubmit}
            >
              {error && (
                <div className="driver-form-error">
                  <AlertTriangle size={18} />
                  {error}
                </div>
              )}

              <div className="driver-form-grid">
                <label>
                  Driver Name *
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Alex Patel"
                    required
                  />
                </label>

                <label>
                  Licence Number *
                  <input
                    name="license_number"
                    value={form.license_number}
                    onChange={handleChange}
                    placeholder="GJ01-2026-2817"
                    required
                  />
                </label>

                <label>
                  Licence Category *
                  <select
                    name="license_category"
                    value={form.license_category}
                    onChange={handleChange}
                  >
                    <option value="LMV">LMV</option>
                    <option value="HMV">HMV</option>
                    <option value="HGMV">HGMV</option>
                    <option value="Transport">
                      Transport
                    </option>
                  </select>
                </label>

                <label>
                  Licence Expiry *
                  <input
                    type="date"
                    name="license_expiry_date"
                    value={form.license_expiry_date}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Contact Number
                  <input
                    name="contact_number"
                    value={form.contact_number}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                  />
                </label>

                <label>
                  Safety Score *
                  <input
                    type="number"
                    min="0"
                    max="100"
                    name="safety_score"
                    value={form.safety_score}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Region
                  <input
                    name="region"
                    value={form.region}
                    onChange={handleChange}
                    placeholder="Ahmedabad"
                  />
                </label>

                <label>
                  Initial Status
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="Available">
                      Available
                    </option>
                    <option value="On Trip">
                      On Trip
                    </option>
                    <option value="Off Duty">
                      Off Duty
                    </option>
                    <option value="Suspended">
                      Suspended
                    </option>
                  </select>
                </label>
              </div>

              <div className="driver-form-actions">
                <button
                  type="button"
                  className="driver-cancel"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="driver-submit"
                  disabled={saving}
                >
                  {saving
                    ? "Registering..."
                    : "Register Driver"}
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

export default Drivers;