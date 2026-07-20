import React, { useState, useEffect } from "react";
import api from "../../services/api";
import {
  DollarSign,
  Plus,
  X,
  Trash2,
  Pencil,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./Payments.css";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  // Modal controllers
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null);

  // Form states
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [status, setStatus] = useState("COMPLETED");
  const [transactionId, setTransactionId] = useState("");
  const [notes, setNotes] = useState("");

  const fetchPaymentsData = async () => {
    setLoading(true);
    try {
      const [payRes, clientRes, projectRes, invoiceRes] = await Promise.all([
        api.get("/payments"),
        api.get("/clients", { params: { size: 100 } }),
        api.get("/projects"),
        api.get("/invoices"),
      ]);
      setPayments(payRes.data);
      setClients(clientRes.data.content);
      setProjects(projectRes.data);
      setInvoices(invoiceRes.data);
    } catch (err) {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsData();
  }, []);

  const handleEditClick = (pay) => {
    setEditingPayment(pay);
    setClientId(pay.clientId.toString());
    setProjectId(pay.projectId.toString());
    setInvoiceId(pay.invoiceId ? pay.invoiceId.toString() : "");
    setAmount(pay.amount.toString());
    setPaymentDate(pay.paymentDate);
    setPaymentMethod(pay.paymentMethod);
    setStatus(pay.status);
    setTransactionId(pay.transactionId || "");
    setNotes(pay.notes || "");
    setModalOpen(true);
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (!clientId || !projectId) {
      alert("Please select client and project");
      return;
    }

    const payload = {
      clientId: Number(clientId),
      projectId: Number(projectId),
      invoiceId: invoiceId ? Number(invoiceId) : null,
      amount: Number(amount),
      paymentDate,
      paymentMethod,
      status,
      transactionId,
      notes,
    };

    try {
      if (editingPayment) {
        await api.put(`/payments/${editingPayment.id}`, payload);
      } else {
        await api.post("/payments", payload);
      }

      closeModal();
      fetchPaymentsData();
    } catch (err) {
      alert(
        `Failed to ${editingPayment ? "update" : "log"} payment transaction`,
      );
    }
  };

  const executeDeletePayment = async () => {
    if (!deleteConfirmTarget) return;
    try {
      await api.delete(`/payments/${deleteConfirmTarget.id}`);
      setDeleteConfirmTarget(null);
      fetchPaymentsData();
    } catch (err) {
      alert("Failed to delete payment");
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPayment(null);
    setClientId("");
    setProjectId("");
    setInvoiceId("");
    setAmount("");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentMethod("BANK_TRANSFER");
    setStatus("COMPLETED");
    setTransactionId("");
    setNotes("");
  };

  const getMethodBadge = (m) => {
    switch (m) {
      case "UPI":
        return "badge-success";
      case "STRIPE":
        return "badge-info";
      case "PAYPAL":
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

  const getMonthlyTimeline = () => {
    const monthlySum = {};
    payments.forEach((p) => {
      if (p.status === "COMPLETED") {
        const month = p.paymentDate.substring(0, 7); // YYYY-MM
        monthlySum[month] = (monthlySum[month] || 0) + p.amount;
      }
    });

    return Object.keys(monthlySum)
      .sort()
      .map((month) => ({
        month,
        revenue: monthlySum[month],
      }));
  };

  return (
    <div className="payments-page page-container">
      {/* Header */}
      <div
        className="dashboard-header"
        style={{ marginBottom: "var(--spacing-lg)" }}
      >
        <div>
          <h1 className="dashboard-title">Transactions Ledger</h1>
          <p className="dashboard-subtitle">
            Record payments, monitor remaining balances, and review monthly cash
            flow.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Log Payment
        </button>
      </div>

      {/* Analytics Chart */}
      <div className="grid-3" style={{ marginBottom: "var(--spacing-lg)" }}>
        <div className="card chart-card" style={{ gridColumn: "span 2" }}>
          <h3
            className="card-title"
            style={{ fontSize: "var(--font-size-md)" }}
          >
            Cash Flow Trend
          </h3>
          <div
            className="chart-wrapper"
            style={{ marginTop: "var(--spacing-md)" }}
          >
            {payments.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={getMonthlyTimeline()}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border-light)"
                  />
                  <XAxis
                    dataKey="month"
                    stroke="var(--color-text-secondary)"
                    fontSize={11}
                  />
                  <YAxis stroke="var(--color-text-secondary)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-surface)",
                      borderColor: "var(--color-border)",
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="var(--color-primary)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p
                className="text-sm text-muted text-center"
                style={{ width: "100%" }}
              >
                No income timeline logged yet
              </p>
            )}
          </div>
        </div>

        {/* Dynamic balance counts */}
        <div
          className="card flex-center"
          style={{
            flexDirection: "column",
            gap: "var(--spacing-md)",
            justifyContent: "center",
          }}
        >
          <DollarSign size={40} className="text-green" />
          <div className="text-center">
            <h3 className="card-title">Completed Volume</h3>
            <p
              className="kpi-value"
              style={{ margin: "6px 0 0 0", fontSize: "var(--font-size-2xl)" }}
            >
              {formatCurrency(
                payments
                  .filter((p) => p.status === "COMPLETED")
                  .reduce((sum, p) => sum + p.amount, 0),
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Payments List table */}
      {loading ? (
        <div className="skeleton" style={{ height: "300px" }}></div>
      ) : payments.length > 0 ? (
        <div className="card">
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
                <th>Client</th>
                <th>Project</th>
                <th>Method</th>
                <th>Transaction ID</th>
                <th>Remaining Balance</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((pay) => (
                <tr
                  key={pay.id}
                  style={{
                    borderBottom: "1px solid var(--color-border-light)",
                    height: "48px",
                  }}
                >
                  <td>{pay.paymentDate}</td>
                  <td className="font-semibold">{pay.clientName}</td>
                  <td>{pay.projectName}</td>
                  <td>
                    <span
                      className={`badge ${getMethodBadge(pay.paymentMethod)}`}
                    >
                      {pay.paymentMethod}
                    </span>
                  </td>
                  <td className="text-sm text-muted">
                    {pay.transactionId || "N/A"}
                  </td>
                  <td>{formatCurrency(pay.remainingBalance)}</td>
                  <td className="font-semibold text-green">
                    {formatCurrency(pay.amount)}
                  </td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        alignItems: "center",
                      }}
                    >
                      <button
                        className="icon-btn text-blue"
                        title="Edit Payment"
                        onClick={() => handleEditClick(pay)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-btn text-danger"
                        title="Delete Payment"
                        onClick={() => setDeleteConfirmTarget(pay)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          <DollarSign size={48} style={{ opacity: 0.3 }} />
          <h3 className="card-title">No Payments Logged</h3>
          <p className="card-subtitle">
            Log client payouts here to keep your income statement balanced.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setModalOpen(true)}
          >
            + Log Payment
          </button>
        </div>
      )}

      {/* Log/Edit Payment Modal */}
      {modalOpen && (
        <div className="modal-backdrop flex-center">
          <div
            className="modal-content card show"
            style={{ maxWidth: "520px" }}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                {editingPayment
                  ? "Edit Payment Details"
                  : "Log Received Payment"}
              </h3>
              <button className="icon-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="modal-form">
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Client</label>
                  <select
                    className="form-input form-select"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                  >
                    <option value="">-- Client --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Project Workspace</label>
                  <select
                    className="form-input form-select"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    required
                  >
                    <option value="">-- Project --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">
                    Related Invoice (optional)
                  </label>
                  <select
                    className="form-input form-select"
                    value={invoiceId}
                    onChange={(e) => setInvoiceId(e.target.value)}
                  >
                    <option value="">-- None --</option>
                    {invoices
                      .filter((inv) => inv.clientId === Number(clientId))
                      .map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.invoiceNumber} ({formatCurrency(inv.totalAmount)}
                          )
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Transfer Method</label>
                  <select
                    className="form-input form-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="BANK_TRANSFER">Bank Wire</option>
                    <option value="UPI">UPI / Net Banking</option>
                    <option value="STRIPE">Stripe Gateway</option>
                    <option value="PAYPAL">PayPal Transfer</option>
                    <option value="CASH">Cash Payment</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Payout Amount (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 1500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Transaction ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Txn-9988..."
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ledger Status</label>
                  <select
                    className="form-input form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="COMPLETED">Completed</option>
                    <option value="PENDING">Pending Approval</option>
                    <option value="FAILED">Failed / Refunded</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes / Remarks</label>
                <textarea
                  className="form-input"
                  placeholder="Add additional remittance notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPayment ? "Save Changes" : "Log Ledger Payout"}
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
                Are you sure you want to permanently delete payment record of{" "}
                <strong>{formatCurrency(deleteConfirmTarget.amount)}</strong>?
                This action will adjust project volumes and cannot be undone.
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
                  onClick={executeDeletePayment}
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

export default Payments;
