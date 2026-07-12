import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  BusFront,
  CircleCheckBig,
  Clock3,
  Gauge,
  Route,
  Truck,
  UserRoundCheck,
  Wrench,
} from "lucide-react";

import Layout from "../components/Layout";
import api from "../services/api";
import "./Dashboard.css";

const emptyDashboard = {
  summary: {
    totalVehicles: 0,
    availableVehicles: 0,
    onTripVehicles: 0,
    maintenanceVehicles: 0,
    totalDrivers: 0,
    availableDrivers: 0,
    activeTrips: 0,
    completedTrips: 0,
    fleetUtilization: 0,
    totalOperationalCost: 0,
  },

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
  },

  costs: {
    fuelCost: 0,
    otherExpenses: 0,
    maintenanceCost: 0,
    totalOperationalCost: 0,
  },

  recentTrips: [],
};

function Dashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] =
    useState(emptyDashboard);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = JSON.parse(
    localStorage.getItem("transitops_user") || "{}"
  );

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/dashboard/overview"
      );

      setDashboard(
        response.data.data || emptyDashboard
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const activeVehicles =
    Number(dashboard.vehicles.total || 0) -
    Number(dashboard.vehicles.retired || 0);

  const driversOnDuty =
    Number(dashboard.drivers.available || 0) +
    Number(dashboard.drivers.onTrip || 0);

  const kpis = [
    {
      title: "Active Vehicles",
      value: activeVehicles,
      change: `${dashboard.vehicles.total} total`,
      note: "Excluding retired vehicles",
      icon: Truck,
      tone: "indigo",
    },
    {
      title: "Available Vehicles",
      value: dashboard.vehicles.available,
      change: `${dashboard.vehicles.onTrip} on trip`,
      note: "Ready for dispatch",
      icon: CircleCheckBig,
      tone: "emerald",
    },
    {
      title: "In Maintenance",
      value: dashboard.vehicles.inShop,
      change: `${dashboard.costs.maintenanceCost.toLocaleString(
        "en-IN"
      )} cost`,
      note: "Vehicles currently in shop",
      icon: Wrench,
      tone: "amber",
    },
    {
      title: "Active Trips",
      value: dashboard.trips.dispatched,
      change: `${dashboard.trips.completed} completed`,
      note: "Currently dispatched",
      icon: Route,
      tone: "blue",
    },
    {
      title: "Pending Trips",
      value: dashboard.trips.draft,
      change: `${dashboard.trips.cancelled} cancelled`,
      note: "Awaiting dispatch",
      icon: Clock3,
      tone: "rose",
    },
    {
      title: "Drivers On Duty",
      value: driversOnDuty,
      change: `${dashboard.drivers.available} available`,
      note: `${dashboard.drivers.total} total drivers`,
      icon: UserRoundCheck,
      tone: "cyan",
    },
    {
      title: "Fleet Utilization",
      value: `${dashboard.summary.fleetUtilization}%`,
      change: `${dashboard.vehicles.onTrip}/${dashboard.vehicles.total}`,
      note: "Vehicles currently operating",
      icon: Gauge,
      tone: "violet",
    },
  ];

  const fleetPercentages = useMemo(() => {
    const total = Number(
      dashboard.vehicles.total || 0
    );

    if (total === 0) {
      return {
        available: 0,
        onTrip: 0,
        inShop: 0,
      };
    }

    return {
      available:
        (Number(dashboard.vehicles.available || 0) /
          total) *
        100,

      onTrip:
        (Number(dashboard.vehicles.onTrip || 0) /
          total) *
        100,

      inShop:
        (Number(dashboard.vehicles.inShop || 0) /
          total) *
        100,
    };
  }, [dashboard.vehicles]);

  const fleetRingStyle = {
    background: `conic-gradient(
      #10b981 0% ${fleetPercentages.available}%,
      #3b82f6 ${fleetPercentages.available}% ${
        fleetPercentages.available +
        fleetPercentages.onTrip
      }%,
      #f59e0b ${
        fleetPercentages.available +
        fleetPercentages.onTrip
      }% ${
        fleetPercentages.available +
        fleetPercentages.onTrip +
        fleetPercentages.inShop
      }%,
      #ef4444 ${
        fleetPercentages.available +
        fleetPercentages.onTrip +
        fleetPercentages.inShop
      }% 100%
    )`,
  };

  const getTripDistance = (trip) => {
    if (
      trip.status === "Completed" &&
      Number(trip.actual_distance || 0) > 0
    ) {
      return `${Number(
        trip.actual_distance
      ).toLocaleString("en-IN")} km`;
    }

    return `${Number(
      trip.planned_distance || 0
    ).toLocaleString("en-IN")} km`;
  };

  return (
    <Layout>
      <div className="dashboard-page">
        <section className="dashboard-hero">
          <div>
            <span className="eyebrow">
              TRANSPORT OPERATIONS
            </span>

            <h1>
              Welcome back,{" "}
              <span>
                {(user.name || "Operator").split(
                  " "
                )[0]}
              </span>
            </h1>

            <p>
              Your live operational picture is powered by
              TransitOps fleet data.
            </p>
          </div>

          <div className="hero-actions">
            <select defaultValue="all">
              <option value="all">
                All vehicle types
              </option>
              <option value="van">Van</option>
              <option value="truck">Truck</option>
              <option value="mini">Mini</option>
            </select>

            <select defaultValue="all">
              <option value="all">All regions</option>
              <option value="ahmedabad">
                Ahmedabad
              </option>
              <option value="gandhinagar">
                Gandhinagar
              </option>
              <option value="vadodara">
                Vadodara
              </option>
            </select>

            <button
              type="button"
              onClick={loadDashboard}
              disabled={loading}
            >
              {loading
                ? "Refreshing..."
                : "Live Operations"}

              <ArrowUpRight size={17} />
            </button>
          </div>
        </section>

        {error && (
          <div className="dashboard-error-message">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        <section className="kpi-grid">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;

            return (
              <article
                className={`metric-card metric-${kpi.tone}`}
                key={kpi.title}
              >
                <div className="metric-card-top">
                  <div className="metric-icon">
                    <Icon size={21} />
                  </div>

                  <span className="metric-change">
                    {kpi.change}
                  </span>
                </div>

                <strong>
                  {loading ? "—" : kpi.value}
                </strong>

                <h3>{kpi.title}</h3>
                <p>{kpi.note}</p>
              </article>
            );
          })}
        </section>

        <section className="operations-grid">
          <article className="panel trips-panel">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">
                  LIVE ACTIVITY
                </span>

                <h2>Recent Trips</h2>

                <p>
                  Latest fleet movements and delivery
                  status
                </p>
              </div>

              <button
                type="button"
                className="text-action"
                onClick={() => navigate("/trips")}
              >
                View all trips
                <ArrowUpRight size={16} />
              </button>
            </div>

            <div className="table-wrapper">
              {loading ? (
                <div className="dashboard-table-empty">
                  Loading recent trips...
                </div>
              ) : dashboard.recentTrips.length === 0 ? (
                <div className="dashboard-table-empty">
                  No trip records found.
                </div>
              ) : (
                <table className="operations-table">
                  <thead>
                    <tr>
                      <th>Trip</th>
                      <th>Route</th>
                      <th>Vehicle</th>
                      <th>Driver</th>
                      <th>Status</th>
                      <th>Distance</th>
                    </tr>
                  </thead>

                  <tbody>
                    {dashboard.recentTrips.map(
                      (trip) => (
                        <tr key={trip.id}>
                          <td>
                            <strong className="trip-id">
                              {trip.trip_number}
                            </strong>
                          </td>

                          <td>
                            <div className="route-cell">
                              <BusFront size={16} />
                              {trip.source} →{" "}
                              {trip.destination}
                            </div>
                          </td>

                          <td>
                            {trip.vehicle_name || "—"}
                          </td>

                          <td>
                            {trip.driver_name || "—"}
                          </td>

                          <td>
                            <span
                              className={`status-pill status-${String(
                                trip.status
                              )
                                .toLowerCase()
                                .replaceAll(" ", "-")}`}
                            >
                              <i />
                              {trip.status}
                            </span>
                          </td>

                          <td>
                            {getTripDistance(trip)}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </article>

          <article className="panel fleet-health-panel">
            <div className="panel-header compact">
              <div>
                <span className="panel-kicker">
                  FLEET HEALTH
                </span>

                <h2>Vehicle Status</h2>

                <p>Real-time asset distribution</p>
              </div>
            </div>

            <div
              className="fleet-ring"
              style={fleetRingStyle}
            >
              <div className="fleet-ring-inner">
                <strong>
                  {dashboard.vehicles.total}
                </strong>
                <span>Total Fleet</span>
              </div>
            </div>

            <div className="fleet-status-list">
              <div>
                <span>
                  <i className="available-dot" />
                  Available
                </span>

                <strong>
                  {dashboard.vehicles.available}
                </strong>
              </div>

              <div>
                <span>
                  <i className="trip-dot" />
                  On Trip
                </span>

                <strong>
                  {dashboard.vehicles.onTrip}
                </strong>
              </div>

              <div>
                <span>
                  <i className="shop-dot" />
                  In Shop
                </span>

                <strong>
                  {dashboard.vehicles.inShop}
                </strong>
              </div>

              <div>
                <span>
                  <i className="retired-dot" />
                  Retired
                </span>

                <strong>
                  {dashboard.vehicles.retired}
                </strong>
              </div>
            </div>
          </article>
        </section>
      </div>
    </Layout>
  );
}

export default Dashboard;