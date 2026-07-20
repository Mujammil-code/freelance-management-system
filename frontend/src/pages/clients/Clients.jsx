import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  Search,
  Plus,
  Mail,
  Building2,
  Phone,
  Globe,
  X,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import "./Clients.css";

const Clients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null);

  // Form states
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await api.get("/clients", {
        params: { query, size: 50 },
      });
      setClients(res.data.content);
    } catch (err) {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [query]);

  const handleEditClick = (e, client) => {
    e.stopPropagation();
    setEditingClient(client);
    setName(client.name);
    setCompany(client.company || "");
    setEmail(client.email);
    setPhone(client.phone || "");
    setAddress(client.address || "");
    setCountry(client.country || "");
    setWebsite(client.website || "");
    setNotes(client.notes || "");
    setStatus(client.status);
    setModalOpen(true);
  };

  const handleDeleteTrigger = (e, client) => {
    e.stopPropagation();
    setDeleteConfirmTarget(client);
  };

  const executeDeleteClient = async () => {
    if (!deleteConfirmTarget) return;
    try {
      await api.delete(`/clients/${deleteConfirmTarget.id}`);
      setDeleteConfirmTarget(null);
      fetchClients();
    } catch (err) {
      alert("Failed to delete client");
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingClient(null);
    setName("");
    setCompany("");
    setEmail("");
    setPhone("");
    setAddress("");
    setCountry("");
    setWebsite("");
    setNotes("");
    setStatus("ACTIVE");
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        company,
        email,
        phone,
        address,
        country,
        website,
        notes,
        status,
      };

      if (editingClient) {
        await api.put(`/clients/${editingClient.id}`, payload);
      } else {
        await api.post("/clients", payload);
      }

      closeModal();
      fetchClients();
    } catch (err) {
      alert(`Failed to ${editingClient ? "update" : "create"} client`);
    }
  };

  return (
    <div className="clients-page page-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Clients CRM</h1>
          <p className="dashboard-subtitle">
            Manage client accounts and communication history.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Add Client
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar-card card">
        <div
          className="search-bar-wrapper"
          style={{ display: "block", maxWidth: "400px" }}
        >
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search by name, company, or email..."
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid of Client Cards */}
      {loading ? (
        <div className="grid-3">
          <div className="skeleton" style={{ height: "180px" }}></div>
          <div className="skeleton" style={{ height: "180px" }}></div>
          <div className="skeleton" style={{ height: "180px" }}></div>
        </div>
      ) : clients.length > 0 ? (
        <div className="grid-3 clients-grid">
          {clients.map((client) => (
            <div
              key={client.id}
              className="card client-card"
              onClick={() => navigate(`/clients/${client.id}`)}
            >
              <div className="client-card-header">
                <div className="avatar client-avatar-large">
                  {client.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="client-header-text">
                  <h3 className="client-card-name">{client.name}</h3>
                  <span
                    className={`badge ${client.status === "ACTIVE" ? "badge-success" : "badge-neutral"}`}
                  >
                    {client.status}
                  </span>
                </div>
              </div>

              <div className="client-card-body">
                {client.company && (
                  <div className="client-meta-row">
                    <Building2 size={16} className="meta-icon" />
                    <span>{client.company}</span>
                  </div>
                )}
                <div className="client-meta-row">
                  <Mail size={16} className="meta-icon" />
                  <span>{client.email}</span>
                </div>
                {client.phone && (
                  <div className="client-meta-row">
                    <Phone size={16} className="meta-icon" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.website && (
                  <div className="client-meta-row">
                    <Globe size={16} className="meta-icon" />
                    <span className="website-link">{client.website}</span>
                  </div>
                )}

                {/* Edit & Delete Action Row (Icons) */}
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
                >
                  <button
                    className="icon-btn text-blue"
                    title="Edit Profile"
                    onClick={(e) => handleEditClick(e, client)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-btn text-danger"
                    title="Delete Profile"
                    onClick={(e) => handleDeleteTrigger(e, client)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
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
          <Building2 size={48} style={{ opacity: 0.3 }} />
          <h3 className="card-title">No Clients Logged</h3>
          <p className="card-subtitle">
            Log your first client to start allocating project tasks and
            invoices.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setModalOpen(true)}
          >
            + Add Client
          </button>
        </div>
      )}

      {/* Add/Edit Client Dialog Modal */}
      {modalOpen && (
        <div className="modal-backdrop flex-center">
          <div className="modal-content card show">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingClient ? "Edit Client Profile" : "New Client Profile"}
              </h3>
              <button className="icon-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="modal-form">
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Client/Contact Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Acme Corp Representative"
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
                    placeholder="e.g. Acme Corp"
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
                    placeholder="client@acme.com"
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
                    placeholder="+1 (555) 000-0000"
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
                    placeholder="123 Main St"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="United States"
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
                  placeholder="www.acme.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-input"
                  placeholder="Specific notes, tax GST registration details, currency preferences..."
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
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingClient ? "Save Changes" : "Create Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Card */}
      {deleteConfirmTarget && (
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
                <strong>{deleteConfirmTarget.name}</strong>? This action will
                remove all associated project data and cannot be undone.
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

export default Clients;
