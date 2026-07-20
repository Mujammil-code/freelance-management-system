import React, { useState } from "react";
import { Link } from "react-router-dom";
import { BrainCircuit, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import "./Login.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setSent(true);
      setLoading(false);
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
              Forgot Password?
            </h2>
            <p
              className="form-subtitle text-center"
              style={{ marginBottom: "var(--spacing-md)" }}
            >
              No worries! Enter your email below and we'll send you reset
              instructions.
            </p>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-with-icon">
                  <Mail className="input-icon" size={18} />
                  <input
                    type="email"
                    className="form-input"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
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
            <CheckCircle2 size={48} style={{ color: "var(--color-success)" }} />
            <h2 className="form-title">Check your inbox</h2>
            <p className="form-subtitle" style={{ lineHeight: 1.6 }}>
              We have sent password recovery instructions to{" "}
              <strong>{email}</strong>.
            </p>
            <button
              className="btn btn-secondary btn-block"
              onClick={() => setSent(false)}
            >
              Re-enter Email
            </button>
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

export default ForgotPassword;
