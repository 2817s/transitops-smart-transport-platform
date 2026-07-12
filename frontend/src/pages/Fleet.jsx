import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Filter,
  Plus,
  Search,
  Truck,
  X,
} from "lucide-react";
import Layout from "../components/Layout";
import api from "../services/api";
import "./Fleet.css";

const initialForm = {
  registration_number: "",
  vehicle_name: "",
  vehicle_model: "",
  vehicle_type: "Van",
  maximum_load_capacity: "",
  odometer: "",
  acquisition_cost: "",
  region: "",
  status: "Available",
};

function Fleet() {
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState(initialForm);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/vehicles");

      setVehicles(response.data.vehicles || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load vehicles"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
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
    setModalOpen(false);
    setFormData(initialForm);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await api.post("/vehicles", {
        ...formData,
        maximum_load_capacity: Number(
          formData.maximum_load_capacity
        ),
        odometer: Number(formData.odometer),
        acquisition_cost: Number(
          formData.acquisition_cost
        ),
      });

      setSuccess("Vehicle registered successfully");
      closeModal();
      await fetchVehicles();

      window.setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to register vehicle"
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredVehicles = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase().trim();

    return vehicles.filter((vehicle) => {
      const matchesSearch =
        !normalizedSearch ||
        vehicle.registration_number
          .toLowerCase()
          .includes(normalizedSearch) ||
        vehicle.vehicle_name
          .toLowerCase()
          .includes(normalizedSearch) ||
        (vehicle.vehicle_model || "")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "All" ||
        vehicle.status === statusFilter;

      const matchesType =
        typeFilter === "All" ||
        vehicle.vehicle_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [vehicles, searchTerm, statusFilter, typeFilter]);

  const availableCount = vehicles.filter(
    (vehicle) => vehicle.status === "Available"
  ).length;

  const onTripCount = vehicles.filter(
    (vehicle) => vehicle.status === "On Trip"
  ).length;

  const inShopCount = vehicles.filter(
    (vehicle) => vehicle.status === "In Shop"
  ).length;

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  return (
    <Layout>
      <div className="fleet-page">
        <section className="fleet-header">
          <div>
            <span className="fleet-eyebrow">
              FLEET OPERATIONS
            </span>

            <h1>Vehicle Registry</h1>

            <p>
              Register, track and manage every vehicle in your
              fleet.
            </p>
          </div>

          <button
            className="add-vehicle-button"
            onClick={() => setModalOpen(true)}
          >
            <Plus size={18} />
            Add Vehicle
          </button>
        </section>

        {success && (
          <div className="fleet-message success-message">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        {error && !modalOpen && (
          <div className="fleet-message error-message">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <section className="fleet-summary-grid">
          <article>
            <div className="summary-icon total">
              <Truck size={21} />
            </div>

            <div>
              <span>Total Vehicles</span>
              <strong>{vehicles.length}</strong>
            </div>
          </article>

          <article>
            <div className="summary-icon available">
              <CheckCircle2 size={21} />
            </div>

            <div>
              <span>Available</span>
              <strong>{availableCount}</strong>
            </div>
          </article>

          <article>
            <div className="summary-icon trip">
              <Truck size={21} />
            </div>

            <div>
              <span>On Trip</span>
              <strong>{onTripCount}</strong>
            </div>
          </article>

          <article>
            <div className="summary-icon shop">
              <Filter size={21} />
            </div>

            <div>
              <span>In Shop</span>
              <strong>{inShopCount}</strong>
            </div>
          </article>
        </section>

        <section className="fleet-panel">
          <div className="fleet-toolbar">
            <div className="fleet-search">
              <Search size={18} />

              <input
                type="text"
                placeholder="Search registration, vehicle or model..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
              />
            </div>

            <div className="fleet-filters">
              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value)
                }
              >
                <option value="All">All Types</option>
                <option value="Van">Van</option>
                <option value="Truck">Truck</option>
                <option value="Mini">Mini</option>
                <option value="Bus">Bus</option>
              </select>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
              >
                <option value="All">All Statuses</option>
                <option value="Available">Available</option>
                <option value="On Trip">On Trip</option>
                <option value="In Shop">In Shop</option>
                <option value="Retired">Retired</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="fleet-state">
              Loading fleet data...
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="fleet-state empty-state">
              <Truck size={38} />

              <h3>No vehicles found</h3>

              <p>
                Register your first vehicle or change the active
                filters.
              </p>
            </div>
          ) : (
            <div className="fleet-table-wrapper">
              <table className="fleet-table">
                <thead>
                  <tr>
                    <th>Registration</th>
                    <th>Vehicle</th>
                    <th>Type</th>
                    <th>Capacity</th>
                    <th>Odometer</th>
                    <th>Acquisition Cost</th>
                    <th>Region</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td>
                        <strong className="registration-number">
                          {vehicle.registration_number}
                        </strong>
                      </td>

                      <td>
                        <div className="vehicle-name-cell">
                          <div className="vehicle-avatar">
                            <Truck size={17} />
                          </div>

                          <div>
                            <strong>
                              {vehicle.vehicle_name}
                            </strong>

                            <span>
                              {vehicle.vehicle_model ||
                                "Model not provided"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>{vehicle.vehicle_type}</td>

                      <td>
                        {vehicle.maximum_load_capacity} kg
                      </td>

                      <td>
                        {Number(vehicle.odometer).toLocaleString(
                          "en-IN"
                        )}{" "}
                        km
                      </td>

                      <td>
                        {formatCurrency(
                          vehicle.acquisition_cost
                        )}
                      </td>

                      <td>{vehicle.region || "—"}</td>

                      <td>
                        <span
                          className={`vehicle-status status-${vehicle.status
                            .toLowerCase()
                            .replaceAll(" ", "-")}`}
                        >
                          <i />
                          {vehicle.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {modalOpen && (
          <div className="fleet-modal-overlay">
            <div className="fleet-modal">
              <div className="fleet-modal-header">
                <div>
                  <span>NEW FLEET ASSET</span>
                  <h2>Register Vehicle</h2>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Close"
                >
                  <X size={21} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="fleet-message error-message">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                <div className="vehicle-form-grid">
                  <label>
                    Registration Number *
                    <input
                      name="registration_number"
                      value={formData.registration_number}
                      onChange={handleChange}
                      placeholder="GJ01AB2817"
                      required
                    />
                  </label>

                  <label>
                    Vehicle Name *
                    <input
                      name="vehicle_name"
                      value={formData.vehicle_name}
                      onChange={handleChange}
                      placeholder="VAN-05"
                      required
                    />
                  </label>

                  <label>
                    Vehicle Model
                    <input
                      name="vehicle_model"
                      value={formData.vehicle_model}
                      onChange={handleChange}
                      placeholder="Tata Winger"
                    />
                  </label>

                  <label>
                    Vehicle Type *
                    <select
                      name="vehicle_type"
                      value={formData.vehicle_type}
                      onChange={handleChange}
                    >
                      <option value="Van">Van</option>
                      <option value="Truck">Truck</option>
                      <option value="Mini">Mini</option>
                      <option value="Bus">Bus</option>
                    </select>
                  </label>

                  <label>
                    Maximum Capacity (kg) *
                    <input
                      name="maximum_load_capacity"
                      type="number"
                      min="1"
                      value={
                        formData.maximum_load_capacity
                      }
                      onChange={handleChange}
                      placeholder="500"
                      required
                    />
                  </label>

                  <label>
                    Current Odometer (km) *
                    <input
                      name="odometer"
                      type="number"
                      min="0"
                      value={formData.odometer}
                      onChange={handleChange}
                      placeholder="12000"
                      required
                    />
                  </label>

                  <label>
                    Acquisition Cost (₹) *
                    <input
                      name="acquisition_cost"
                      type="number"
                      min="0"
                      value={formData.acquisition_cost}
                      onChange={handleChange}
                      placeholder="800000"
                      required
                    />
                  </label>

                  <label>
                    Region
                    <input
                      name="region"
                      value={formData.region}
                      onChange={handleChange}
                      placeholder="Ahmedabad"
                    />
                  </label>

                  <label>
                    Initial Status
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="Available">
                        Available
                      </option>
                      <option value="On Trip">
                        On Trip
                      </option>
                      <option value="In Shop">
                        In Shop
                      </option>
                      <option value="Retired">
                        Retired
                      </option>
                    </select>
                  </label>
                </div>

                <div className="fleet-modal-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={saving}
                  >
                    {saving
                      ? "Registering..."
                      : "Register Vehicle"}
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

export default Fleet;