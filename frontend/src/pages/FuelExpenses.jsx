import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Fuel,
  IndianRupee,
  Plus,
  ReceiptText,
  Search,
  Truck,
  X,
} from "lucide-react";

import Layout from "../components/Layout";
import api from "../services/api";
import "./FuelExpenses.css";

const today = new Date().toISOString().split("T")[0];

const initialFuelForm = {
  vehicle_id: "",
  trip_id: "",
  liters: "",
  fuel_cost: "",
  fuel_date: today,
  odometer: "",
};

const initialExpenseForm = {
  vehicle_id: "",
  trip_id: "",
  expense_type: "Toll",
  description: "",
  amount: "",
  expense_date: today,
};

function FuelExpenses() {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);

  const [summary, setSummary] = useState({
    fuelTotal: 0,
    expenseTotal: 0,
    maintenanceTotal: 0,
    operationalTotal: 0,
  });

  const [fuelForm, setFuelForm] = useState(initialFuelForm);
  const [expenseForm, setExpenseForm] =
    useState(initialExpenseForm);

  const [activeTab, setActiveTab] = useState("fuel");
  const [searchTerm, setSearchTerm] = useState("");

  const [fuelModalOpen, setFuelModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchFuelLogs = async () => {
    const response = await api.get("/costs/fuel");
    setFuelLogs(response.data.fuelLogs || []);
  };

  const fetchExpenses = async () => {
    const response = await api.get("/costs/expenses");
    setExpenses(response.data.expenses || []);
  };

  const fetchSummary = async () => {
    const response = await api.get("/costs/summary");

    setSummary(
      response.data.summary || {
        fuelTotal: 0,
        expenseTotal: 0,
        maintenanceTotal: 0,
        operationalTotal: 0,
      }
    );
  };

  const fetchVehicles = async () => {
    const response = await api.get("/vehicles");
    setVehicles(response.data.vehicles || []);
  };

  const fetchTrips = async () => {
    const response = await api.get("/trips");
    setTrips(response.data.trips || []);
  };

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        fetchFuelLogs(),
        fetchExpenses(),
        fetchSummary(),
        fetchVehicles(),
        fetchTrips(),
      ]);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load fuel and expense data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, []);

  const handleFuelChange = (event) => {
    const { name, value } = event.target;

    setFuelForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  };

  const handleExpenseChange = (event) => {
    const { name, value } = event.target;

    setExpenseForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  };

  const closeFuelModal = () => {
    if (saving) return;

    setFuelModalOpen(false);
    setFuelForm(initialFuelForm);
    setError("");
  };

  const closeExpenseModal = () => {
    if (saving) return;

    setExpenseModalOpen(false);
    setExpenseForm(initialExpenseForm);
    setError("");
  };

  const createFuelLog = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await api.post("/costs/fuel", {
        ...fuelForm,
        vehicle_id: Number(fuelForm.vehicle_id),
        trip_id: fuelForm.trip_id
          ? Number(fuelForm.trip_id)
          : null,
        liters: Number(fuelForm.liters),
        fuel_cost: Number(fuelForm.fuel_cost),
        odometer:
          fuelForm.odometer === ""
            ? null
            : Number(fuelForm.odometer),
      });

      setSuccess("Fuel log recorded successfully");
      setFuelModalOpen(false);
      setFuelForm(initialFuelForm);

      await loadPageData();

      window.setTimeout(() => {
        setSuccess("");
      }, 3500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create fuel log"
      );
    } finally {
      setSaving(false);
    }
  };

  const createExpense = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await api.post("/costs/expenses", {
        ...expenseForm,
        vehicle_id: Number(expenseForm.vehicle_id),
        trip_id: expenseForm.trip_id
          ? Number(expenseForm.trip_id)
          : null,
        amount: Number(expenseForm.amount),
      });

      setSuccess("Expense recorded successfully");
      setExpenseModalOpen(false);
      setExpenseForm(initialExpenseForm);

      await loadPageData();

      window.setTimeout(() => {
        setSuccess("");
      }, 3500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create expense"
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredFuelLogs = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return fuelLogs.filter((log) => {
      return (
        !query ||
        log.vehicle_name.toLowerCase().includes(query) ||
        log.registration_number.toLowerCase().includes(query) ||
        (log.trip_number || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [fuelLogs, searchTerm]);

  const filteredExpenses = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return expenses.filter((expense) => {
      return (
        !query ||
        expense.vehicle_name.toLowerCase().includes(query) ||
        expense.registration_number
          .toLowerCase()
          .includes(query) ||
        expense.expense_type.toLowerCase().includes(query) ||
        (expense.description || "")
          .toLowerCase()
          .includes(query) ||
        (expense.trip_number || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [expenses, searchTerm]);

  const totalLiters = useMemo(
    () =>
      fuelLogs.reduce(
        (sum, log) => sum + Number(log.liters || 0),
        0
      ),
    [fuelLogs]
  );

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  const formatNumber = (value) =>
    Number(value || 0).toLocaleString("en-IN");

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
      <div className="fuel-expenses-page">
        <section className="fuel-expenses-hero">
          <div>
            <span className="fuel-expenses-eyebrow">
              COST CONTROL CENTER
            </span>

            <h1>Fuel & Expenses</h1>

            <p>
              Track fuel consumption, trip costs and total fleet
              operating expenditure.
            </p>
          </div>

          <div className="fuel-expenses-actions">
            <button
              className="secondary-cost-action"
              onClick={() => {
                setError("");
                setExpenseModalOpen(true);
              }}
            >
              <Plus size={18} />
              Add Expense
            </button>

            <button
              className="primary-cost-action"
              onClick={() => {
                setError("");
                setFuelModalOpen(true);
              }}
            >
              <Fuel size={18} />
              Log Fuel
            </button>
          </div>
        </section>

        {success && (
          <div className="cost-message success-message">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        {error && !fuelModalOpen && !expenseModalOpen && (
          <div className="cost-message error-message">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        <section className="cost-metrics">
          <article>
            <div className="cost-metric-icon fuel">
              <Fuel size={22} />
            </div>

            <div>
              <span>Total Fuel Cost</span>
              <strong>
                {formatCurrency(summary.fuelTotal)}
              </strong>
            </div>
          </article>

          <article>
            <div className="cost-metric-icon expense">
              <ReceiptText size={22} />
            </div>

            <div>
              <span>Other Expenses</span>
              <strong>
                {formatCurrency(summary.expenseTotal)}
              </strong>
            </div>
          </article>

          <article>
            <div className="cost-metric-icon maintenance">
              <Truck size={22} />
            </div>

            <div>
              <span>Maintenance Cost</span>
              <strong>
                {formatCurrency(summary.maintenanceTotal)}
              </strong>
            </div>
          </article>

          <article>
            <div className="cost-metric-icon total">
              <CircleDollarSign size={22} />
            </div>

            <div>
              <span>Total Operational Cost</span>
              <strong>
                {formatCurrency(summary.operationalTotal)}
              </strong>
            </div>
          </article>
        </section>

        <section className="fuel-summary-strip">
          <div>
            <Fuel size={20} />

            <div>
              <span>Total Fuel Logged</span>
              <strong>{formatNumber(totalLiters)} L</strong>
            </div>
          </div>

          <div>
            <ReceiptText size={20} />

            <div>
              <span>Fuel Records</span>
              <strong>{fuelLogs.length}</strong>
            </div>
          </div>

          <div>
            <IndianRupee size={20} />

            <div>
              <span>Expense Records</span>
              <strong>{expenses.length}</strong>
            </div>
          </div>
        </section>

        <section className="cost-panel">
          <div className="cost-toolbar">
            <div className="cost-tabs">
              <button
                className={
                  activeTab === "fuel" ? "active" : ""
                }
                onClick={() => setActiveTab("fuel")}
              >
                <Fuel size={17} />
                Fuel Logs
              </button>

              <button
                className={
                  activeTab === "expenses" ? "active" : ""
                }
                onClick={() => setActiveTab("expenses")}
              >
                <ReceiptText size={17} />
                Other Expenses
              </button>
            </div>

            <div className="cost-search">
              <Search size={18} />

              <input
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search vehicle, trip or expense..."
              />
            </div>
          </div>

          {loading ? (
            <div className="cost-empty">
              Loading cost records...
            </div>
          ) : activeTab === "fuel" ? (
            filteredFuelLogs.length === 0 ? (
              <div className="cost-empty">
                <Fuel size={44} />
                <h3>No fuel logs found</h3>
                <p>
                  Record your first fuel transaction to begin
                  tracking consumption.
                </p>
              </div>
            ) : (
              <div className="cost-table-wrapper">
                <table className="cost-table">
                  <thead>
                    <tr>
                      <th>Vehicle</th>
                      <th>Trip</th>
                      <th>Fuel Date</th>
                      <th>Litres</th>
                      <th>Fuel Cost</th>
                      <th>Odometer</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredFuelLogs.map((log) => (
                      <tr key={log.id}>
                        <td>
                          <div className="cost-vehicle-cell">
                            <div className="cost-vehicle-icon">
                              <Truck size={17} />
                            </div>

                            <div>
                              <strong>
                                {log.vehicle_name}
                              </strong>
                              <span>
                                {log.registration_number}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>{log.trip_number || "—"}</td>

                        <td>
                          <div className="cost-date-cell">
                            <CalendarDays size={15} />
                            {formatDate(log.fuel_date)}
                          </div>
                        </td>

                        <td>{formatNumber(log.liters)} L</td>

                        <td>
                          {formatCurrency(log.fuel_cost)}
                        </td>

                        <td>
                          {log.odometer
                            ? `${formatNumber(
                                log.odometer
                              )} km`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : filteredExpenses.length === 0 ? (
            <div className="cost-empty">
              <ReceiptText size={44} />
              <h3>No expenses found</h3>
              <p>
                Add tolls, parking and miscellaneous fleet
                expenses.
              </p>
            </div>
          ) : (
            <div className="cost-table-wrapper">
              <table className="cost-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Trip</th>
                    <th>Expense Type</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>
                        <div className="cost-vehicle-cell">
                          <div className="cost-vehicle-icon">
                            <Truck size={17} />
                          </div>

                          <div>
                            <strong>
                              {expense.vehicle_name}
                            </strong>
                            <span>
                              {expense.registration_number}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>{expense.trip_number || "—"}</td>

                      <td>
                        <span className="expense-type-badge">
                          {expense.expense_type}
                        </span>
                      </td>

                      <td>
                        <span className="expense-description">
                          {expense.description ||
                            "No description"}
                        </span>
                      </td>

                      <td>
                        <div className="cost-date-cell">
                          <CalendarDays size={15} />
                          {formatDate(
                            expense.expense_date
                          )}
                        </div>
                      </td>

                      <td>
                        {formatCurrency(expense.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {fuelModalOpen && (
          <div className="cost-modal-overlay">
            <div className="cost-modal">
              <div className="cost-modal-header">
                <div>
                  <span>NEW FUEL TRANSACTION</span>
                  <h2>Log Fuel</h2>
                </div>

                <button
                  type="button"
                  onClick={closeFuelModal}
                  aria-label="Close"
                >
                  <X size={21} />
                </button>
              </div>

              <form onSubmit={createFuelLog}>
                {error && (
                  <div className="cost-message error-message">
                    <AlertTriangle size={18} />
                    {error}
                  </div>
                )}

                <div className="cost-form-grid">
                  <label>
                    Vehicle *
                    <select
                      name="vehicle_id"
                      value={fuelForm.vehicle_id}
                      onChange={handleFuelChange}
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
                          {vehicle.registration_number}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Related Trip
                    <select
                      name="trip_id"
                      value={fuelForm.trip_id}
                      onChange={handleFuelChange}
                    >
                      <option value="">
                        No linked trip
                      </option>

                      {trips.map((trip) => (
                        <option
                          key={trip.id}
                          value={trip.id}
                        >
                          {trip.trip_number} —{" "}
                          {trip.source} → {trip.destination}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Fuel Litres *
                    <input
                      type="number"
                      name="liters"
                      min="0.01"
                      max="1000"
                      step="0.01"
                      value={fuelForm.liters}
                      onChange={handleFuelChange}
                      placeholder="42"
                      required
                    />
                  </label>

                  <label>
                    Fuel Cost (₹) *
                    <input
                      type="number"
                      name="fuel_cost"
                      min="0"
                      max="1000000"
                      step="0.01"
                      value={fuelForm.fuel_cost}
                      onChange={handleFuelChange}
                      placeholder="3150"
                      required
                    />
                  </label>

                  <label>
                    Fuel Date *
                    <input
                      type="date"
                      name="fuel_date"
                      value={fuelForm.fuel_date}
                      onChange={handleFuelChange}
                      required
                    />
                  </label>

                  <label>
                    Odometer (km)
                    <input
                      type="number"
                      name="odometer"
                      min="0"
                      value={fuelForm.odometer}
                      onChange={handleFuelChange}
                      placeholder="74038"
                    />
                  </label>
                </div>

                <div className="cost-modal-actions">
                  <button
                    type="button"
                    className="secondary-cost-button"
                    onClick={closeFuelModal}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-cost-button"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : "Save Fuel Log"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {expenseModalOpen && (
          <div className="cost-modal-overlay">
            <div className="cost-modal">
              <div className="cost-modal-header">
                <div>
                  <span>NEW OPERATIONAL EXPENSE</span>
                  <h2>Add Expense</h2>
                </div>

                <button
                  type="button"
                  onClick={closeExpenseModal}
                  aria-label="Close"
                >
                  <X size={21} />
                </button>
              </div>

              <form onSubmit={createExpense}>
                {error && (
                  <div className="cost-message error-message">
                    <AlertTriangle size={18} />
                    {error}
                  </div>
                )}

                <div className="cost-form-grid">
                  <label>
                    Vehicle *
                    <select
                      name="vehicle_id"
                      value={expenseForm.vehicle_id}
                      onChange={handleExpenseChange}
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
                          {vehicle.registration_number}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Related Trip
                    <select
                      name="trip_id"
                      value={expenseForm.trip_id}
                      onChange={handleExpenseChange}
                    >
                      <option value="">
                        No linked trip
                      </option>

                      {trips.map((trip) => (
                        <option
                          key={trip.id}
                          value={trip.id}
                        >
                          {trip.trip_number} —{" "}
                          {trip.source} → {trip.destination}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Expense Type *
                    <select
                      name="expense_type"
                      value={expenseForm.expense_type}
                      onChange={handleExpenseChange}
                    >
                      <option value="Toll">Toll</option>
                      <option value="Parking">
                        Parking
                      </option>
                      <option value="Permit">Permit</option>
                      <option value="Cleaning">
                        Cleaning
                      </option>
                      <option value="Miscellaneous">
                        Miscellaneous
                      </option>
                    </select>
                  </label>

                  <label>
                    Amount (₹) *
                    <input
                      type="number"
                      name="amount"
                      min="0"
                      max="10000000"
                      step="0.01"
                      value={expenseForm.amount}
                      onChange={handleExpenseChange}
                      placeholder="350"
                      required
                    />
                  </label>

                  <label>
                    Expense Date *
                    <input
                      type="date"
                      name="expense_date"
                      value={expenseForm.expense_date}
                      onChange={handleExpenseChange}
                      required
                    />
                  </label>

                  <label className="full-width-cost-field">
                    Description
                    <textarea
                      name="description"
                      rows="4"
                      value={expenseForm.description}
                      onChange={handleExpenseChange}
                      placeholder="Describe the expense..."
                    />
                  </label>
                </div>

                <div className="cost-modal-actions">
                  <button
                    type="button"
                    className="secondary-cost-button"
                    onClick={closeExpenseModal}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-cost-button"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : "Save Expense"}
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

export default FuelExpenses;