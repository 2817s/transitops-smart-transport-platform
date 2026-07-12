import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserX,
} from "lucide-react";

import Layout from "../components/Layout";
import api from "../services/api";
import "./AccountRequests.css";

function AccountRequests() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/users/pending");
      setUsers(response.data.users || []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to load account requests"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const updateStatus = async (userId, status) => {
    try {
      setProcessingId(userId);
      setError("");
      setSuccess("");

      const response = await api.patch(
        `/users/${userId}/status`,
        { status }
      );

      setUsers((current) =>
        current.filter((user) => user.id !== userId)
      );

      setSuccess(response.data.message);

      window.setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to update account request"
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Layout>
      <div className="account-requests-page">
        <section className="account-requests-hero">
          <div>
            <span>USER ADMINISTRATION</span>
            <h1>Account Requests</h1>
            <p>
              Review and approve new TransitOps access requests.
            </p>
          </div>

          <button
            type="button"
            onClick={loadRequests}
            disabled={loading}
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </section>

        {success && (
          <div className="request-message request-success">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        {error && (
          <div className="request-message request-error">
            <ShieldCheck size={18} />
            {error}
          </div>
        )}

        <section className="request-summary">
          <div>
            <Clock3 size={22} />
            <span>Pending Requests</span>
            <strong>{users.length}</strong>
          </div>
        </section>

        <section className="requests-card">
          {loading ? (
            <div className="requests-empty">
              Loading account requests...
            </div>
          ) : users.length === 0 ? (
            <div className="requests-empty">
              <UserCheck size={42} />
              <h2>No pending requests</h2>
              <p>All account requests have been reviewed.</p>
            </div>
          ) : (
            <div className="requests-table-wrapper">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Contact</th>
                    <th>Requested Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="request-user">
                          <div>
                            {user.name
                              .split(" ")
                              .map((word) => word[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>

                          <span>
                            <strong>{user.name}</strong>
                            <small>{user.email}</small>
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="request-contact">
                          <span>
                            <Mail size={15} />
                            {user.email}
                          </span>

                          <span>
                            <Phone size={15} />
                            {user.phone || "Not provided"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="request-role">
                          {user.role}
                        </span>
                      </td>

                      <td>
                        <span className="request-status">
                          Pending
                        </span>
                      </td>

                      <td>
                        <div className="request-actions">
                          <button
                            type="button"
                            className="approve-button"
                            disabled={processingId === user.id}
                            onClick={() =>
                              updateStatus(user.id, "Active")
                            }
                          >
                            <UserCheck size={16} />
                            Approve
                          </button>

                          <button
                            type="button"
                            className="reject-button"
                            disabled={processingId === user.id}
                            onClick={() =>
                              updateStatus(user.id, "Rejected")
                            }
                          >
                            <UserX size={16} />
                            Reject
                          </button>
                        </div>
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

export default AccountRequests;