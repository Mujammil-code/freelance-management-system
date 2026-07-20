import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import {
  BrainCircuit,
  Mail,
  Lock,
  User as UserIcon,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import "./Login.css"; // sharing basic auth page styles
import "./Register.css";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);

  const checkEmailAvailability = async (emailToCheck) => {
    if (!emailToCheck) {
      setEmailError("");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToCheck)) {
      setEmailError("Invalid email format");
      return;
    }
    try {
      const response = await api.get(
        `/auth/check-email?email=${encodeURIComponent(emailToCheck)}`,
      );
      if (response.data.exists) {
        setEmailError("Email is already in use");
      } else {
        setEmailError("");
      }
    } catch (err) {
      console.error("Error checking email availability:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      await register({ firstName, lastName, email, password });
      navigate("/");
    } catch (err) {
      if (err.response?.data?.errors) {
        const validationErrors = Object.values(err.response.data.errors).join(
          ", ",
        );
        setError(validationErrors);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Email already exists or registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Left side banner */}
      <div className="auth-banner gradient-purple">
        <div className="auth-banner-content">
          <div className="logo-container brand-logo-white">
            <BrainCircuit size={40} className="logo-icon-white" />
            <span className="logo-text-white">
              Freelance<span>OS</span>
            </span>
          </div>
          <h1 className="banner-title">
            Build Your Independent Freelancer Empire
          </h1>
          <p className="banner-subtitle">
            Create professional project estimation proposals, track tasks in
            Kanban columns, log payment receipts, and chat live with clients.
          </p>

          <div className="feature-showcase-list">
            <div className="showcase-item">
              <CheckCircle className="showcase-icon" size={20} />
              <span>Full clients CRM & contact records log</span>
            </div>
            <div className="showcase-item">
              <CheckCircle className="showcase-icon" size={20} />
              <span>Automatic client invoicing & receipt tracking</span>
            </div>
            <div className="showcase-item">
              <CheckCircle className="showcase-icon" size={20} />
              <span>File attachment hosting & calendar schedules</span>
            </div>
          </div>

          <div className="floating-stats-card glass">
            <p className="stats-label">Active Project Milestones</p>
            <p
              className="stats-value"
              style={{ color: "var(--color-primary-light)" }}
            >
              12 Completed
            </p>
            <span className="badge badge-info">2 pending review</span>
          </div>
        </div>
      </div>

      {/* Right side form */}
      <div className="auth-form-container">
        <div className="auth-form-box">
          <h2 className="form-title">Create your account</h2>
          <p className="form-subtitle">
            Get started with FreelanceOS today for free
          </p>

          {error && (
            <div className="auth-alert alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="grid-name-row">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <div className="input-with-icon">
                  <UserIcon className="input-icon" size={18} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Last Name</label>
                <div className="input-with-icon">
                  <UserIcon className="input-icon" size={18} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-with-icon">
                <Mail className="input-icon" size={18} />
                <input
                  type="email"
                  className="form-input"
                  placeholder="john.doe@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  onBlur={(e) => checkEmailAvailability(e.target.value)}
                  required
                />
              </div>
              {emailError && (
                <span className="field-error-message">{emailError}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-with-icon">
                <Lock className="input-icon" size={18} />
                <input
                  type="password"
                  className="form-input"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
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
              {loading ? (
                <span
                  className="skeleton"
                  style={{ width: "40px", height: "14px" }}
                ></span>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <p className="auth-footer-text">
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
