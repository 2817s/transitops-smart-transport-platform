import { useNavigate } from "react-router-dom";
import { useState } from "react";
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
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "Dispatcher",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", formData);

      localStorage.setItem(
        "transitops_token",
        response.data.token
      );

      localStorage.setItem(
        "transitops_user",
        JSON.stringify(response.data.user)
      );

      navigate("/dashboard");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to connect to TransitOps"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-brand">
        <h1>TransitOps</h1>
        <p>Smart Transport Operations Platform</p>

        <div className="role-list">
          <h3>One login, four roles</h3>
          <span>Fleet Manager</span>
          <span>Dispatcher</span>
          <span>Safety Officer</span>
          <span>Financial Analyst</span>
        </div>
      </div>

      <div className="login-section">
        <form className="login-card" onSubmit={handleSubmit}>
          <h2>Welcome Back</h2>
          <p>Sign in to manage transport operations</p>

          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email"
            required
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
            required
          />

          <label>Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          {error && (
            <div className="error-message">{error}</div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>

          <div className="demo-account">
            <strong>Demo account</strong>
            <span>dispatcher@transitops.in</span>
            <span>Dispatch@123</span>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;