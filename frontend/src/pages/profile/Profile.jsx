import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { Mail, X, Globe, Phone } from "lucide-react";
import "./Profile.css";

const Profile = () => {
  const { currentUser, updateUser } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [bio, setBio] = useState("");
  // Skills list state
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");

  // Social link state
  const [website, setWebsite] = useState("");
  const [github, setGithub] = useState("");

  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.firstName);
      setLastName(currentUser.lastName);
      setPhone(currentUser.phone || "");
      setJobTitle(currentUser.jobTitle || "");
      setCompany(currentUser.company || "");
      setBio(currentUser.bio || "");
      setSkills(currentUser.skills || []);
      setWebsite(currentUser.socialLinks?.website || "");
      setGithub(currentUser.socialLinks?.github || "");
    }
  }, [currentUser]);

  const handleAddSkill = () => {
    if (!newSkill.trim() || skills.includes(newSkill.trim())) return;
    setSkills([...skills, newSkill.trim()]);
    setNewSkill("");
  };

  const handleRemoveSkill = (skill) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put("/users/me", {
        firstName,
        lastName,
        phone,
        bio,
        jobTitle,
        company,
        skills,
        socialLinks: {
          website,
          github,
        },
      });
      updateUser(res.data);
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Failed to update profile settings");
    }
  };

  return (
    <div className="profile-page page-container">
      {/* Header */}
      <div
        className="dashboard-header"
        style={{ marginBottom: "var(--spacing-lg)" }}
      >
        <div>
          <h1 className="dashboard-title">Profile Settings</h1>
          <p className="dashboard-subtitle">
            Manage your freelancer credentials, bio, and portfolio link tags.
          </p>
        </div>
      </div>

      <div className="profile-split-grid">
        {/* Left Card: Edit form */}
        <div className="card profile-form-panel">
          <h3 className="section-title">Edit Details</h3>
          <form onSubmit={handleSubmitProfile} className="modal-form">
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Professional Job Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Senior Full Stack Developer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Company / Agency Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. FreelanceOS Dev Studio"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Portfolio Website URL</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="www.johndoe.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">GitHub Profile URL</label>
              <input
                type="text"
                className="form-input"
                placeholder="github.com/johndoe"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Biography Details</label>
              <textarea
                className="form-input"
                placeholder="Tell clients about your developer skills, freelance history..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              ></textarea>
            </div>

            {/* Skills dynamic chip builder */}
            <div className="form-group">
              <label className="form-label">Skills & Tech Stack Tags</label>
              <div
                className="skills-builder-input-row"
                style={{ display: "flex", gap: "8px", marginBottom: "8px" }}
              >
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="e.g. Docker"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                />

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAddSkill}
                >
                  + Add Tag
                </button>
              </div>

              <div className="profile-tech-chips" style={{ marginTop: "8px" }}>
                {skills.map((s) => (
                  <span
                    key={s}
                    className="tech-chip-xs"
                    style={{
                      background: "var(--color-primary-bg)",
                      color: "var(--color-primary)",
                      display: "inline-flex",
                      gap: "6px",
                      alignItems: "center",
                    }}
                  >
                    {s}{" "}
                    <X
                      size={12}
                      style={{ cursor: "pointer" }}
                      onClick={() => handleRemoveSkill(s)}
                    />
                  </span>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                alignSelf: "flex-start",
                marginTop: "var(--spacing-md)",
              }}
            >
              Save Profile changes
            </button>
          </form>
        </div>

        {/* Right Card: Preview Card */}
        <div
          className="card profile-preview-panel flex-center"
          style={{ flexDirection: "column", gap: "var(--spacing-md)" }}
        >
          <div
            className="avatar profile-preview-avatar"
            style={{
              width: "80px",
              height: "80px",
              fontSize: "var(--font-size-3xl)",
            }}
          >
            {currentUser
              ? (
                  currentUser.firstName[0] + currentUser.lastName[0]
                ).toUpperCase()
              : "U"}
          </div>

          <div className="text-center">
            <h2 className="profile-preview-name">
              {firstName} {lastName}
            </h2>
            <p className="profile-preview-title">
              {jobTitle || "Independent Freelancer"}
            </p>
            {company && <p className="profile-preview-company">@ {company}</p>}
          </div>

          <div className="divider" style={{ width: "100%" }}></div>

          <div className="meta-list" style={{ width: "100%" }}>
            {currentUser && (
              <div className="client-meta-row">
                <Mail size={16} className="meta-icon" />
                <span>{currentUser.email}</span>
              </div>
            )}
            {phone && (
              <div className="client-meta-row">
                <Phone size={16} className="meta-icon" />
                <span>{phone}</span>
              </div>
            )}
            {website && (
              <div className="client-meta-row">
                <Globe size={16} className="meta-icon" />
                <span className="website-link">{website}</span>
              </div>
            )}
          </div>

          {bio && (
            <div style={{ width: "100%" }}>
              <p className="text-xs text-muted" style={{ marginBottom: "4px" }}>
                Biography Summary
              </p>
              <p
                className="client-notes-text"
                style={{ minHeight: "60px", padding: "10px" }}
              >
                {bio}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
