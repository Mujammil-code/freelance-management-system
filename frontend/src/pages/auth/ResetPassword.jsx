import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BrainCircuit, Lock, ArrowLeft } from "lucide-react";
import "./Login.css";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    setTimeout(() => {
      setSent(true);
      setLoading(false);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    }, 1500);
  };

  return (
    <div
      className="auth-page-container flex-center"
      style={{ background: "var(--color-bg)" }}
    >
      <div
        className="auth-form-box card"
        style={{ padding: "var(--spacing-2xl)", maxWidth: "440px" }}
      >
        <div
          className="logo-container flex-center"
          style={{ marginBottom: "var(--spacing-md)" }}
        >
          <BrainCircuit size={36} className="logo-icon" />
          <span className="logo-text">
            Freelance<span>OS</span>
          </span>
        </div>

        {!sent ? (
          <>
            <h2
              className="form-title text-center"
              style={{ fontSize: "var(--font-size-xl)" }}
            >
              Reset Password
            </h2>
            <p className="form-subtitle text-center">
              Enter your new secure password
            </p>

            {error && (
              <div
                className="auth-alert alert-error"
                style={{ marginBottom: "var(--spacing-sm)" }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="input-with-icon">
                  <Lock className="input-icon" size={18} />
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <div className="input-with-icon">
                  <Lock className="input-icon" size={18} />
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Update Password"}
              </button>
            </form>
          </>
        ) : (
          <div
            className="text-center"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing-md)",
              alignItems: "center",
            }}
          >
            <h2
              className="form-title"
              style={{ color: "var(--color-success)" }}
            >
              Password Updated!
            </h2>
            <p className="form-subtitle" style={{ lineHeight: 1.6 }}>
              Your password has been changed successfully. Redirecting you to
              login...
            </p>
          </div>
        )}

        <div className="divider"></div>
        <Link
          to="/login"
          className="auth-link flex-center"
          style={{ gap: "var(--spacing-sm)" }}
        >
          <ArrowLeft size={16} /> Back to Sign In
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;
