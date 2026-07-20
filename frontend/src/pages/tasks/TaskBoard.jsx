import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  Plus,
  Calendar,
  User,
  X,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import "./TaskBoard.css";

const TaskBoard = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN";

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [labels, setLabels] = useState("");
  const [formProjectId, setFormProjectId] = useState("");

  const columns = [
    { id: "BACKLOG", label: "Backlog", color: "#64748b" },
    { id: "TODO", label: "To Do", color: "#3b82f6" },
    { id: "IN_PROGRESS", label: "In Progress", color: "#8b5cf6" },
    { id: "REVIEW", label: "Review", color: "#f59e0b" },
    { id: "TESTING", label: "Testing", color: "#06b6d4" },
    { id: "COMPLETED", label: "Completed", color: "#10b981" },
  ];

  const fetchBoardData = async () => {
    setLoading(true);
    try {
      const [projectsRes, tasksRes] = await Promise.all([
        api.get("/projects"),
        api.get("/tasks/my-tasks"),
      ]);
      setProjects(projectsRes.data);
      setTasks(tasksRes.data);

      if (projectsRes.data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projectsRes.data[0].id.toString());
      }
    } catch (err) {
      // Handle silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardData();
  }, []);

  const handleEditTaskClick = (task) => {
    if (!isAdmin) return;
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate || "");
    setAssignedTo(task.assignedTo || "");
    setLabels(task.labels ? task.labels.join(", ") : "");
    setFormProjectId(task.projectId.toString());
    setSelectedTask(null);
    setModalOpen(true);
  };

  const handleDeleteTrigger = (taskId) => {
    if (!isAdmin) return;
    setDeleteConfirmTarget(taskId);
  };

  const executeDeleteTask = async () => {
    if (!deleteConfirmTarget) return;
    try {
      await api.delete(`/tasks/${deleteConfirmTarget}`);
      setDeleteConfirmTarget(null);
      setSelectedTask(null);
      fetchBoardData();
    } catch (err) {
      alert("Failed to delete task");
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setStatus("TODO");
    setPriority("MEDIUM");
    setDueDate("");
    setAssignedTo("");
    setLabels("");
    setFormProjectId("");
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    const pid = formProjectId || selectedProjectId;
    if (!pid) {
      alert("Please select a project");
      return;
    }

    const labelList = labels
      .split(",")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const payload = {
      title,
      description,
      status,
      priority,
      dueDate,
      assignedTo,
      labels: labelList,
      projectId: Number(pid),
      position: editingTask
        ? editingTask.position
        : tasks.filter((t) => t.status === status).length,
    };

    try {
      if (editingTask) {
        await api.put(`/tasks/${editingTask.id}`, payload);
      } else {
        await api.post("/tasks", payload);
      }
      closeModal();
      fetchBoardData();
    } catch (err) {
      alert(`Failed to ${editingTask ? "update" : "create"} task`);
    }
  };

  // Drag and Drop implementation
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("text/plain", taskId.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    if (!isAdmin) return;
    const taskIdStr = e.dataTransfer.getData("text/plain");
    if (!taskIdStr) return;

    const taskId = Number(taskIdStr);
    const targetColTasks = tasks.filter((t) => t.status === targetStatus);

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: targetStatus, position: targetColTasks.length }
          : t,
      ),
    );

    try {
      await api.patch(`/tasks/${taskId}/status`, {
        status: targetStatus,
        position: targetColTasks.length,
      });
    } catch (err) {
      // Revert board state on error
      fetchBoardData();
    }
  };

  const getPriorityColorClass = (p) => {
    switch (p) {
      case "URGENT":
        return "badge-danger";
      case "HIGH":
        return "badge-danger";
      case "MEDIUM":
        return "badge-warning";
      default:
        return "badge-neutral";
    }
  };

  const getPriorityLeftBorder = (p) => {
    switch (p) {
      case "URGENT":
        return "3px solid var(--color-danger)";
      case "HIGH":
        return "3px solid var(--color-danger)";
      case "MEDIUM":
        return "3px solid var(--color-warning)";
      default:
        return "3px solid var(--color-primary-light)";
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(val);
  };

  const filteredTasks = selectedProjectId
    ? tasks.filter((t) => t.projectId === Number(selectedProjectId))
    : tasks;

  return (
    <div className="task-board-page page-container">
      {/* Header */}
      <div
        className="dashboard-header"
        style={{ marginBottom: "var(--spacing-lg)" }}
      >
        <div>
          <h1 className="dashboard-title">Kanban Task Board</h1>
          <p className="dashboard-subtitle">
            {isAdmin
              ? "Drag and drop cards across columns to coordinate active sprint deliverables."
              : "Monitor task execution statuses and sprint milestones for your active projects."}
          </p>
        </div>
        {isAdmin && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setFormProjectId(selectedProjectId);
              setModalOpen(true);
            }}
          >
            <Plus size={16} /> Add Task
          </button>
        )}
      </div>

      {/* Board controls */}
      <div className="board-filters-bar card">
        <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>
          Active Project Workspace:
        </label>
        <select
          className="form-input form-select"
          style={{ maxWidth: "280px", margin: 0 }}
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
        >
          <option value="">-- All Projects --</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Board View Grid */}
      {loading ? (
        <div className="skeleton" style={{ height: "400px" }}></div>
      ) : (
        <div
          className="kanban-grid-layout"
          style={{
            display: "flex",
            gap: "16px",
            overflowX: "auto",
            paddingBottom: "16px",
          }}
        >
          {columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className="kanban-column card"
                style={{
                  flex: "0 0 280px",
                  background: "var(--color-surface)",
                  padding: "var(--spacing-md)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--spacing-md)",
                  minHeight: "480px",
                }}
              >
                <div
                  className="column-header-row"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: `2px solid ${col.color}`,
                    paddingBottom: "6px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: col.color,
                      }}
                    ></span>
                    {col.label}
                  </h3>
                  <span
                    className="badge badge-neutral"
                    style={{ fontSize: "11px" }}
                  >
                    {colTasks.length}
                  </span>
                </div>

                <div
                  className="task-list"
                  onDragOver={isAdmin ? handleDragOver : undefined}
                  onDrop={isAdmin ? (e) => handleDrop(e, col.id) : undefined}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    flex: 1,
                    minHeight: "380px",
                  }}
                >
                  {colTasks.length > 0 ? (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="task-card card"
                        draggable={isAdmin}
                        onDragStart={
                          isAdmin
                            ? (e) => handleDragStart(e, task.id)
                            : undefined
                        }
                        onClick={() => setSelectedTask(task)}
                        style={{
                          borderLeft: getPriorityLeftBorder(task.priority),
                          padding: "14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          cursor: "pointer",
                          background: "var(--color-surface)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span
                            className={`badge ${getPriorityColorClass(task.priority)}`}
                            style={{ fontSize: "10px" }}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <h4
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "var(--color-text)",
                          }}
                        >
                          {task.title}
                        </h4>
                        <p
                          className="text-xs text-muted"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {task.description || "No description."}
                        </p>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: "4px",
                            borderTop: "1px solid var(--color-border-light)",
                            paddingTop: "6px",
                            fontSize: "11px",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          {task.dueDate && (
                            <span
                              className="flex-center"
                              style={{ gap: "4px" }}
                            >
                              <Calendar size={12} /> {task.dueDate}
                            </span>
                          )}
                          {task.assignedTo && (
                            <span
                              className="flex-center"
                              style={{ gap: "4px" }}
                            >
                              <User size={12} /> {task.assignedTo}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100px",
                        border: "2px dashed var(--color-border)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--color-text-muted)",
                        fontSize: "12px",
                      }}
                    >
                      Drop tasks here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Setup/Edit Task Modal (Admin Only) */}
      {modalOpen && isAdmin && (
        <div className="modal-backdrop flex-center">
          <div
            className="modal-content card show"
            style={{ maxWidth: "480px" }}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                {editingTask ? "Edit Task Card" : "Add New Task"}
              </h3>
              <button className="icon-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="modal-form">
              <div className="form-group">
                <label className="form-label">Task Header / Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Implement user login filter"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  placeholder="Add specific checklist tasks..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Column Status</label>
                  <select
                    className="form-input form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="BACKLOG">Backlog</option>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="REVIEW">Review</option>
                    <option value="TESTING">Testing</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

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
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Assigned Resource</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Mujammil"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Labels (comma separated)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Bug, Feature, Security"
                  value={labels}
                  onChange={(e) => setLabels(e.target.value)}
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
                  {editingTask ? "Save Changes" : "Create Card"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details Drawer/Modal on Click */}
      {selectedTask && (
        <div className="modal-backdrop flex-center">
          <div
            className="modal-content card show"
            style={{ maxWidth: "440px" }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Task Card Details</h3>
              <button
                className="icon-btn"
                onClick={() => setSelectedTask(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div
              className="task-detail-drawer-body"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--spacing-md)",
              }}
            >
              <span
                className={`badge ${getPriorityColorClass(selectedTask.priority)}`}
                style={{ alignSelf: "flex-start" }}
              >
                {selectedTask.priority} Priority
              </span>
              <h2
                style={{
                  fontSize: "var(--font-size-xl)",
                  color: "var(--color-text)",
                  fontWeight: 700,
                }}
              >
                {selectedTask.title}
              </h2>
              <div className="divider"></div>

              <div
                className="detail-meta-list"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--spacing-sm)",
                }}
              >
                <div className="client-meta-row">
                  <span
                    className="text-xs text-muted"
                    style={{ width: "100px" }}
                  >
                    Status Column
                  </span>
                  <span className="badge badge-neutral">
                    {selectedTask.status}
                  </span>
                </div>
                {selectedTask.dueDate && (
                  <div className="client-meta-row">
                    <span
                      className="text-xs text-muted"
                      style={{ width: "100px" }}
                    >
                      Target Date
                    </span>
                    <span className="text-sm font-semibold">
                      {selectedTask.dueDate}
                    </span>
                  </div>
                )}
                {selectedTask.assignedTo && (
                  <div className="client-meta-row">
                    <span
                      className="text-xs text-muted"
                      style={{ width: "100px" }}
                    >
                      Assigned To
                    </span>
                    <span className="text-sm font-semibold">
                      {selectedTask.assignedTo}
                    </span>
                  </div>
                )}
              </div>

              {selectedTask.description && (
                <div style={{ marginTop: "var(--spacing-md)" }}>
                  <p
                    className="text-xs text-muted"
                    style={{ marginBottom: "4px" }}
                  >
                    Description Details
                  </p>
                  <p
                    className="client-notes-text"
                    style={{ minHeight: "80px", padding: "10px" }}
                  >
                    {selectedTask.description}
                  </p>
                </div>
              )}

              {/* Action row with icons */}
              <div
                className="modal-footer flex-center"
                style={{
                  justifyContent: "space-between",
                  marginTop: "var(--spacing-lg)",
                }}
              >
                {isAdmin ? (
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      className="icon-btn text-blue"
                      title="Edit Task"
                      onClick={() => handleEditTaskClick(selectedTask)}
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      className="icon-btn text-danger"
                      title="Delete Task"
                      onClick={() => handleDeleteTrigger(selectedTask.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ) : (
                  <div></div>
                )}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedTask(null)}
                >
                  Close Card
                </button>
              </div>
            </div>
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
                Are you sure you want to permanently delete this task card? This
                action cannot be undone.
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
                  onClick={executeDeleteTask}
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

export default TaskBoard;
