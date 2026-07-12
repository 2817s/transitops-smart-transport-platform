import {
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
import "./Dashboard.css";

const kpis = [
  {
    title: "Active Vehicles",
    value: "53",
    change: "+8.2%",
    note: "4 added this month",
    icon: Truck,
    tone: "indigo",
  },
  {
    title: "Available Vehicles",
    value: "42",
    change: "+5.1%",
    note: "Ready for dispatch",
    icon: CircleCheckBig,
    tone: "emerald",
  },
  {
    title: "In Maintenance",
    value: "5",
    change: "-2",
    note: "2 completing today",
    icon: Wrench,
    tone: "amber",
  },
  {
    title: "Active Trips",
    value: "18",
    change: "+12.4%",
    note: "Across 3 regions",
    icon: Route,
    tone: "blue",
  },
  {
    title: "Pending Trips",
    value: "9",
    change: "3 urgent",
    note: "Awaiting dispatch",
    icon: Clock3,
    tone: "rose",
  },
  {
    title: "Drivers On Duty",
    value: "26",
    change: "81%",
    note: "Current availability",
    icon: UserRoundCheck,
    tone: "cyan",
  },
  {
    title: "Fleet Utilization",
    value: "87%",
    change: "+6.3%",
    note: "Above monthly target",
    icon: Gauge,
    tone: "violet",
  },
];

const trips = [
  {
    id: "TR001",
    route: "Gandhinagar → Ahmedabad",
    vehicle: "VAN-05",
    driver: "Alex",
    status: "On Trip",
    eta: "45 min",
  },
  {
    id: "TR002",
    route: "Vadodara → Surat",
    vehicle: "TRK-12",
    driver: "John",
    status: "Completed",
    eta: "Done",
  },
  {
    id: "TR003",
    route: "Ahmedabad → Rajkot",
    vehicle: "MINI-08",
    driver: "Priya",
    status: "Dispatched",
    eta: "2h 10m",
  },
  {
    id: "TR004",
    route: "Anand → Gandhinagar",
    vehicle: "VAN-09",
    driver: "Suresh",
    status: "Draft",
    eta: "Pending",
  },
];

function Dashboard() {
  const user = JSON.parse(
    localStorage.getItem("transitops_user") || "{}"
  );

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
                {(user.name || "Operator").split(" ")[0]}
              </span>
            </h1>

            <p>
              Your fleet is moving efficiently. Here's the
              live operational picture.
            </p>
          </div>

          <div className="hero-actions">
            <select defaultValue="all">
              <option value="all">All vehicle types</option>
              <option value="van">Van</option>
              <option value="truck">Truck</option>
              <option value="mini">Mini</option>
            </select>

            <select defaultValue="all">
              <option value="all">All regions</option>
              <option value="ahmedabad">Ahmedabad</option>
              <option value="gandhinagar">Gandhinagar</option>
              <option value="vadodara">Vadodara</option>
            </select>

            <button>
              Live Operations
              <ArrowUpRight size={17} />
            </button>
          </div>
        </section>

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

                <strong>{kpi.value}</strong>
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
                  Latest fleet movements and delivery status
                </p>
              </div>

              <button className="text-action">
                View all trips
                <ArrowUpRight size={16} />
              </button>
            </div>

            <div className="table-wrapper">
              <table className="operations-table">
                <thead>
                  <tr>
                    <th>Trip</th>
                    <th>Route</th>
                    <th>Vehicle</th>
                    <th>Driver</th>
                    <th>Status</th>
                    <th>ETA</th>
                  </tr>
                </thead>

                <tbody>
                  {trips.map((trip) => (
                    <tr key={trip.id}>
                      <td>
                        <strong className="trip-id">
                          {trip.id}
                        </strong>
                      </td>

                      <td>
                        <div className="route-cell">
                          <BusFront size={16} />
                          {trip.route}
                        </div>
                      </td>

                      <td>{trip.vehicle}</td>
                      <td>{trip.driver}</td>

                      <td>
                        <span
                          className={`status-pill status-${trip.status
                            .toLowerCase()
                            .replaceAll(" ", "-")}`}
                        >
                          <i />
                          {trip.status}
                        </span>
                      </td>

                      <td>{trip.eta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

            <div className="fleet-ring">
              <div className="fleet-ring-inner">
                <strong>68</strong>
                <span>Total Fleet</span>
              </div>
            </div>

            <div className="fleet-status-list">
              <div>
                <span>
                  <i className="available-dot" />
                  Available
                </span>
                <strong>42</strong>
              </div>

              <div>
                <span>
                  <i className="trip-dot" />
                  On Trip
                </span>
                <strong>18</strong>
              </div>

              <div>
                <span>
                  <i className="shop-dot" />
                  In Shop
                </span>
                <strong>5</strong>
              </div>

              <div>
                <span>
                  <i className="retired-dot" />
                  Retired
                </span>
                <strong>3</strong>
              </div>
            </div>
          </article>
        </section>
      </div>
    </Layout>
  );
}

export default Dashboard;