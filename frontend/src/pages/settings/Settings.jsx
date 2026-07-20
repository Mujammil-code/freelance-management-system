import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Bell,
  Shield,
} from "lucide-react";
import "./Settings.css";

const Settings = () => {
  const { theme, systemSync, toggleTheme, toggleSystemSync } = useTheme();
  // Simulated switches
  const [emailNotify, setEmailNotify] = useState(true);
  const [deadlineNotify, setDeadlineNotify] = useState(true);

  // Form states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match");
      return;
    }
    alert("Password updated successfully!");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="settings-page page-container">
      {/* Header */}
      <div
        className="dashboard-header"
        style={{ marginBottom: "var(--spacing-lg)" }}
      >
        <div>
          <h1
            className="dashboard-title flex-center"
            style={{ gap: "var(--spacing-sm)", justifyContent: "flex-start" }}
          >
            <SettingsIcon className="text-blue" size={32} /> Preferences
          </h1>
          <p className="dashboard-subtitle">
            Configure theme appearance settings, password controls, and alerts
            channels.
          </p>
        </div>
      </div>

      <div className="settings-vertical-flow">
        {/* Appearance Card */}
        <div className="card settings-panel-card">
          <h3
            className="section-title flex-center"
            style={{ gap: "6px", justifyContent: "flex-start" }}
          >
            <Sun size={18} className="text-blue" /> Layout Theme
          </h3>
          <div className="divider"></div>

          <div className="settings-preference-row">
            <div className="pref-description">
              <p className="pref-label">Workspace theme appearance</p>
              <p className="pref-subtext text-xs text-muted">
                Switch the application layout styling between light and dark
                modes.
              </p>
            </div>
            <button
              className="btn btn-secondary flex-center"
              style={{ gap: "6px" }}
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              <span>
                Switch to {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </span>
            </button>
          </div>

          <div
            className="divider"
            style={{ margin: "var(--spacing-sm) 0" }}
          ></div>

          <div className="settings-preference-row toggle-row">
            <div className="pref-description">
              <p className="pref-label">Sync with Operating System settings</p>
              <p className="pref-subtext text-xs text-muted">
                Automatically toggle light/dark theme depending on your system
                settings.
              </p>
            </div>
            <label className="switch-toggle">
              <input
                type="checkbox"
                checked={systemSync}
                onChange={toggleSystemSync}
              />
              <span className="slider-round"></span>
            </label>
          </div>
        </div>

        {/* Notifications Card */}
        <div className="card settings-panel-card">
          <h3
            className="section-title flex-center"
            style={{ gap: "6px", justifyContent: "flex-start" }}
          >
            <Bell size={18} className="text-purple" /> Alert Channels
          </h3>
          <div className="divider"></div>

          <div className="settings-preference-row toggle-row">
            <div className="pref-description">
              <p className="pref-label">Email invoice updates</p>
              <p className="pref-subtext text-xs text-muted">
                Receive alerts on client payment logs and invoice overdue
                markers.
              </p>
            </div>
            <label className="switch-toggle">
              <input
                type="checkbox"
                checked={emailNotify}
                onChange={() => setEmailNotify(!emailNotify)}
              />
              <span className="slider-round"></span>
            </label>
          </div>

          <div
            className="divider"
            style={{ margin: "var(--spacing-sm) 0" }}
          ></div>

          <div className="settings-preference-row toggle-row">
            <div className="pref-description">
              <p className="pref-label">Calendar deadline alerts</p>
              <p className="pref-subtext text-xs text-muted">
                Get notifications for tasks and milestones due dates.
              </p>
            </div>
            <label className="switch-toggle">
              <input
                type="checkbox"
                checked={deadlineNotify}
                onChange={() => setDeadlineNotify(!deadlineNotify)}
              />
              <span className="slider-round"></span>
            </label>
          </div>
        </div>

        {/* Security Card */}
        <div className="card settings-panel-card">
          <h3
            className="section-title flex-center"
            style={{ gap: "6px", justifyContent: "flex-start" }}
          >
            <Shield size={18} className="text-orange" /> Account Security
          </h3>
          <div className="divider"></div>

          <form
            onSubmit={handleUpdatePassword}
            className="modal-form"
            style={{ maxWidth: "400px", marginTop: "var(--spacing-md)" }}
          >
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: "10px" }}
            >
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
