import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CircleUserRound,
  Coins,
  Gauge,
  KeyRound,
  LockKeyhole,
  MapPinned,
  RefreshCw,
  Save,
  ShieldCheck,
  UserCog,
} from "lucide-react";

import Layout from "../components/Layout";
import api from "../services/api";
import "./SettingsPage.css";

const initialSettings = {
  depot_name: "",
  currency: "INR (Rs)",
  distance_unit: "Kilometers",
};

function SettingsPage() {
  const [settings, setSettings] = useState(initialSettings);
  const [permissions, setPermissions] = useState([]);
  const [currentUser, setCurrentUser] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const storedUser = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("transitops_user") || "{}"
      );
    } catch {
      return {};
    }
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");

      const [settingsResponse, permissionsResponse] =
        await Promise.all([
          api.get("/settings"),
          api.get("/settings/permissions"),
        ]);

      setSettings(
        settingsResponse.data.settings || initialSettings
      );

      setPermissions(
        permissionsResponse.data.permissions || []
      );

      setCurrentUser(
        permissionsResponse.data.currentUser || storedUser
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load application settings"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setSettings((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const saveSettings = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await api.put("/settings", {
        depot_name: settings.depot_name,
        currency: settings.currency,
        distance_unit: settings.distance_unit,
      });

      setSettings(response.data.settings);

      setSuccess("Settings updated successfully");

      window.setTimeout(() => {
        setSuccess("");
      }, 3500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update settings"
      );
    } finally {
      setSaving(false);
    }
  };

  const getPermissionClass = (permission) => {
    if (permission === "Manage") {
      return "permission-manage";
    }

    if (permission === "View") {
      return "permission-view";
    }

    return "permission-none";
  };

  const currentRole =
    currentUser.role ||
    storedUser.role ||
    "Authenticated User";

  const currentName =
    currentUser.name ||
    storedUser.name ||
    "TransitOps User";

  const currentEmail =
    currentUser.email ||
    storedUser.email ||
    "Authenticated session";

  if (loading) {
    return (
      <Layout>
        <div className="settings-page">
          <div className="settings-loading">
            <RefreshCw size={40} />
            <h2>Loading system settings...</h2>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="settings-page">
        <section className="settings-hero">
          <div>
            <span className="settings-eyebrow">
              SYSTEM CONFIGURATION
            </span>

            <h1>Settings & Access Control</h1>

            <p>
              Configure operational preferences and review
              role-based access across TransitOps.
            </p>
          </div>

          <div className="settings-role-chip">
            <ShieldCheck size={19} />

            <div>
              <span>Current Role</span>
              <strong>{currentRole}</strong>
            </div>
          </div>
        </section>

        {success && (
          <div className="settings-message success-message">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        {error && (
          <div className="settings-message error-message">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        <section className="settings-overview-grid">
          <article>
            <div className="settings-overview-icon depot">
              <Building2 size={22} />
            </div>

            <div>
              <span>Active Depot</span>
              <strong>
                {settings.depot_name || "Not configured"}
              </strong>
            </div>
          </article>

          <article>
            <div className="settings-overview-icon currency">
              <Coins size={22} />
            </div>

            <div>
              <span>Currency</span>
              <strong>{settings.currency}</strong>
            </div>
          </article>

          <article>
            <div className="settings-overview-icon distance">
              <Gauge size={22} />
            </div>

            <div>
              <span>Distance Unit</span>
              <strong>{settings.distance_unit}</strong>
            </div>
          </article>

          <article>
            <div className="settings-overview-icon security">
              <LockKeyhole size={22} />
            </div>

            <div>
              <span>Security</span>
              <strong>JWT + RBAC</strong>
            </div>
          </article>
        </section>

        <section className="settings-content-grid">
          <article className="settings-card configuration-card">
            <div className="settings-card-header">
              <div>
                <span>GENERAL</span>
                <h2>Operational Preferences</h2>
              </div>

              <UserCog size={23} />
            </div>

            <form onSubmit={saveSettings}>
              <label>
                <span>
                  <MapPinned size={17} />
                  Depot Name
                </span>

                <input
                  type="text"
                  name="depot_name"
                  value={settings.depot_name}
                  onChange={handleChange}
                  placeholder="Enter depot name"
                  maxLength="100"
                  required
                />
              </label>

              <label>
                <span>
                  <Coins size={17} />
                  Currency
                </span>

                <select
                  name="currency"
                  value={settings.currency}
                  onChange={handleChange}
                  required
                >
                  <option value="INR (Rs)">INR (Rs)</option>
                  <option value="USD ($)">USD ($)</option>
                  <option value="EUR (€)">EUR (€)</option>
                </select>
              </label>

              <label>
                <span>
                  <Gauge size={17} />
                  Distance Unit
                </span>

                <select
                  name="distance_unit"
                  value={settings.distance_unit}
                  onChange={handleChange}
                  required
                >
                  <option value="Kilometers">
                    Kilometers
                  </option>
                  <option value="Miles">Miles</option>
                </select>
              </label>

              <button
                type="submit"
                className="save-settings-button"
                disabled={saving}
              >
                <Save size={18} />

                {saving
                  ? "Saving Changes..."
                  : "Save Changes"}
              </button>
            </form>
          </article>

          <article className="settings-card account-card">
            <div className="settings-card-header">
              <div>
                <span>AUTHENTICATED SESSION</span>
                <h2>Current Account</h2>
              </div>

              <CircleUserRound size={23} />
            </div>

            <div className="account-profile">
              <div className="account-avatar">
                {currentName
                  .split(" ")
                  .map((word) => word[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>

              <div>
                <strong>{currentName}</strong>
                <span>{currentEmail}</span>
              </div>
            </div>

            <div className="account-detail-list">
              <div>
                <ShieldCheck size={18} />

                <div>
                  <span>Assigned Role</span>
                  <strong>{currentRole}</strong>
                </div>
              </div>

              <div>
                <KeyRound size={18} />

                <div>
                  <span>Authentication</span>
                  <strong>JWT Protected Session</strong>
                </div>
              </div>

              <div>
                <LockKeyhole size={18} />

                <div>
                  <span>Access Model</span>
                  <strong>Role-Based Access Control</strong>
                </div>
              </div>
            </div>

            <div className="security-note">
              <ShieldCheck size={18} />

              <p>
                Protected APIs require a valid authentication
                token. Permissions are assigned according to the
                selected user role.
              </p>
            </div>
          </article>
        </section>

        <section className="settings-card permissions-card">
          <div className="settings-card-header">
            <div>
              <span>ROLE-BASED ACCESS CONTROL</span>
              <h2>Permission Matrix</h2>
            </div>

            <ShieldCheck size={23} />
          </div>

          <div className="permissions-table-wrapper">
            <table className="permissions-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Fleet</th>
                  <th>Drivers</th>
                  <th>Trips</th>
                  <th>Maintenance</th>
                  <th>Costs</th>
                  <th>Analytics</th>
                  <th>Settings</th>
                </tr>
              </thead>

              <tbody>
                {permissions.map((permission) => (
                  <tr key={permission.role}>
                    <td>
                      <div className="permission-role">
                        <div>
                          {permission.role
                            .split(" ")
                            .map((word) => word[0])
                            .join("")
                            .toUpperCase()}
                        </div>

                        <strong>{permission.role}</strong>
                      </div>
                    </td>

                    {[
                      "fleet",
                      "drivers",
                      "trips",
                      "maintenance",
                      "costs",
                      "analytics",
                      "settings",
                    ].map((field) => (
                      <td key={field}>
                        <span
                          className={`permission-badge ${getPermissionClass(
                            permission[field]
                          )}`}
                        >
                          {permission[field]}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default SettingsPage;