import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Target,
  ListTodo,
  FolderClosed,
  FileUp,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Code2,
  X,
  Pencil,
  AlertTriangle,
} from "lucide-react";
import "./ProjectDetail.css";

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN";
  // Data states
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  // Project Edit modal & form states
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [status, setStatus] = useState("PLANNING");
  const [technologies, setTechnologies] = useState("");
  const [clientId, setClientId] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceInstructions, setSourceInstructions] = useState("");

  // Add Milestone states
  const [mModalOpen, setMModalOpen] = useState(false);
  const [mTitle, setMTitle] = useState("");
  const [mDescription, setMDescription] = useState("");
  const [mDueDate, setMDueDate] = useState("");

  // File Upload state
  const [uploading, setUploading] = useState(false);

  // Custom delete state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const fetchDetails = async () => {
    try {
      const [projectRes, milestonesRes, tasksRes, filesRes] = await Promise.all(
        [
          api.get(`/projects/${id}`),
          api.get(`/milestones/project/${id}`),
          api.get(`/tasks/project/${id}`),
          api.get(`/files/project/${id}`),
        ],
      );
      const p = projectRes.data;
      setProject(p);
      // Populate edit states
      setName(p.name);
      setDescription(p.description || "");
      setCategory(p.category || "");
      setBudget(p.budget.toString());
      setStartDate(p.startDate || "");
      setDeadline(p.deadline || "");
      setPriority(p.priority);
      setStatus(p.status);
      setTechnologies(p.technologies ? p.technologies.join(", ") : "");
      setClientId(p.clientId.toString());
      setSourceUrl(p.sourceUrl || "");
      setSourceInstructions(p.sourceInstructions || "");

      setMilestones(milestonesRes.data);
      setTasks(tasksRes.data);
      setFiles(filesRes.data);
    } catch (err) {
      // Handle silently
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchDetails().finally(() => setLoading(false));
  }, [id]);

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    const techList = technologies
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      const res = await api.put(`/projects/${id}`, {
        name,
        description,
        category,
        budget: Number(budget),
        startDate,
        deadline,
        priority,
        status,
        technologies: techList,
        clientId: Number(clientId),
        progress: project?.progress || 0,
        sourceUrl,
        sourceInstructions,
      });
      setProject(res.data);
      setModalOpen(false);
      fetchDetails();
    } catch (err) {
      alert("Failed to update project details");
    }
  };

  const executeDeleteProject = async () => {
    try {
      await api.delete(`/projects/${id}`);
      setDeleteConfirmOpen(false);
      navigate("/projects");
    } catch (err) {
      alert("Failed to delete project");
    }
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    try {
      await api.post("/milestones", {
        title: mTitle,
        description: mDescription,
        dueDate: mDueDate,
        status: "PENDING",
        completionPercentage: 0,
        projectId: Number(id),
      });
      setMModalOpen(false);
      setMTitle("");
      setMDescription("");
      setMDueDate("");
      fetchDetails();
    } catch (err) {
      alert("Failed to save milestone");
    }
  };

  const handleToggleMilestone = async (milestone) => {
    if (!isAdmin) return; // Client can't mark milestones complete
    const targetStatus =
      milestone.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    const targetProgress = targetStatus === "COMPLETED" ? 100 : 0;
    try {
      await api.put(`/milestones/${milestone.id}`, {
        title: milestone.title,
        description: milestone.description,
        dueDate: milestone.dueDate,
        status: targetStatus,
        completionPercentage: targetProgress,
        projectId: Number(id),
      });
      fetchDetails();
    } catch (err) {
      alert("Failed to update milestone status");
    }
  };

  const handleFileUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", id);
    formData.append("category", "DOCUMENT");

    try {
      await api.post("/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchDetails();
    } catch (err) {
      alert("Failed to upload file attachment");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadFile = async (fileId, originalName) => {
    try {
      const response = await api.get(`/files/download/${fileId}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to download file");
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(val);
  };

  if (loading) {
    return (
      <div
        className="client-detail-loading page-container flex-center"
        style={{ minHeight: "60vh" }}
      >
        <div
          className="skeleton"
          style={{ width: "80px", height: "80px", borderRadius: "50%" }}
        ></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div
        className="card text-center page-container"
        style={{ padding: "80px 0" }}
      >
        <AlertCircle
          size={48}
          className="text-danger"
          style={{ marginBottom: "12px" }}
        />
        <h3 className="card-title">Project Not Found</h3>
        <p className="card-subtitle">
          The requested project workspace does not exist or has been deleted.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/projects")}
        >
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="project-detail-page page-container">
      {/* Header */}
      <div className="client-detail-header-panel card">
        <button
          className="btn btn-secondary btn-sm back-to-list-btn"
          onClick={() => navigate("/projects")}
        >
          <ArrowLeft size={16} /> Back to Projects
        </button>

        <div
          className="header-main-row"
          style={{ marginTop: "var(--spacing-md)" }}
        >
          <div className="client-title-identity">
            <h1 className="client-name">{project.name}</h1>
            <p className="client-company-subtitle">
              Client Contact: <strong>{project.clientName}</strong> | Category:{" "}
              <strong>{project.category || "Unassigned"}</strong>
            </p>
          </div>

          {isAdmin && (
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                className="icon-btn text-blue"
                title="Edit Project"
                onClick={() => setModalOpen(true)}
              >
                <Pencil size={18} />
              </button>
              <button
                className="icon-btn text-danger"
                title="Delete Project"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}

          <div className="project-detail-summary-metrics">
            <div className="detail-metric">
              <span className="metric-label">Project Budget</span>
              <span className="metric-value">
                {formatCurrency(project.budget)}
              </span>
            </div>
            <div className="detail-metric">
              <span className="metric-label">Paid Volume</span>
              <span className="metric-value text-green">
                {formatCurrency(project.amountPaid)}
              </span>
            </div>
            <div className="detail-metric">
              <span className="metric-label">Completion Status</span>
              <span className="metric-value">{project.progress}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="client-detail-tabs"
        style={{ margin: "var(--spacing-md) 0 var(--spacing-lg) 0" }}
      >
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <Building2 size={16} /> Project Overview
        </button>
        <button
          className={`tab-btn ${activeTab === "milestones" ? "active" : ""}`}
          onClick={() => setActiveTab("milestones")}
        >
          <Target size={16} /> Milestones ({milestones.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "tasks" ? "active" : ""}`}
          onClick={() => setActiveTab("tasks")}
        >
          <ListTodo size={16} /> Kanban Cards ({tasks.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "files" ? "active" : ""}`}
          onClick={() => setActiveTab("files")}
        >
          <FolderClosed size={16} /> Files Manager ({files.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "deliverables" ? "active" : ""}`}
          onClick={() => setActiveTab("deliverables")}
        >
          <Code2 size={16} /> Deliverables Sandbox
        </button>
      </div>

      {/* Tab Panels */}
      <div className="project-detail-tab-content">
        {activeTab === "overview" && (
          <div className="card overview-tab-panel">
            <div className="grid-2">
              <div className="scope-box">
                <h3 className="section-title">Scope Description</h3>
                <p className="client-notes-text" style={{ minHeight: "140px" }}>
                  {project.description ||
                    "No detailed scope description provided."}
                </p>
              </div>

              <div className="meta-box">
                <h3 className="section-title">Timeline & Tech</h3>
                <div className="meta-list">
                  <div className="client-meta-row">
                    <Calendar size={18} className="meta-icon" />
                    <span>Starts: {project.startDate || "N/A"}</span>
                  </div>
                  <div className="client-meta-row">
                    <Calendar size={18} className="meta-icon" />
                    <span>Target Deadline: {project.deadline || "N/A"}</span>
                  </div>
                  <div className="client-meta-row">
                    <Code2 size={18} className="meta-icon" />
                    <span>
                      Technologies Stack:{" "}
                      {project.technologies && project.technologies.length > 0
                        ? project.technologies.join(", ")
                        : "None"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "milestones" && (
          <div className="card milestones-tab-panel">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--spacing-md)",
              }}
            >
              <h3 className="section-title">Project Milestones</h3>
              {isAdmin && (
                <button
                  className="btn btn-primary btn-sm flex-center"
                  onClick={() => setMModalOpen(true)}
                >
                  <Plus size={14} /> Log Milestone
                </button>
              )}
            </div>

            {milestones.length > 0 ? (
              <div
                className="milestones-vertical-list"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="milestone-row-item card"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                      }}
                    >
                      <button
                        className={`icon-btn ${milestone.status === "COMPLETED" ? "text-success" : "text-muted"}`}
                        disabled={!isAdmin}
                        onClick={() => handleToggleMilestone(milestone)}
                        title={isAdmin ? "Toggle Completion Status" : ""}
                      >
                        <CheckCircle size={22} />
                      </button>
                      <div>
                        <h4
                          className={`milestone-title ${milestone.status === "COMPLETED" ? "text-completed" : ""}`}
                          style={{ fontSize: "15px", fontWeight: 600 }}
                        >
                          {milestone.title}
                        </h4>
                        <p
                          className="text-xs text-muted"
                          style={{ marginTop: "2px" }}
                        >
                          Due date: {milestone.dueDate || "N/A"} | Description:{" "}
                          {milestone.description || "None"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`badge ${milestone.status === "COMPLETED" ? "badge-success" : "badge-neutral"}`}
                    >
                      {milestone.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p
                className="text-sm text-muted text-center"
                style={{ padding: "40px 0" }}
              >
                No milestones logged for this workspace.
              </p>
            )}
          </div>
        )}

        {activeTab === "tasks" && (
          <div
            className="card tasks-tab-panel text-center"
            style={{ padding: "60px 0" }}
          >
            <ListTodo
              size={40}
              style={{ opacity: 0.3, marginBottom: "12px" }}
            />
            <h4 style={{ fontWeight: 600 }}>Task boards mapped dynamically</h4>
            <p className="text-sm text-muted" style={{ marginTop: "4px" }}>
              Please jump to Task Board menu to coordinate drag & drop sprint
              deliverables for this project.
            </p>
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginTop: "16px" }}
              onClick={() => navigate("/tasks")}
            >
              Go to Task Board
            </button>
          </div>
        )}

        {activeTab === "files" && (
          <div className="card files-tab-panel">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--spacing-md)",
              }}
            >
              <h3 className="section-title">Files & Contract Attachments</h3>
              <label
                className="btn btn-primary btn-sm flex-center"
                style={{ gap: "4px", cursor: "pointer" }}
              >
                <FileUp size={14} />{" "}
                {uploading ? "Uploading..." : "Upload File"}
                <input
                  type="file"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                  disabled={uploading}
                />
              </label>
            </div>

            {files.length > 0 ? (
              <div
                className="files-grid-detail"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="file-row card"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "14px",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <FolderClosed size={18} className="text-blue" />
                      <div>
                        <p className="text-sm font-semibold">
                          {file.originalFileName}
                        </p>
                        <p className="text-xs text-muted">
                          Uploaded:{" "}
                          {file.createdAt
                            ? file.createdAt.split("T")[0]
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        handleDownloadFile(file.id, file.originalFileName)
                      }
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p
                className="text-sm text-muted text-center"
                style={{ padding: "40px 0" }}
              >
                No file attachments uploaded.
              </p>
            )}
          </div>
        )}

        {activeTab === "deliverables" && (
          <div
            className="card deliverables-tab-panel"
            style={{ padding: "var(--spacing-lg)" }}
          >
            <h3
              className="section-title flex-center"
              style={{
                gap: "8px",
                justifyContent: "flex-start",
                marginBottom: "16px",
              }}
            >
              <Code2 className="text-blue" size={20} /> Project Deliverables
              Release Sandbox
            </h3>
            <div className="divider"></div>

            {project.status === "COMPLETED" ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--spacing-lg)",
                }}
              >
                <div
                  style={{
                    background: "var(--color-primary-bg)",
                    padding: "16px 20px",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-primary-light)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h4
                      style={{ color: "var(--color-primary)", fontWeight: 700 }}
                    >
                      Source Folder Release Ready
                    </h4>
                    <p
                      className="text-xs text-muted"
                      style={{ marginTop: "4px" }}
                    >
                      Click to download secure package archive.
                    </p>
                  </div>
                  {project.sourceUrl ? (
                    <a
                      href={project.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary flex-center"
                      style={{ gap: "6px" }}
                    >
                      Download Source ZIP
                    </a>
                  ) : (
                    <span className="text-sm text-muted">
                      No download link provided by administrator.
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    marginTop: "10px",
                  }}
                >
                  <h4 style={{ fontSize: "14px", fontWeight: 600 }}>
                    Setup & Installation Instructions
                  </h4>
                  <div
                    style={{
                      background: "var(--color-surface-2)",
                      padding: "16px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)",
                      whiteSpace: "pre-wrap",
                      fontSize: "13px",
                      lineHeight: 1.6,
                      fontFamily: "monospace",
                    }}
                  >
                    {project.sourceInstructions ||
                      "No custom instruction logs provided for this release. Contact admin directly."}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center" style={{ padding: "60px 0" }}>
                <AlertCircle
                  size={40}
                  style={{
                    color: "var(--color-warning)",
                    opacity: 0.8,
                    marginBottom: "12px",
                  }}
                />
                <h4 style={{ fontWeight: 600 }}>
                  Release Pending Milestone Sign-Off
                </h4>
                <p className="text-sm text-muted" style={{ marginTop: "4px" }}>
                  Deliverables releases and instruction scripts will unlock
                  automatically upon project workspace status completion.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Setup/Edit Project Modal (Admin Only) */}
      {modalOpen && isAdmin && (
        <div className="modal-backdrop flex-center">
          <div
            className="modal-content card show"
            style={{ maxWidth: "640px" }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Edit Project Details</h3>
              <button className="icon-btn" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateProject} className="modal-form">
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Project Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    className="form-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Project Description</label>
                <textarea
                  className="form-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Total Budget (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Technologies (comma separated)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={technologies}
                    onChange={(e) => setTechnologies(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Deadline</label>
                  <input
                    type="date"
                    className="form-input"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-input form-select"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div
                className="form-group"
                style={{
                  borderTop: "1px solid var(--color-border-light)",
                  paddingTop: "16px",
                  marginTop: "10px",
                }}
              >
                <label
                  className="form-label"
                  style={{ fontWeight: 600, color: "var(--color-primary)" }}
                >
                  Deliverables release download path (ZIP / Git URL)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. https://github.com/myusername/myproject"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label
                  className="form-label"
                  style={{ fontWeight: 600, color: "var(--color-primary)" }}
                >
                  Release Installation instructions
                </label>
                <textarea
                  className="form-input"
                  placeholder="Instructions on how to configure and run the released code package..."
                  value={sourceInstructions}
                  onChange={(e) => setSourceInstructions(e.target.value)}
                ></textarea>
              </div>

              <div
                className="modal-footer flex-center"
                style={{
                  justifyContent: "flex-end",
                  gap: "var(--spacing-md)",
                  marginTop: "var(--spacing-lg)",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Card */}
      {deleteConfirmOpen && isAdmin && (
        <div className="modal-backdrop flex-center" style={{ zIndex: 300 }}>
          <div
            className="modal-content card show"
            style={{ maxWidth: "380px", padding: "var(--spacing-lg)" }}
          >
            <div
              className="text-center"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--spacing-md)",
                alignItems: "center",
              }}
            >
              <div
                className="action-icon-box"
                style={{
                  background: "var(--color-danger-bg)",
                  color: "var(--color-danger)",
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertTriangle size={24} />
              </div>
              <h3
                className="card-title"
                style={{ fontSize: "var(--font-size-lg)", fontWeight: 700 }}
              >
                Confirm Deletion
              </h3>
              <p
                className="card-subtitle"
                style={{
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.4,
                }}
              >
                Are you sure you want to permanently delete project{" "}
                <strong>{project.name}</strong>? This action will remove all
                associated tasks, milestones, and invoice bindings and cannot be
                undone.
              </p>
              <div
                className="flex-center"
                style={{
                  gap: "var(--spacing-md)",
                  width: "100%",
                  marginTop: "var(--spacing-md)",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setDeleteConfirmOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                  onClick={executeDeleteProject}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
