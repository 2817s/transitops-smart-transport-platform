import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BusFront,
  CheckCircle2,
  Eye,
  EyeOff,
  Fuel,
  LockKeyhole,
  Mail,
  Route,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import api from "../services/api";
import "./Login.css";

const roles = [
  "Fleet Manager",
  "Dispatcher",
  "Safety Officer",
  "Financial Analyst",
];

function Login() {
  const navigate = useNavigate();

  const rememberedEmail =
    localStorage.getItem(
      "transitops_remembered_email"
    ) || "";

  const [formData, setFormData] = useState({
    email: rememberedEmail,
    password: "",
    role: "Dispatcher",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(
    Boolean(rememberedEmail)
  );

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await api.post(
        "/auth/login",
        formData
      );

      localStorage.setItem(
        "transitops_token",
        response.data.token
      );

      localStorage.setItem(
        "transitops_user",
        JSON.stringify(response.data.user)
      );

      if (rememberMe) {
        localStorage.setItem(
          "transitops_remembered_email",
          formData.email
        );
      } else {
        localStorage.removeItem(
          "transitops_remembered_email"
        );
      }

      navigate("/dashboard");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to connect to TransitOps"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-showcase">
        <div className="auth-glow auth-glow-one" />
        <div className="auth-glow auth-glow-two" />

        <div className="auth-brand">
          <div className="auth-brand-icon">
            <BusFront size={28} />
          </div>

          <div>
            <strong>TransitOps</strong>
            <span>Command Center</span>
          </div>
        </div>

        <div className="auth-showcase-content">
          <div className="auth-live-badge">
            <span />
            SMART TRANSPORT OPERATIONS
          </div>

          <h1>
            Move every operation with{" "}
            <span>clarity and control.</span>
          </h1>

          <p>
            A secure command center for fleet visibility,
            dispatch management, maintenance, costs and
            operational intelligence.
          </p>

          <div className="auth-feature-grid">
            <article>
              <div>
                <Route size={20} />
              </div>
              <strong>Live Dispatch</strong>
              <span>
                Track trips, vehicles and drivers in real time.
              </span>
            </article>

            <article>
              <div>
                <ShieldCheck size={20} />
              </div>
              <strong>Secure RBAC</strong>
              <span>
                Role-specific permissions protect every action.
              </span>
            </article>

            <article>
              <div>
                <Fuel size={20} />
              </div>
              <strong>Cost Control</strong>
              <span>
                Monitor fuel, maintenance and fleet expenses.
              </span>
            </article>

            <article>
              <div>
                <BarChart3 size={20} />
              </div>
              <strong>Smart Analytics</strong>
              <span>
                Turn operational data into useful insights.
              </span>
            </article>
          </div>
        </div>

        <div className="auth-showcase-footer">
          <Sparkles size={17} />
          Built for modern fleet operations
        </div>
      </section>

      <section className="auth-form-section">
        <div className="auth-form-shell">
          <div className="auth-mobile-brand">
            <div className="auth-brand-icon">
              <BusFront size={24} />
            </div>

            <div>
              <strong>TransitOps</strong>
              <span>Command Center</span>
            </div>
          </div>

          <div className="auth-form-heading">
            <span>SECURE ACCESS</span>
            <h2>Welcome back</h2>
            <p>
              Sign in to access your transport operations
              workspace.
            </p>
          </div>

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            <label>
              Work email

              <div className="auth-input">
                <Mail size={18} />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  autoComplete="email"
                  required
                />
              </div>
            </label>

            <label>
              Password

              <div className="auth-input">
                <LockKeyhole size={18} />

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>

            <label>
              Workspace role

              <div className="auth-input">
                <UserRound size={18} />

                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <div className="auth-options">
              <label className="remember-option">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) =>
                    setRememberMe(event.target.checked)
                  }
                />
                Remember my email
              </label>

              <button
                type="button"
                className="forgot-password"
                onClick={() =>
                  navigate("/forgot-password")
                }
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="auth-error">
                <ShieldCheck size={18} />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit-button"
              disabled={loading}
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  Sign in securely
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>New to TransitOps?</span>
          </div>

          <Link
            to="/signup"
            className="create-account-link"
          >
            Create an account request
            <ArrowRight size={17} />
          </Link>

          <div className="auth-security-note">
            <CheckCircle2 size={17} />
            JWT authentication and role-based permissions are
            enabled.
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;