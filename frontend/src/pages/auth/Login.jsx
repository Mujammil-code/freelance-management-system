import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  BrainCircuit,
  Mail,
  Lock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import "./Login.css";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await login({ email, password, rememberMe });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Left side banner */}
      <div className="auth-banner gradient-primary">
        <div className="auth-banner-content">
          <div className="logo-container brand-logo-white">
            <BrainCircuit size={40} className="logo-icon-white" />
            <span className="logo-text-white">
              Freelance<span>OS</span>
            </span>
          </div>
          <h1 className="banner-title">
            Run Your Freelance Business in Auto-Pilot
          </h1>
          <p className="banner-subtitle">
            Consolidate your invoices, clients, real-time chats, calendar, and
            task boards into a single premium SaaS workspace.
          </p>

          <div className="feature-showcase-list">
            <div className="showcase-item">
              <CheckCircle className="showcase-icon" size={20} />
              <span>AI-powered project estimation & milestones generation</span>
            </div>
            <div className="showcase-item">
              <CheckCircle className="showcase-icon" size={20} />
              <span>Interactive Kanban status board with drag & drop</span>
            </div>
            <div className="showcase-item">
              <CheckCircle className="showcase-icon" size={20} />
              <span>Real-time team chat & automated assistant bots</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side form */}
      <div className="auth-form-container">
        <div className="auth-form-box">
          <h2 className="form-title">Welcome back</h2>
          <p className="form-subtitle">
            Enter your credentials to access your dashboard
          </p>

          {error && (
            <div className="auth-alert alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

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

            <div className="form-group">
              <div className="label-row">
                <label className="form-label">Password</label>
                <Link to="/forgot-password" className="auth-link text-sm">
                  Forgot password?
                </Link>
              </div>
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

            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />

              <label htmlFor="remember">Remember me for 30 days</label>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? (
                <span
                  className="skeleton"
                  style={{ width: "40px", height: "14px" }}
                ></span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="auth-footer-text">
            Don't have an account?{" "}
            <Link to="/register" className="auth-link">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
