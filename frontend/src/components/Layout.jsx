import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  BusFront,
  ChevronLeft,
  ChevronRight,
  Fuel,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Truck,
  UserRound,
  UsersRound,
  Wrench,
  X,
} from "lucide-react";
import "./Layout.css";

const navigationItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Fleet",
    path: "/fleet",
    icon: Truck,
  },
  {
    label: "Drivers",
    path: "/drivers",
    icon: UsersRound,
  },
  {
    label: "Trips",
    path: "/trips",
    icon: BusFront,
  },
  {
    label: "Maintenance",
    path: "/maintenance",
    icon: Wrench,
  },
  {
    label: "Fuel & Expenses",
    path: "/fuel-expenses",
    icon: Fuel,
  },
  {
    label: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
];

function Layout({ children }) {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  const user = JSON.parse(
    localStorage.getItem("transitops_user") || "{}"
  );

  const userInitials = (user.name || "TransitOps User")
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("transitops_token");
    localStorage.removeItem("transitops_user");
    navigate("/login");
  };

  return (
    <div
      className={`app-shell ${
        sidebarCollapsed ? "sidebar-is-collapsed" : ""
      }`}
    >
      {sidebarOpen && (
        <button
          type="button"
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={`app-sidebar ${
          sidebarOpen ? "mobile-open" : ""
        }`}
      >
        <div className="sidebar-logo">
          <div className="brand-icon">
            <Gauge size={25} strokeWidth={2.3} />
          </div>

          {!sidebarCollapsed && (
            <div className="brand-copy">
              <strong>TransitOps</strong>
              <span>Command Center</span>
            </div>
          )}

          <button
            type="button"
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-section-label">
          {!sidebarCollapsed && "OPERATIONS"}
        </div>

        <nav className="app-navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={
                  sidebarCollapsed ? item.label : undefined
                }
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />

                {!sidebarCollapsed && (
                  <span>{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <NavLink
            to="/settings"
            className="sidebar-settings-link"
            title={
              sidebarCollapsed ? "Settings" : undefined
            }
            onClick={() => setSidebarOpen(false)}
          >
            <Settings size={20} />

            {!sidebarCollapsed && <span>Settings</span>}
          </NavLink>

          <div className="sidebar-user-card">
            <div className="sidebar-avatar">
              {userInitials}
            </div>

            {!sidebarCollapsed && (
              <div className="sidebar-user-copy">
                <strong>
                  {user.name || "TransitOps User"}
                </strong>

                <span>
                  {user.role || "Authenticated User"}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
            title={sidebarCollapsed ? "Logout" : undefined}
          >
            <LogOut size={19} />

            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>

        <button
          type="button"
          className="sidebar-collapse-button"
          onClick={() =>
            setSidebarCollapsed((current) => !current)
          }
          aria-label="Toggle sidebar"
        >
          {sidebarCollapsed ? (
            <ChevronRight size={17} />
          ) : (
            <ChevronLeft size={17} />
          )}
        </button>
      </aside>

      <main className="app-main">
        <header className="app-topbar">
          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={22} />
          </button>

          <div className="global-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search vehicles, drivers, trips..."
            />

            <span>⌘ K</span>
          </div>

          <div className="topbar-actions">
            <div className="system-live">
              <span />
              System Live
            </div>

            <div className="topbar-role">
              <ShieldCheck size={17} />
              {user.role || "User"}
            </div>

            <div className="topbar-avatar">
              <UserRound size={19} />
            </div>
          </div>
        </header>

        <section className="app-content">
          {children}
        </section>
      </main>
    </div>
  );
}

export default Layout;