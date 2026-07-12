import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BusFront,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

import api from "../services/api";
import "./Signup.css";

const roles = [
  "Fleet Manager",
  "Dispatcher",
  "Safety Officer",
  "Financial Analyst",
];

const initialForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirm_password: "",
  role: "Dispatcher",
};

function Signup() {
  const [formData, setFormData] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] =
    useState(false);

  const [submittedUser, setSubmittedUser] =
    useState(null);

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

    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.post(
        "/auth/register",
        formData
      );

      setSubmittedUser(response.data.user);
      setFormData(initialForm);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to submit your account request"
      );
    } finally {
      setLoading(false);
    }
  };

  if (submittedUser) {
    return (
      <main className="signup-page">
        <section className="signup-success-card">
          <div className="signup-success-icon">
            <CheckCircle2 size={38} />
          </div>

          <span>REQUEST SUBMITTED</span>

          <h1>Your account is pending approval</h1>

          <p>
            Welcome, <strong>{submittedUser.name}</strong>.
            Your request for the{" "}
            <strong>{submittedUser.role}</strong> role has
            been saved successfully.
          </p>

          <div className="pending-status-box">
            <ShieldCheck size={20} />

            <div>
              <strong>Status: Pending</strong>
              <span>
                A Fleet Manager must approve the account before
                sign-in is permitted.
              </span>
            </div>
          </div>

          <Link to="/login" className="return-login-button">
            Return to sign in
            <ArrowRight size={18} />
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="signup-page">
      <section className="signup-card">
        <div className="signup-card-header">
          <div className="signup-brand">
            <div>
              <BusFront size={25} />
            </div>

            <div>
              <strong>TransitOps</strong>
              <span>ACCOUNT ACCESS</span>
            </div>
          </div>

          <Link to="/login">
            <ArrowLeft size={17} />
            Back to login
          </Link>
        </div>

        <div className="signup-heading">
          <span>CREATE ACCESS REQUEST</span>
          <h1>Join your transport workspace</h1>
          <p>
            Submit your details and requested operational role.
            New accounts remain pending until approved.
          </p>
        </div>

        <form
          className="signup-form"
          onSubmit={handleSubmit}
        >
          <label>
            Full name *

            <div className="signup-input">
              <UserRound size={18} />

              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Mukt Patel"
                maxLength="80"
                required
              />
            </div>
          </label>

          <label>
            Work email *

            <div className="signup-input">
              <Mail size={18} />

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@company.com"
                required
              />
            </div>
          </label>

          <label>
            Contact number

            <div className="signup-input">
              <Phone size={18} />

              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                maxLength="20"
              />
            </div>
          </label>

          <label>
            Requested role *

            <div className="signup-input">
              <UsersRound size={18} />

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

          <label>
            Password *

            <div className="signup-input">
              <LockKeyhole size={18} />

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 8 characters"
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                aria-label="Toggle password visibility"
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
            Confirm password *

            <div className="signup-input">
              <LockKeyhole size={18} />

              <input
                type={
                  showConfirmation ? "text" : "password"
                }
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="Re-enter your password"
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmation(
                    (current) => !current
                  )
                }
                aria-label="Toggle confirmation visibility"
              >
                {showConfirmation ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </label>

          <div className="signup-password-note">
            Password must include at least eight characters,
            uppercase, lowercase and a number.
          </div>

          {error && (
            <div className="signup-error">
              <ShieldCheck size={18} />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="signup-submit"
            disabled={loading}
          >
            {loading ? (
              "Submitting request..."
            ) : (
              <>
                Submit account request
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Signup;