import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  Plus,
  Calendar,
  Users,
  FolderKanban,
  X,
  BrainCircuit,
  Pencil,
  Trash2,
  AlertTriangle,
  Sparkles,
  Check,
  Trash,
} from "lucide-react";
import "./Projects.css";

const Projects = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN";

  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab & Modal controllers
  const [activeTab, setActiveTab] = useState("projects");
  const [modalOpen, setModalOpen] = useState(false);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null);

  // Negotiation states
  const [counterProposalTarget, setCounterProposalTarget] = useState(null);
  const [suggestedBudget, setSuggestedBudget] = useState("");
  const [suggestedNotes, setSuggestedNotes] = useState("");

  // Admin Project Form states
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

  // Client Proposal Form States
  const [propName, setPropName] = useState("");
  const [propDesc, setPropDesc] = useState("");
  const [propCat, setPropCat] = useState("");
  const [propBudget, setPropBudget] = useState("");
  const [propDeadline, setPropDeadline] = useState("");

  const fetchProjectsClientsAndProposals = async () => {
    setLoading(true);
    try {
      const [projectsRes, proposalsRes] = await Promise.all([
        api.get("/projects"),
        api.get("/project-proposals"),
      ]);
      setProjects(projectsRes.data);
      setProposals(proposalsRes.data);

      if (isAdmin) {
        const clientsRes = await api.get("/clients", { params: { size: 100 } });
        setClients(clientsRes.data.content);
      }
    } catch (err) {
      // Handle silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsClientsAndProposals();
  }, [currentUser]);

  const handleEditClick = (e, project) => {
    e.stopPropagation();
    setEditingProject(project);
    setName(project.name);
    setDescription(project.description || "");
    setCategory(project.category || "");
    setBudget(project.budget.toString());
    setStartDate(project.startDate || "");
    setDeadline(project.deadline || "");
    setPriority(project.priority);
    setStatus(project.status);
    setTechnologies(
      project.technologies ? project.technologies.join(", ") : "",
    );
    setClientId(project.clientId.toString());
    setModalOpen(true);
  };

  const handleDeleteTrigger = (e, project) => {
    e.stopPropagation();
    setDeleteConfirmTarget(project);
  };

  const executeDeleteProject = async () => {
    if (!deleteConfirmTarget) return;
    try {
      await api.delete(`/projects/${deleteConfirmTarget.id}`);
      setDeleteConfirmTarget(null);
      fetchProjectsClientsAndProposals();
    } catch (err) {
      alert("Failed to delete project");
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProject(null);
    setName("");
    setDescription("");
    setCategory("");
    setBudget("");
    setStartDate("");
    setDeadline("");
    setClientId("");
    setTechnologies("");
    setPriority("MEDIUM");
    setStatus("PLANNING");
  };

  const closeProposalModal = () => {
    setProposalModalOpen(false);
    setPropName("");
    setPropDesc("");
    setPropCat("");
    setPropBudget("");
    setPropDeadline("");
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!clientId) {
      alert("Please select a client");
      return;
    }

    const techList = technologies
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload = {
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
    };

    try {
      if (editingProject) {
        await api.put(`/projects/${editingProject.id}`, {
          ...payload,
          progress: editingProject.progress,
        });
      } else {
        await api.post("/projects", {
          ...payload,
          progress: 0,
        });
      }
      closeModal();
      fetchProjectsClientsAndProposals();
    } catch (err) {
      alert(`Failed to ${editingProject ? "update" : "create"} project`);
    }
  };

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    const payload = {
      name: propName,
      description: propDesc,
      category: propCat,
      budget: Number(propBudget),
      deadline: propDeadline || null,
    };

    try {
      await api.post("/project-proposals", payload);
      closeProposalModal();
      fetchProjectsClientsAndProposals();
    } catch (err) {
      alert("Failed to submit project request");
    }
  };

  const handleApproveProposal = async (id) => {
    try {
      await api.post(`/project-proposals/${id}/approve`);
      fetchProjectsClientsAndProposals();
    } catch (err) {
      alert("Failed to approve proposal");
    }
  };

  const handleRejectProposal = async (id) => {
    try {
      await api.post(`/project-proposals/${id}/reject`);
      fetchProjectsClientsAndProposals();
    } catch (err) {
      alert("Failed to reject proposal");
    }
  };

  // Negotiation Actions
  const handleSubmitCounter = async (e) => {
    e.preventDefault();
    if (!counterProposalTarget) return;

    const endpoint = isAdmin
      ? `/project-proposals/${counterProposalTarget.id}/counter`
      : `/project-proposals/${counterProposalTarget.id}/client-counter`;

    try {
      await api.post(endpoint, {
        budget: Number(suggestedBudget),
        notes: suggestedNotes,
      });
      setCounterProposalTarget(null);
      setSuggestedBudget("");
      setSuggestedNotes("");
      fetchProjectsClientsAndProposals();
    } catch (err) {
      alert("Failed to submit counter offer");
    }
  };

  const handleClientAcceptBudget = async (prop) => {
    try {
      await api.post(`/project-proposals/${prop.id}/client-counter`, {
        budget: prop.budget,
        notes: "I accept the proposed budget of " + formatCurrency(prop.budget),
      });
      fetchProjectsClientsAndProposals();
    } catch (err) {
      alert("Failed to accept budget suggestion");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "COMPLETED":
        return "badge-success";
      case "IN_PROGRESS":
        return "badge-info";
      case "ON_HOLD":
        return "badge-warning";
      case "CANCELLED":
        return "badge-danger";
      default:
        return "badge-neutral";
    }
  };

  const getPriorityBadge = (prio) => {
    switch (prio) {
      case "URGENT":
        return "badge-danger";
      case "HIGH":
        return "badge-warning";
      case "MEDIUM":
        return "badge-info";
      default:
        return "badge-neutral";
    }
  };

  const getProposalStatusBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return "badge-success";
      case "REJECTED":
        return "badge-danger";
      case "ADMIN_COUNTER":
        return "badge-warning";
      case "CLIENT_COUNTER":
        return "badge-info";
      default:
        return "badge-neutral";
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(val);
  };

  return (
    <div className="projects-page page-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            {isAdmin ? "Projects Hub" : "My Projects"}
          </h1>
          <p className="dashboard-subtitle">
            {isAdmin
              ? "Coordinate project milestones, budgets, and technical requirements."
              : "Monitor active project statuses, view milestones, and request new workspaces."}
          </p>
        </div>
        <div
          className="dashboard-header-actions"
          style={{ display: "flex", gap: "var(--spacing-md)" }}
        >
          {isAdmin ? (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => navigate("/ai-estimator")}
              >
                <BrainCircuit size={16} /> AI Estimate Proposal
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setModalOpen(true)}
              >
                <Plus size={16} /> Setup Project
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => setProposalModalOpen(true)}
            >
              <Sparkles size={16} /> Request Project
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div
        className="client-detail-tabs"
        style={{
          margin: "var(--spacing-md) 0 var(--spacing-lg) 0",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <button
          className={`tab-btn ${activeTab === "projects" ? "active" : ""}`}
          onClick={() => setActiveTab("projects")}
        >
          <FolderKanban size={16} />{" "}
          {isAdmin ? "All Projects" : "Active Projects"} ({projects.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "proposals" ? "active" : ""}`}
          onClick={() => setActiveTab("proposals")}
        >
          <Users size={16} />{" "}
          {isAdmin ? "Client Proposals Queue" : "My Project Requests"} (
          {proposals.length})
        </button>
      </div>

      {/* Projects Tab */}
      {activeTab === "projects" &&
        (loading ? (
          <div className="grid-3">
            <div className="skeleton" style={{ height: "220px" }}></div>
            <div className="skeleton" style={{ height: "220px" }}></div>
            <div className="skeleton" style={{ height: "220px" }}></div>
          </div>
        ) : projects.length > 0 ? (
          <div className="grid-3 projects-grid">
            {projects.map((project) => (
              <div
                key={project.id}
                className="card project-card"
                onClick={() => navigate(`/projects/${project.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="project-card-header-row">
                  <span className={`badge ${getStatusBadge(project.status)}`}>
                    {project.status}
                  </span>
                  <span
                    className={`badge ${getPriorityBadge(project.priority)}`}
                  >
                    {project.priority}
                  </span>
                </div>

                <div className="project-card-identity">
                  <h3 className="project-card-title">{project.name}</h3>
                  <p className="project-card-client-name">
                    Client: {project.clientName}
                  </p>
                  <p className="project-card-category">
                    {project.category || "Unassigned Category"}
                  </p>
                </div>

                <div className="project-card-progress-section">
                  <div
                    className="progress-bar-bg"
                    style={{
                      background: "var(--color-surface-2)",
                      height: "8px",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${project.progress}%`,
                        background: "var(--color-primary)",
                        height: "100%",
                      }}
                    ></div>
                  </div>
                  <div className="progress-labels">
                    <span className="text-xs text-muted">
                      {project.progress}% Complete
                    </span>
                    <span className="text-xs font-semibold text-muted">
                      {formatCurrency(project.budget)}
                    </span>
                  </div>
                </div>

                <div className="project-card-footer">
                  {project.deadline ? (
                    <div className="project-footer-meta">
                      <Calendar size={14} className="meta-icon" />
                      <span>Due: {project.deadline}</span>
                    </div>
                  ) : (
                    <span>No deadline set</span>
                  )}
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="project-tech-chips">
                      {project.technologies.slice(0, 3).map((t, idx) => (
                        <span key={idx} className="tech-chip-xs">
                          {t}
                        </span>
                      ))}
                      {project.technologies.length > 3 && (
                        <span className="tech-chip-xs">
                          +{project.technologies.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Edit & Delete Action Row (Icons) - Admin Only */}
                {isAdmin && (
                  <div
                    className="card-actions-row"
                    style={{
                      display: "flex",
                      gap: "12px",
                      marginTop: "12px",
                      borderTop: "1px solid var(--color-border-light)",
                      paddingTop: "10px",
                      justifyContent: "flex-end",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="icon-btn text-blue"
                      title="Edit Workspace"
                      onClick={(e) => handleEditClick(e, project)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-btn text-danger"
                      title="Delete Workspace"
                      onClick={(e) => handleDeleteTrigger(e, project)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div
            className="card text-center flex-center"
            style={{
              padding: "80px 0",
              flexDirection: "column",
              gap: "var(--spacing-md)",
            }}
          >
            <FolderKanban size={48} style={{ opacity: 0.3 }} />
            <h3 className="card-title">No Projects Setup</h3>
            <p className="card-subtitle">
              {isAdmin
                ? "Setup your first project, map deliverables, and sync the Kanban board."
                : "No active project workspaces assigned yet."}
            </p>
            {isAdmin && (
              <button
                className="btn btn-primary"
                onClick={() => setModalOpen(true)}
              >
                + Setup Project
              </button>
            )}
          </div>
        ))}

      {/* Proposals/Requests Tab */}
      {activeTab === "proposals" &&
        (loading ? (
          <div className="skeleton" style={{ height: "300px" }}></div>
        ) : proposals.length > 0 ? (
          <div
            className="proposals-list-flow"
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {proposals.map((prop) => (
              <div
                key={prop.id}
                className="card proposal-card-item"
                style={{
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      maxWidth: "70%",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <h3 style={{ fontSize: "16px", fontWeight: 700 }}>
                        {prop.name}
                      </h3>
                      <span
                        className={`badge ${getProposalStatusBadge(prop.status)}`}
                      >
                        {prop.status === "ADMIN_COUNTER"
                          ? "Admin Proposed Budget"
                          : prop.status === "CLIENT_COUNTER"
                            ? "Client Counter Offer"
                            : prop.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted">
                      {prop.description || "No description provided."}
                    </p>
                  </div>

                  {/* Budget & Target Info */}
                  <div style={{ textAlign: "right" }}>
                    <p
                      className="text-xs text-muted"
                      style={{ fontWeight: 600 }}
                    >
                      CURRENT OFFER
                    </p>
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: 800,
                        color: "var(--color-primary)",
                      }}
                    >
                      {formatCurrency(prop.budget)}
                    </h3>
                    {prop.originalBudget &&
                      prop.originalBudget !== prop.budget && (
                        <p
                          className="text-xs text-muted"
                          style={{ textDecoration: "line-through" }}
                        >
                          Original: {formatCurrency(prop.originalBudget)}
                        </p>
                      )}
                  </div>
                </div>

                <div className="divider" style={{ margin: "8px 0" }}></div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      fontSize: "12px",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    <span>
                      Category: <strong>{prop.category || "Unassigned"}</strong>
                    </span>
                    {prop.deadline && (
                      <span>
                        Target Date: <strong>{prop.deadline}</strong>
                      </span>
                    )}
                    {isAdmin ? (
                      <span>
                        Client:{" "}
                        <strong>
                          {prop.clientName} ({prop.clientEmail})
                        </strong>
                      </span>
                    ) : (
                      <span>
                        Sender: <strong>You</strong>
                      </span>
                    )}
                  </div>

                  {/* Actions Flow */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    {/* Admin Actions */}
                    {isAdmin &&
                      (prop.status === "PENDING" ||
                        prop.status === "CLIENT_COUNTER") && (
                        <>
                          <button
                            className="btn btn-primary btn-sm flex-center"
                            style={{
                              gap: "4px",
                              background: "var(--color-success)",
                            }}
                            onClick={() => handleApproveProposal(prop.id)}
                          >
                            <Check size={14} /> Approve & Setup
                          </button>
                          <button
                            className="btn btn-secondary btn-sm flex-center"
                            style={{ gap: "4px" }}
                            onClick={() => {
                              setCounterProposalTarget(prop);
                              setSuggestedBudget(prop.budget.toString());
                            }}
                          >
                            Counter Offer
                          </button>
                          <button
                            className="btn btn-danger btn-sm flex-center"
                            style={{ gap: "4px" }}
                            onClick={() => handleRejectProposal(prop.id)}
                          >
                            <Trash size={14} /> Reject
                          </button>
                        </>
                      )}

                    {/* Client Actions */}
                    {!isAdmin && prop.status === "ADMIN_COUNTER" && (
                      <>
                        <button
                          className="btn btn-primary btn-sm flex-center"
                          style={{
                            gap: "4px",
                            background: "var(--color-success)",
                          }}
                          onClick={() => handleClientAcceptBudget(prop)}
                        >
                          <Check size={14} /> Accept Budget
                        </button>
                        <button
                          className="btn btn-secondary btn-sm flex-center"
                          style={{ gap: "4px" }}
                          onClick={() => {
                            setCounterProposalTarget(prop);
                            setSuggestedBudget(prop.budget.toString());
                          }}
                        >
                          Counter Offer
                        </button>
                      </>
                    )}

                    {/* Waiting State Badges */}
                    {isAdmin && prop.status === "ADMIN_COUNTER" && (
                      <span className="text-xs text-muted italic">
                        Awaiting Client Response...
                      </span>
                    )}
                    {!isAdmin &&
                      (prop.status === "PENDING" ||
                        prop.status === "CLIENT_COUNTER") && (
                        <span className="text-xs text-muted italic">
                          Awaiting Admin Response...
                        </span>
                      )}
                  </div>
                </div>

                {/* Negotiation Discussion Notes */}
                {prop.negotiationNotes && (
                  <div
                    style={{
                      background: "var(--color-surface-2)",
                      padding: "12px 16px",
                      borderRadius: "var(--radius-md)",
                      borderLeft: "3px solid var(--color-primary)",
                      marginTop: "8px",
                    }}
                  >
                    <p
                      className="text-xs text-muted"
                      style={{ fontWeight: 600, marginBottom: "4px" }}
                    >
                      LATEST NOTE (from {prop.lastSuggestedBy}):
                    </p>
                    <p
                      className="text-sm"
                      style={{ fontStyle: "italic", lineHeight: 1.4 }}
                    >
                      "{prop.negotiationNotes}"
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div
            className="card text-center flex-center"
            style={{
              padding: "80px 0",
              flexDirection: "column",
              gap: "var(--spacing-md)",
            }}
          >
            <Users size={48} style={{ opacity: 0.3 }} />
            <h3 className="card-title">No Proposals Logged</h3>
            <p className="card-subtitle">
              {isAdmin
                ? "Client requests and onboarding project specs will populate here."
                : "Request your first project proposal to initiate collaboration details."}
            </p>
            {!isAdmin && (
              <button
                className="btn btn-primary"
                onClick={() => setProposalModalOpen(true)}
              >
                Request Project
              </button>
            )}
          </div>
        ))}

      {/* Setup/Edit Project Modal (Admin Only) */}
      {modalOpen && isAdmin && (
        <div className="modal-backdrop flex-center">
          <div
            className="modal-content card show"
            style={{ maxWidth: "640px" }}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                {editingProject ? "Edit Project Details" : "Create New Project"}
              </h3>
              <button className="icon-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="modal-form">
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Project Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Mobile Application Development"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Client Name</label>
                  <select
                    className="form-input form-select"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                  >
                    <option value="">-- Select Client --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.company || "Personal"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Project Description</label>
                <textarea
                  className="form-input"
                  placeholder="Detailed scope of work, pages count, target integrations..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Web Development"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Budget (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="5000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    required
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

              <div className="form-group">
                <label className="form-label">
                  Technologies (comma separated)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="React, Spring Boot, PostgreSQL, AWS"
                  value={technologies}
                  onChange={(e) => setTechnologies(e.target.value)}
                />
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
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProject ? "Save Changes" : "Setup Workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Proposal Proposal Form Modal */}
      {proposalModalOpen && !isAdmin && (
        <div className="modal-backdrop flex-center">
          <div
            className="modal-content card show"
            style={{ maxWidth: "520px" }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Request Project workspace</h3>
              <button className="icon-btn" onClick={closeProposalModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitProposal} className="modal-form">
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Acme Billing Dashboard Rewrite"
                  value={propName}
                  onChange={(e) => setPropName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Project Description</label>
                <textarea
                  className="form-input"
                  placeholder="Summarize features, page requirements, target integrations, etc."
                  value={propDesc}
                  onChange={(e) => setPropDesc(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Web App"
                    value={propCat}
                    onChange={(e) => setPropCat(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Budget (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="10000"
                    value={propBudget}
                    onChange={(e) => setPropBudget(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Target Completion Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={propDeadline}
                  onChange={(e) => setPropDeadline(e.target.value)}
                />
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
                  onClick={closeProposalModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suggest Counter Offer Modal */}
      {counterProposalTarget && (
        <div className="modal-backdrop flex-center" style={{ zIndex: 300 }}>
          <div
            className="modal-content card show"
            style={{ maxWidth: "420px", padding: "var(--spacing-lg)" }}
          >
            <div
              className="modal-header"
              style={{ marginBottom: "var(--spacing-md)" }}
            >
              <h3 className="modal-title">Suggest Counter Offer</h3>
              <button
                className="icon-btn"
                onClick={() => setCounterProposalTarget(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmitCounter}
              className="modal-form"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--spacing-md)",
              }}
            >
              <div className="form-group">
                <label className="form-label">Suggested Budget (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={suggestedBudget}
                  onChange={(e) => setSuggestedBudget(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Negotiation Message / Note</label>
                <textarea
                  className="form-input"
                  placeholder="Explain your pricing or scope adjustments..."
                  value={suggestedNotes}
                  onChange={(e) => setSuggestedNotes(e.target.value)}
                  required
                ></textarea>
              </div>

              <div
                className="modal-footer flex-center"
                style={{
                  justifyContent: "flex-end",
                  gap: "var(--spacing-md)",
                  marginTop: "var(--spacing-sm)",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCounterProposalTarget(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Suggestion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Card */}
      {deleteConfirmTarget && isAdmin && (
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
                <strong>{deleteConfirmTarget.name}</strong>? This action will
                remove all associated tasks, milestones, and invoice bindings
                and cannot be undone.
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
                  onClick={() => setDeleteConfirmTarget(null)}
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

export default Projects;
