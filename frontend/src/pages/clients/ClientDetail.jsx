import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  CreditCard,
  FolderKanban,
  Receipt,
  X,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import "./ClientDetail.css";

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // Data states
  const [client, setClient] = useState(null);
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  // Modal & form states
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  // Custom delete state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const fetchClientDetails = async () => {
    try {
      const [clientRes, projectsRes, invoicesRes, paymentsRes] =
        await Promise.all([
          api.get(`/clients/${id}`),
          api.get("/projects"),
          api.get("/invoices"),
          api.get("/payments"),
        ]);
      const c = clientRes.data;
      setClient(c);
      // Populate form details
      setName(c.name);
      setCompany(c.company || "");
      setEmail(c.email);
      setPhone(c.phone || "");
      setAddress(c.address || "");
      setCountry(c.country || "");
      setWebsite(c.website || "");
      setNotes(c.notes || "");
      setStatus(c.status);
      // Filter elements locally
      const clientIdNum = Number(id);
      setProjects(projectsRes.data.filter((p) => p.clientId === clientIdNum));
      setInvoices(invoicesRes.data.filter((i) => i.clientId === clientIdNum));
      setPayments(paymentsRes.data.filter((p) => p.clientId === clientIdNum));
    } catch (err) {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientDetails();
  }, [id]);

  const handleUpdateClient = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/clients/${id}`, {
        name,
        company,
        email,
        phone,
        address,
        country,
        website,
        notes,
        status,
      });
      setClient(res.data);
      setModalOpen(false);
      fetchClientDetails();
    } catch (err) {
      alert("Failed to update client profile");
    }
  };

  const executeDeleteClient = async () => {
    try {
      await api.delete(`/clients/${id}`);
      setDeleteConfirmOpen(false);
      navigate("/clients");
    } catch (err) {
      alert("Failed to delete client");
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(val);
  };

  const getActivityFeed = () => {
    const feed = [];

    // Projects
    projects.forEach((p) => {
      if (p.startDate) {
        feed.push({
          date: p.startDate,
          type: "PROJECT_START",
          title: `Project Initiated: ${p.name}`,
          subtitle: `Budget: ${formatCurrency(p.budget)} | Category: ${p.category || "General"}`,
        });
      }
    });

    // Invoices
    invoices.forEach((inv) => {
      if (inv.issueDate) {
        feed.push({
          date: inv.issueDate,
          type: "INVOICE_SENT",
          title: `Invoice Generated: ${inv.invoiceNumber}`,
          subtitle: `Total Billed: ${formatCurrency(inv.totalAmount)} | Status: ${inv.status}`,
        });
      }
    });

    // Payments
    payments.forEach((pay) => {
      if (pay.paymentDate) {
        feed.push({
          date: pay.paymentDate,
          type: "PAYMENT_RECEIVED",
          title: `Payment Logged: Ref #${pay.id}`,
          subtitle: `Remitted: ${formatCurrency(pay.amount)} | Method: ${pay.paymentMethod}`,
        });
      }
    });

    return feed.sort((a, b) => b.date.localeCompare(a.date));
  };

  if (loading) {
    return (
      <div className="client-detail-loading page-container">
        <div
          className="skeleton"
          style={{
            width: "80px",
            height: "24px",
            marginBottom: "var(--spacing-lg)",
          }}
        ></div>
        <div
          className="skeleton"
          style={{
            height: "120px",
            borderRadius: "var(--radius-lg)",
            marginBottom: "var(--spacing-xl)",
          }}
        ></div>
        <div
          className="skeleton"
          style={{ height: "250px", borderRadius: "var(--radius-lg)" }}
        ></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="page-container text-center" style={{ padding: "80px 0" }}>
        <h3>Client Profile Not Found</h3>
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/clients")}
        >
          Back to CRM
        </button>
      </div>
    );
  }

  return (
    <div className="client-detail-page page-container">
      {/* Back Button */}
      <button
        className="btn btn-secondary btn-sm back-btn"
        onClick={() => navigate("/clients")}
      >
        <ArrowLeft size={16} /> Back to CRM
      </button>

      {/* Profile Header */}
      <div
        className="card client-detail-header-card"
        style={{ marginBottom: "var(--spacing-lg)" }}
      >
        <div className="client-detail-header-row">
          <div className="avatar client-detail-avatar">
            {client.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="client-detail-identity">
            <h1 className="client-detail-name">{client.name}</h1>
            <p className="client-detail-company">
              {client.company || "Independent Client"}
            </p>
            <span
              className={`badge ${client.status === "ACTIVE" ? "badge-success" : "badge-neutral"}`}
              style={{ alignSelf: "flex-start", marginTop: "6px" }}
            >
              {client.status}
            </span>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              className="icon-btn text-blue"
              title="Edit Profile"
              onClick={() => setModalOpen(true)}
            >
              <Pencil size={18} />
            </button>
            <button
              className="icon-btn text-danger"
              title="Delete Profile"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="client-detail-summary-metrics">
            <div className="detail-metric">
              <span className="metric-label">Allocated Projects</span>
              <span className="metric-value">{projects.length}</span>
            </div>
            <div className="detail-metric">
              <span className="metric-label">Invoiced Volume</span>
              <span className="metric-value">
                {formatCurrency(
                  invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="client-detail-tabs">
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <Building2 size={16} /> Overview
        </button>
        <button
          className={`tab-btn ${activeTab === "projects" ? "active" : ""}`}
          onClick={() => setActiveTab("projects")}
        >
          <FolderKanban size={16} /> Projects ({projects.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "invoices" ? "active" : ""}`}
          onClick={() => setActiveTab("invoices")}
        >
          <Receipt size={16} /> Invoices ({invoices.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "payments" ? "active" : ""}`}
          onClick={() => setActiveTab("payments")}
        >
          <CreditCard size={16} /> Payments ({payments.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="client-detail-tab-content">
        {activeTab === "overview" && (
          <div className="card overview-tab-panel">
            <div className="grid-2">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--spacing-lg)",
                }}
              >
                <div className="contact-details-box">
                  <h3
                    className="section-title"
                    style={{ marginBottom: "12px" }}
                  >
                    Contact Information
                  </h3>
                  <div className="meta-list">
                    <div className="client-meta-row">
                      <Mail size={18} className="meta-icon" />
                      <span>{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="client-meta-row">
                        <Phone size={18} className="meta-icon" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.website && (
                      <div className="client-meta-row">
                        <Globe size={18} className="meta-icon" />
                        <a
                          href={`http://${client.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="website-link"
                        >
                          {client.website}
                        </a>
                      </div>
                    )}
                    {client.address && (
                      <div
                        className="client-meta-row"
                        style={{ alignItems: "flex-start" }}
                      >
                        <MapPin
                          size={18}
                          className="meta-icon"
                          style={{ marginTop: "3px" }}
                        />
                        <span>
                          {client.address}, {client.country}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="notes-box">
                  <h3
                    className="section-title"
                    style={{ marginBottom: "12px" }}
                  >
                    CRM Notes
                  </h3>
                  <p className="client-notes-text">
                    {client.notes ||
                      "No custom notes logged. Enter details inside edit client menu."}
                  </p>
                </div>
              </div>

              <div
                className="activity-timeline-box"
                style={{
                  borderLeft: "1px solid var(--color-border-light)",
                  paddingLeft: "var(--spacing-lg)",
                }}
              >
                <h3 className="section-title" style={{ marginBottom: "16px" }}>
                  Account Activity Timeline
                </h3>

                {getActivityFeed().length > 0 ? (
                  <div
                    className="timeline-flow"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    {getActivityFeed().map((act, index) => (
                      <div key={index} style={{ display: "flex", gap: "12px" }}>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              width: "10px",
                              height: "10px",
                              borderRadius: "50%",
                              background:
                                act.type === "PAYMENT_RECEIVED"
                                  ? "var(--color-success)"
                                  : act.type === "INVOICE_SENT"
                                    ? "var(--color-primary)"
                                    : "var(--color-warning)",
                              marginTop: "4px",
                              flexShrink: 0,
                            }}
                          ></div>
                          {index < getActivityFeed().length - 1 && (
                            <div
                              style={{
                                width: "2px",
                                flex: 1,
                                background: "var(--color-border-light)",
                                margin: "4px 0",
                              }}
                            ></div>
                          )}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "2px",
                          }}
                        >
                          <span
                            className="text-xs text-muted"
                            style={{ fontWeight: 600 }}
                          >
                            {act.date}
                          </span>
                          <span
                            className="text-sm font-semibold"
                            style={{ color: "var(--color-text)" }}
                          >
                            {act.title}
                          </span>
                          <span className="text-xs text-muted">
                            {act.subtitle}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted">
                    No transactions, invoices, or project starts logged yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab projects, invoices, payments panels */}
        {activeTab === "projects" && (
          <div className="projects-tab-panel">
            {projects.length > 0 ? (
              <div className="grid-2">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="card project-list-card"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <h3
                      className="project-card-name"
                      style={{ fontSize: "var(--font-size-md)" }}
                    >
                      {project.name}
                    </h3>
                    <p
                      className="card-subtitle"
                      style={{
                        margin: "var(--spacing-xs) 0 var(--spacing-sm) 0",
                      }}
                    >
                      {project.category}
                    </p>
                    <div
                      className="project-card-progress"
                      style={{ margin: "var(--spacing-sm) 0" }}
                    >
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
                      <span
                        className="text-xs text-muted"
                        style={{ display: "block", marginTop: "4px" }}
                      >
                        {project.progress}% Completed
                      </span>
                    </div>
                    <div
                      className="flex-center"
                      style={{
                        justifyContent: "space-between",
                        marginTop: "var(--spacing-sm)",
                      }}
                    >
                      <span
                        className={`badge ${project.priority === "URGENT" || project.priority === "HIGH" ? "badge-danger" : "badge-neutral"}`}
                      >
                        {project.priority}
                      </span>
                      <span className="text-sm font-semibold">
                        {formatCurrency(project.budget)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card text-center" style={{ padding: "60px 0" }}>
                <FolderKanban
                  size={36}
                  style={{ opacity: 0.3, marginBottom: "8px" }}
                />
                <p className="text-muted text-sm">
                  No projects allocated for this client yet.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "invoices" && (
          <div className="card invoices-tab-panel">
            {invoices.length > 0 ? (
              <table
                className="data-table"
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      height: "40px",
                    }}
                  >
                    <th>Invoice #</th>
                    <th>Project</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      style={{
                        borderBottom: "1px solid var(--color-border-light)",
                        height: "52px",
                        cursor: "pointer",
                      }}
                      onClick={() => navigate("/invoices")}
                    >
                      <td className="font-semibold text-blue">
                        {inv.invoiceNumber}
                      </td>
                      <td>{inv.projectName}</td>
                      <td>{inv.dueDate || "N/A"}</td>
                      <td>
                        <span
                          className={`badge ${inv.status === "PAID" ? "badge-success" : inv.status === "SENT" ? "badge-info" : "badge-neutral"}`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="font-semibold">
                        {formatCurrency(inv.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center" style={{ padding: "60px 0" }}>
                <Receipt
                  size={36}
                  style={{ opacity: 0.3, marginBottom: "8px" }}
                />
                <p className="text-muted text-sm">
                  No billing records generated for this client.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "payments" && (
          <div className="card payments-tab-panel">
            {payments.length > 0 ? (
              <table
                className="data-table"
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      height: "40px",
                    }}
                  >
                    <th>Date</th>
                    <th>Project</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((pay) => (
                    <tr
                      key={pay.id}
                      style={{
                        borderBottom: "1px solid var(--color-border-light)",
                        height: "52px",
                      }}
                    >
                      <td>{pay.paymentDate}</td>
                      <td>{pay.projectName}</td>
                      <td>{pay.paymentMethod}</td>
                      <td>
                        <span
                          className={`badge ${pay.status === "COMPLETED" ? "badge-success" : "badge-neutral"}`}
                        >
                          {pay.status}
                        </span>
                      </td>
                      <td className="font-semibold text-green">
                        {formatCurrency(pay.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center" style={{ padding: "60px 0" }}>
                <CreditCard
                  size={36}
                  style={{ opacity: 0.3, marginBottom: "8px" }}
                />
                <p className="text-muted text-sm">
                  No payment logs recorded for this client.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Client Modal */}
      {modalOpen && (
        <div className="modal-backdrop flex-center">
          <div className="modal-content card show">
            <div className="modal-header">
              <h3 className="modal-title">Edit Client Profile</h3>
              <button className="icon-btn" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateClient} className="modal-form">
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Client/Contact Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-input"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    className="form-input"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Website</label>
                <input
                  type="text"
                  className="form-input"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>

              <div className="form-group">
                <label className="form-label">Relationship Status</label>
                <select
                  className="form-input form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="PROSPECT">Prospect</option>
                  <option value="ACTIVE">Active Client</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
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
      {deleteConfirmOpen && (
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
                Are you sure you want to permanently delete client{" "}
                <strong>{client.name}</strong>? This action will remove all
                associated project data and cannot be undone.
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
                  onClick={executeDeleteClient}
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

export default ClientDetail;
