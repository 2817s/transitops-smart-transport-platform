import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Fuel,
  IndianRupee,
  Route,
  Target,
  TrendingUp,
  Truck,
  UsersRound,
  Wrench,
} from "lucide-react";

import Layout from "../components/Layout";
import api from "../services/api";
import "./Analytics.css";

const emptyAnalytics = {
  vehicles: {
    total: 0,
    available: 0,
    onTrip: 0,
    inShop: 0,
    retired: 0,
  },
  drivers: {
    total: 0,
    available: 0,
    onTrip: 0,
    offDuty: 0,
    suspended: 0,
  },
  trips: {
    total: 0,
    draft: 0,
    dispatched: 0,
    completed: 0,
    cancelled: 0,
    totalDistance: 0,
    totalRevenue: 0,
  },
  maintenance: {
    total: 0,
    active: 0,
    completed: 0,
    totalCost: 0,
  },
  fuel: {
    totalRecords: 0,
    totalLiters: 0,
    totalCost: 0,
  },
  expenses: {
    totalRecords: 0,
    totalCost: 0,
  },
  totals: {
    operationalCost: 0,
    revenue: 0,
    fleetUtilization: 0,
    tripCompletionRate: 0,
    fuelEfficiency: 0,
    roi: 0,
  },
  vehicleCosts: [],
  monthlyRevenue: [],
  recentTrips: [],
};

function Analytics() {
  const [analytics, setAnalytics] = useState(emptyAnalytics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/analytics/overview");

      setAnalytics(response.data.analytics || emptyAnalytics);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load analytics data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  const formatNumber = (value) =>
    Number(value || 0).toLocaleString("en-IN");

  const vehiclePercentages = useMemo(() => {
    const total = Number(analytics.vehicles.total || 0);

    if (total === 0) {
      return {
        available: 0,
        onTrip: 0,
        inShop: 0,
        retired: 0,
      };
    }

    return {
      available:
        (Number(analytics.vehicles.available || 0) / total) *
        100,
      onTrip:
        (Number(analytics.vehicles.onTrip || 0) / total) * 100,
      inShop:
        (Number(analytics.vehicles.inShop || 0) / total) * 100,
      retired:
        (Number(analytics.vehicles.retired || 0) / total) * 100,
    };
  }, [analytics.vehicles]);

  const donutStyle = {
    background: `conic-gradient(
      #10b981 0% ${vehiclePercentages.available}%,
      #2563eb ${vehiclePercentages.available}% ${
        vehiclePercentages.available +
        vehiclePercentages.onTrip
      }%,
      #f59e0b ${
        vehiclePercentages.available +
        vehiclePercentages.onTrip
      }% ${
        vehiclePercentages.available +
        vehiclePercentages.onTrip +
        vehiclePercentages.inShop
      }%,
      #ef4444 ${
        vehiclePercentages.available +
        vehiclePercentages.onTrip +
        vehiclePercentages.inShop
      }% 100%
    )`,
  };

  const maxVehicleCost = useMemo(() => {
    const costs = analytics.vehicleCosts.map((vehicle) =>
      Number(vehicle.operatingCost || 0)
    );

    return Math.max(...costs, 1);
  }, [analytics.vehicleCosts]);

  if (loading) {
    return (
      <Layout>
        <div className="analytics-page">
          <div className="analytics-loading">
            <BarChart3 size={42} />
            <h2>Loading operational analytics...</h2>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="analytics-page">
        <section className="analytics-hero">
          <div>
            <span className="analytics-eyebrow">
              OPERATIONAL INTELLIGENCE
            </span>

            <h1>Reports & Analytics</h1>

            <p>
              Monitor fleet utilization, operating costs,
              efficiency and transport performance.
            </p>
          </div>

          <button
            className="analytics-refresh-button"
            onClick={loadAnalytics}
          >
            <TrendingUp size={18} />
            Refresh Analytics
          </button>
        </section>

        {error && (
          <div className="analytics-message error-message">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        <section className="analytics-primary-metrics">
          <article>
            <div className="analytics-icon utilization">
              <Truck size={22} />
            </div>

            <div>
              <span>Fleet Utilization</span>
              <strong>
                {analytics.totals.fleetUtilization}%
              </strong>
              <small>
                {analytics.vehicles.onTrip} vehicles currently
                on trip
              </small>
            </div>
          </article>

          <article>
            <div className="analytics-icon completion">
              <CheckCircle2 size={22} />
            </div>

            <div>
              <span>Trip Completion Rate</span>
              <strong>
                {analytics.totals.tripCompletionRate}%
              </strong>
              <small>
                {analytics.trips.completed} completed trips
              </small>
            </div>
          </article>

          <article>
            <div className="analytics-icon efficiency">
              <Fuel size={22} />
            </div>

            <div>
              <span>Fuel Efficiency</span>
              <strong>
                {analytics.totals.fuelEfficiency} km/L
              </strong>
              <small>
                {formatNumber(analytics.fuel.totalLiters)} litres
                consumed
              </small>
            </div>
          </article>

          <article>
            <div className="analytics-icon roi">
              <Target size={22} />
            </div>

            <div>
              <span>Operational ROI</span>
              <strong>{analytics.totals.roi}%</strong>
              <small>
                Revenue compared with operating cost
              </small>
            </div>
          </article>
        </section>

        <section className="analytics-financial-strip">
          <div>
            <CircleDollarSign size={21} />
            <span>Total Revenue</span>
            <strong>
              {formatCurrency(analytics.totals.revenue)}
            </strong>
          </div>

          <div>
            <IndianRupee size={21} />
            <span>Operational Cost</span>
            <strong>
              {formatCurrency(
                analytics.totals.operationalCost
              )}
            </strong>
          </div>

          <div>
            <Fuel size={21} />
            <span>Fuel Cost</span>
            <strong>
              {formatCurrency(analytics.fuel.totalCost)}
            </strong>
          </div>

          <div>
            <Wrench size={21} />
            <span>Maintenance Cost</span>
            <strong>
              {formatCurrency(
                analytics.maintenance.totalCost
              )}
            </strong>
          </div>
        </section>

        <section className="analytics-grid">
          <article className="analytics-card fleet-health-card">
            <div className="analytics-card-header">
              <div>
                <span>FLEET HEALTH</span>
                <h2>Vehicle Distribution</h2>
              </div>

              <Truck size={22} />
            </div>

            <div className="fleet-health-content">
              <div
                className="analytics-donut"
                style={donutStyle}
              >
                <div>
                  <strong>{analytics.vehicles.total}</strong>
                  <span>Total Fleet</span>
                </div>
              </div>

              <div className="analytics-legend">
                <div>
                  <span className="legend-dot available" />
                  Available
                  <strong>
                    {analytics.vehicles.available}
                  </strong>
                </div>

                <div>
                  <span className="legend-dot on-trip" />
                  On Trip
                  <strong>{analytics.vehicles.onTrip}</strong>
                </div>

                <div>
                  <span className="legend-dot in-shop" />
                  In Shop
                  <strong>{analytics.vehicles.inShop}</strong>
                </div>

                <div>
                  <span className="legend-dot retired" />
                  Retired
                  <strong>{analytics.vehicles.retired}</strong>
                </div>
              </div>
            </div>
          </article>

          <article className="analytics-card operations-card">
            <div className="analytics-card-header">
              <div>
                <span>OPERATIONS</span>
                <h2>Operational Summary</h2>
              </div>

              <Route size={22} />
            </div>

            <div className="operations-summary">
              <div>
                <Route size={20} />
                <span>Total Trips</span>
                <strong>{analytics.trips.total}</strong>
              </div>

              <div>
                <UsersRound size={20} />
                <span>Total Drivers</span>
                <strong>{analytics.drivers.total}</strong>
              </div>

              <div>
                <Truck size={20} />
                <span>Total Distance</span>
                <strong>
                  {formatNumber(
                    analytics.trips.totalDistance
                  )}{" "}
                  km
                </strong>
              </div>

              <div>
                <Wrench size={20} />
                <span>Active Maintenance</span>
                <strong>
                  {analytics.maintenance.active}
                </strong>
              </div>
            </div>
          </article>

          <article className="analytics-card cost-breakdown-card">
            <div className="analytics-card-header">
              <div>
                <span>COST ANALYSIS</span>
                <h2>Operating Cost Breakdown</h2>
              </div>

              <CircleDollarSign size={22} />
            </div>

            <div className="cost-breakdown-list">
              <div>
                <div>
                  <Fuel size={18} />
                  <span>Fuel</span>
                </div>

                <strong>
                  {formatCurrency(analytics.fuel.totalCost)}
                </strong>
              </div>

              <div>
                <div>
                  <Wrench size={18} />
                  <span>Maintenance</span>
                </div>

                <strong>
                  {formatCurrency(
                    analytics.maintenance.totalCost
                  )}
                </strong>
              </div>

              <div>
                <div>
                  <IndianRupee size={18} />
                  <span>Other Expenses</span>
                </div>

                <strong>
                  {formatCurrency(
                    analytics.expenses.totalCost
                  )}
                </strong>
              </div>
            </div>
          </article>

          <article className="analytics-card vehicle-cost-card">
            <div className="analytics-card-header">
              <div>
                <span>VEHICLE PERFORMANCE</span>
                <h2>Cost by Vehicle</h2>
              </div>

              <BarChart3 size={22} />
            </div>

            {analytics.vehicleCosts.length === 0 ? (
              <div className="analytics-empty">
                No vehicle cost data available.
              </div>
            ) : (
              <div className="vehicle-cost-list">
                {analytics.vehicleCosts.map((vehicle) => {
                  const percentage =
                    (Number(vehicle.operatingCost || 0) /
                      maxVehicleCost) *
                    100;

                  return (
                    <div
                      className="vehicle-cost-item"
                      key={vehicle.id}
                    >
                      <div className="vehicle-cost-title">
                        <div>
                          <strong>
                            {vehicle.vehicle_name}
                          </strong>
                          <span>
                            {vehicle.registration_number}
                          </span>
                        </div>

                        <strong>
                          {formatCurrency(
                            vehicle.operatingCost
                          )}
                        </strong>
                      </div>

                      <div className="vehicle-cost-track">
                        <span
                          style={{
                            width: `${Math.max(
                              percentage,
                              4
                            )}%`,
                          }}
                        />
                      </div>

                      <small>
                        ROI: {vehicle.roi}% · Revenue:{" "}
                        {formatCurrency(vehicle.revenue)}
                      </small>
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        </section>

        <section className="analytics-card recent-analytics-trips">
          <div className="analytics-card-header">
            <div>
              <span>RECENT ACTIVITY</span>
              <h2>Latest Trips</h2>
            </div>

            <Route size={22} />
          </div>

          {analytics.recentTrips.length === 0 ? (
            <div className="analytics-empty">
              No trip records available.
            </div>
          ) : (
            <div className="analytics-table-wrapper">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Trip</th>
                    <th>Route</th>
                    <th>Vehicle</th>
                    <th>Driver</th>
                    <th>Distance</th>
                    <th>Revenue</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {analytics.recentTrips.map((trip) => (
                    <tr key={trip.id}>
                      <td>
                        <strong>{trip.trip_number}</strong>
                      </td>

                      <td>
                        {trip.source} → {trip.destination}
                      </td>

                      <td>{trip.vehicle_name || "—"}</td>

                      <td>{trip.driver_name || "—"}</td>

                      <td>
                        {trip.status === "Completed"
                          ? trip.actual_distance
                          : trip.planned_distance}{" "}
                        km
                      </td>

                      <td>
                        {formatCurrency(trip.revenue)}
                      </td>

                      <td>
                        <span
                          className={`analytics-status status-${trip.status
                            .toLowerCase()
                            .replaceAll(" ", "-")}`}
                        >
                          {trip.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

export default Analytics;