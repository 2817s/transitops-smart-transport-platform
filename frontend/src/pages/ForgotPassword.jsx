import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  ShieldCheck,
} from "lucide-react";

import api from "../services/api";
import "./PasswordReset.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await api.post(
        "/auth/forgot-password",
        {
          email,
        }
      );

      setMessage(response.data.message);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to generate reset link"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="password-reset-page">
      <section className="password-reset-card">
        <div className="reset-icon">
          <ShieldCheck size={30} />
        </div>

        <span className="reset-kicker">
          SECURE ACCOUNT RECOVERY
        </span>

        <h1>Forgot your password?</h1>

        <p className="reset-description">
          Enter your TransitOps work email. A secure reset
          link valid for 15 minutes will be generated.
        </p>

        <form onSubmit={handleSubmit}>
          <label>Work email</label>

          <div className="reset-input">
            <Mail size={18} />

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="name@company.com"
              autoComplete="email"
              required
            />
          </div>

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
              "Generating secure link..."
            ) : (
              <>
                Generate reset link
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <Link to="/login" className="back-login">
          <ArrowLeft size={17} />
          Back to secure sign in
        </Link>
      </section>
    </main>
  );
}

export default ForgotPassword;