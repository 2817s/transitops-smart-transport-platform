import { useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
} from "lucide-react";

import api from "../services/api";
import "./PasswordReset.css";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: "",
    confirm_password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] =
    useState(false);

  const [message, setMessage] = useState("");
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

    if (
      formData.password !==
      formData.confirm_password
    ) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setError("");

      const response = await api.post(
        `/auth/reset-password/${token}`,
        formData
      );

      setMessage(response.data.message);

      window.setTimeout(() => {
        navigate("/login");
      }, 1600);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to reset password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="password-reset-page">
      <section className="password-reset-card">
        <div className="reset-icon">
          <KeyRound size={30} />
        </div>

        <span className="reset-kicker">
          RESET CREDENTIALS
        </span>

        <h1>Create a new password</h1>

        <p className="reset-description">
          Enter a secure password for your TransitOps account.
        </p>

        <form onSubmit={handleSubmit}>
          <label>New password</label>

          <div className="reset-input">
            <LockKeyhole size={18} />

            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              required
            />

            <button
              type="button"
              className="reset-password-toggle"
              onClick={() =>
                setShowPassword((current) => !current)
              }
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          <label>Confirm new password</label>

          <div className="reset-input">
            <LockKeyhole size={18} />

            <input
              type={
                showConfirmation ? "text" : "password"
              }
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              placeholder="Repeat your new password"
              autoComplete="new-password"
              required
            />

            <button
              type="button"
              className="reset-password-toggle"
              onClick={() =>
                setShowConfirmation(
                  (current) => !current
                )
              }
            >
              {showConfirmation ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          <p className="password-requirement">
            Use at least 8 characters with uppercase,
            lowercase and a number.
          </p>

          {message && (
            <div className="reset-success">
              {message}
            </div>
          )}

          {error && (
            <div className="reset-error">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? (
              "Resetting password..."
            ) : (
              <>
                Reset password securely
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </section>
    </main>
  );
}

export default ResetPassword;