import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  Plus,
  Printer,
  X,
  Trash2,
  Pencil,
  AlertTriangle,
  Receipt,
  CreditCard,
  Lock,
  CheckCircle,
} from "lucide-react";
import "./Invoices.css";

const Invoices = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN";

  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null);

  // Stripe Checkout States
  const [checkoutInvoice, setCheckoutInvoice] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [cardNo, setCardNo] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");

  // Form states
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [taxRate, setTaxRate] = useState("18");
  // Dynamic line items list
  const [lineItems, setLineItems] = useState([
    { description: "Development Services", quantity: 1, unitPrice: 1000 },
  ]);

  const fetchInvoiceData = async () => {
    setLoading(true);
    try {
      const [invRes, clientRes, projectRes] = await Promise.all([
        api.get("/invoices"),
        api.get("/clients", { params: { size: 100 } }),
        api.get("/projects"),
      ]);
      setInvoices(invRes.data);
      setClients(clientRes.data.content);
      setProjects(projectRes.data);
    } catch (err) {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceData();
  }, []);

  const handleEditClick = (inv) => {
    setEditingInvoice(inv);
    setClientId(inv.clientId.toString());
    setProjectId(inv.projectId.toString());
    setDueDate(inv.dueDate || "");
    setNotes(inv.notes || "");
    setTerms(inv.terms || "");
    setLineItems(
      inv.lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    );
    const rate =
      inv.amount > 0
        ? Math.round((inv.gst / inv.amount) * 100).toString()
        : "18";
    setTaxRate(rate);
    setCreateModalOpen(true);
  };

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  const handleRemoveLineItem = (idx) => {
    setLineItems(lineItems.filter((_, i) => i !== idx));
  };

  const handleLineItemChange = (idx, field, val) => {
    setLineItems(
      lineItems.map((item, i) => {
        if (i === idx) {
          return { ...item, [field]: val };
        }
        return item;
      }),
    );
  };

  const handleSaveInvoice = async (e) => {
    e.preventDefault();
    if (!clientId || !projectId) {
      alert("Please select client and project");
      return;
    }

    const itemsWithTotals = lineItems.map((item) => ({
      ...item,
      total: item.quantity * item.unitPrice,
    }));

    const amount = itemsWithTotals.reduce((sum, item) => sum + item.total, 0);
    const gst = amount * (Number(taxRate) / 100);
    const totalAmount = amount + gst;

    const payload = {
      clientId: Number(clientId),
      projectId: Number(projectId),
      amount,
      gst,
      discount: 0,
      totalAmount,
      dueDate,
      issueDate: editingInvoice
        ? editingInvoice.issueDate
        : new Date().toISOString().split("T")[0],
      notes,
      terms,
      lineItems: itemsWithTotals,
    };

    try {
      if (editingInvoice) {
        await api.put(`/invoices/${editingInvoice.id}`, payload);
      } else {
        await api.post("/invoices", payload);
      }

      closeModal();
      fetchInvoiceData();
    } catch (err) {
      alert(`Failed to ${editingInvoice ? "update" : "generate"} invoice`);
    }
  };

  const handleMarkAsPaid = async (invoiceId) => {
    try {
      const res = await api.patch(`/invoices/${invoiceId}/mark-paid`);
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === invoiceId ? res.data : inv)),
      );
      if (previewInvoice && previewInvoice.id === invoiceId) {
        setPreviewInvoice(res.data);
      }
    } catch (err) {
      alert("Failed to record payment");
    }
  };

  const executeDeleteInvoice = async () => {
    if (!deleteConfirmTarget) return;
    try {
      await api.delete(`/invoices/${deleteConfirmTarget.id}`);
      setDeleteConfirmTarget(null);
      fetchInvoiceData();
    } catch (err) {
      alert("Failed to delete invoice");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const closeModal = () => {
    setCreateModalOpen(false);
    setEditingInvoice(null);
    setClientId("");
    setProjectId("");
    setDueDate("");
    setNotes("");
    setTerms("");
    setTaxRate("18");
    setLineItems([
      { description: "Development Services", quantity: 1, unitPrice: 1000 },
    ]);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(val);
  };

  return (
    <div className="invoices-page page-container">
      {/* Header */}
      <div
        className="dashboard-header"
        style={{ marginBottom: "var(--spacing-lg)" }}
      >
        <div>
          <h1 className="dashboard-title">Billing Ledger</h1>
          <p className="dashboard-subtitle">
            Generate client bills, verify paid markers, and print PDFs.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setCreateModalOpen(true)}
        >
          <Plus size={16} /> Create Invoice
        </button>
      </div>

      {/* Invoice Grid table */}
      {loading ? (
        <div className="skeleton" style={{ height: "300px" }}></div>
      ) : invoices.length > 0 ? (
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
                <th>Invoice #</th>
                <th>Client</th>
                <th>Project</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Total Bill</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  style={{
                    borderBottom: "1px solid var(--color-border-light)",
                    height: "52px",
                  }}
                >
                  <td
                    className="font-semibold text-blue"
                    onClick={() => setPreviewInvoice(inv)}
                    style={{ cursor: "pointer" }}
                  >
                    {inv.invoiceNumber}
                  </td>
                  <td>{inv.clientName}</td>
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
                  <td>
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        alignItems: "center",
                      }}
                    >
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "6px 10px" }}
                        onClick={() => setPreviewInvoice(inv)}
                      >
                        Preview
                      </button>
                      {inv.status !== "PAID" &&
                        (isAdmin ? (
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ padding: "6px 10px" }}
                            onClick={() => handleMarkAsPaid(inv.id)}
                          >
                            Mark Paid
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm flex-center"
                            style={{ padding: "6px 10px", gap: "4px" }}
                            onClick={() => setCheckoutInvoice(inv)}
                          >
                            <CreditCard size={14} /> Pay Now
                          </button>
                        ))}

                      {isAdmin && (
                        <>
                          <button
                            className="icon-btn text-blue"
                            title="Edit Invoice"
                            onClick={() => handleEditClick(inv)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="icon-btn text-danger"
                            title="Delete Invoice"
                            onClick={() => setDeleteConfirmTarget(inv)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
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
          <Receipt size={48} style={{ opacity: 0.3 }} />
          <h3 className="card-title">No Invoices Drafted</h3>
          <p className="card-subtitle">
            Generate your first invoice proposal and bill details.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setCreateModalOpen(true)}
          >
            + Create Invoice
          </button>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {previewInvoice && (
        <div className="modal-backdrop flex-center print-overlay">
          <div
            className="modal-content card show invoice-preview-box"
            style={{ maxWidth: "780px" }}
          >
            <div className="modal-header print-hide">
              <h3 className="modal-title">Invoice Preview</h3>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className="btn btn-secondary btn-sm flex-center"
                  onClick={handlePrint}
                  style={{ gap: "6px" }}
                >
                  <Printer size={16} /> Print/PDF
                </button>
                {previewInvoice.status !== "PAID" &&
                  (isAdmin ? (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleMarkAsPaid(previewInvoice.id)}
                    >
                      Mark Paid
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm flex-center"
                      style={{ gap: "4px" }}
                      onClick={() => {
                        setPreviewInvoice(null);
                        setCheckoutInvoice(previewInvoice);
                      }}
                    >
                      <CreditCard size={14} /> Pay Now
                    </button>
                  ))}
                <button
                  className="icon-btn"
                  onClick={() => setPreviewInvoice(null)}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="invoice-print-area">
              <div className="invoice-print-header">
                <div>
                  <h1 className="print-brand-title">FreelanceOS Invoice</h1>
                  <p className="print-brand-no">
                    # {previewInvoice.invoiceNumber}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span
                    className={`badge ${previewInvoice.status === "PAID" ? "badge-success" : "badge-neutral"}`}
                  >
                    {previewInvoice.status}
                  </span>
                </div>
              </div>

              <div className="divider"></div>

              <div className="print-billing-block">
                <div>
                  <p className="print-block-title">Billed To:</p>
                  <p className="print-bold">{previewInvoice.clientName}</p>
                  <p className="text-sm text-muted">
                    Client Account ID: #{previewInvoice.clientId}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p className="print-block-title">Payment Info:</p>
                  <p className="text-sm">
                    Due Date:{" "}
                    <strong>{previewInvoice.dueDate || "Upon receipt"}</strong>
                  </p>
                  <p className="text-sm">
                    Issue Date: {previewInvoice.issueDate || "Today"}
                  </p>
                </div>
              </div>

              <table
                className="print-items-table"
                style={{
                  width: "100%",
                  marginTop: "30px",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid var(--color-border)",
                      height: "40px",
                    }}
                  >
                    <th style={{ textAlign: "left" }}>Description</th>
                    <th style={{ textAlign: "center" }}>Qty</th>
                    <th style={{ textAlign: "right" }}>Unit Price</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {previewInvoice.lineItems?.map((item, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: "1px solid var(--color-border-light)",
                        height: "48px",
                      }}
                    >
                      <td>{item.description}</td>
                      <td style={{ textAlign: "center" }}>{item.quantity}</td>
                      <td style={{ textAlign: "right" }}>
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div
                className="print-totals-box"
                style={{
                  marginLeft: "auto",
                  width: "280px",
                  marginTop: "30px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div
                  className="flex-center"
                  style={{ justifyContent: "space-between" }}
                >
                  <span className="text-sm">Subtotal:</span>
                  <span className="font-semibold">
                    {formatCurrency(previewInvoice.amount)}
                  </span>
                </div>
                <div
                  className="flex-center"
                  style={{ justifyContent: "space-between" }}
                >
                  <span className="text-sm">
                    Tax (
                    {previewInvoice.amount > 0
                      ? Math.round(
                          (previewInvoice.gst / previewInvoice.amount) * 100,
                        )
                      : 18}
                    %):
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(previewInvoice.gst)}
                  </span>
                </div>
                <div className="divider" style={{ margin: "4px 0" }}></div>
                <div
                  className="flex-center"
                  style={{
                    justifyContent: "space-between",
                    fontSize: "var(--font-size-md)",
                  }}
                >
                  <span className="font-bold">Total Bill:</span>
                  <span className="font-bold text-blue">
                    {formatCurrency(previewInvoice.totalAmount)}
                  </span>
                </div>
              </div>

              {previewInvoice.notes && (
                <div
                  className="print-notes-section"
                  style={{ marginTop: "40px" }}
                >
                  <p className="print-block-title">Invoice Notes:</p>
                  <p
                    className="text-xs text-muted"
                    style={{ whiteSpace: "pre-line" }}
                  >
                    {previewInvoice.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Invoice Modal */}
      {createModalOpen && (
        <div className="modal-backdrop flex-center">
          <div
            className="modal-content card show"
            style={{ maxWidth: "640px" }}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                {editingInvoice ? "Edit Invoice Details" : "Generate Invoice"}
              </h3>
              <button className="icon-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="modal-form">
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Select Client</label>
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
                  <label className="form-label">Payment Due Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tax Rate (%)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={taxRate}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      setTaxRate(val);
                    }}
                    required
                  />
                </div>
              </div>

              {/* Line items checklist */}
              <div className="line-items-form-section">
                <div
                  className="flex-center"
                  style={{
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <label className="form-label" style={{ margin: 0 }}>
                    Billing Items Details
                  </label>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleAddLineItem}
                  >
                    + Add Line
                  </button>
                </div>

                {lineItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="line-item-row"
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginBottom: "8px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="text"
                      className="form-input"
                      style={{ flex: 2 }}
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) =>
                        handleLineItemChange(idx, "description", e.target.value)
                      }
                      required
                    />

                    <input
                      type="text"
                      className="form-input"
                      style={{ width: "70px" }}
                      placeholder="Qty"
                      value={item.quantity === 0 ? "" : item.quantity}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        handleLineItemChange(
                          idx,
                          "quantity",
                          val === "" ? 0 : Number(val),
                        );
                      }}
                      required
                    />

                    <input
                      type="text"
                      className="form-input"
                      style={{ width: "100px" }}
                      placeholder="Price"
                      value={item.unitPrice === 0 ? "" : item.unitPrice}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        handleLineItemChange(
                          idx,
                          "unitPrice",
                          val === "" ? 0 : Number(val),
                        );
                      }}
                      required
                    />

                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        className="icon-btn text-danger"
                        onClick={() => handleRemoveLineItem(idx)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Client Notes & Payment Terms
                </label>
                <textarea
                  className="form-input"
                  placeholder="e.g. Wire transfer info: Account 12345..."
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
                  {editingInvoice ? "Save Changes" : "Generate Invoice"}
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
                Are you sure you want to permanently delete invoice{" "}
                <strong>{deleteConfirmTarget.invoiceNumber}</strong>? This
                action will adjust ledger records and cannot be undone.
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
                  onClick={executeDeleteInvoice}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Stripe Mock Checkout Modal Card */}
      {checkoutInvoice && (
        <div className="modal-backdrop flex-center" style={{ zIndex: 350 }}>
          <div
            className="modal-content card show"
            style={{ maxWidth: "440px", padding: "var(--spacing-lg)" }}
          >
            <div
              className="modal-header"
              style={{ marginBottom: "var(--spacing-md)" }}
            >
              <h3
                className="modal-title flex-center"
                style={{ gap: "6px", justifyContent: "flex-start" }}
              >
                <Lock size={18} className="text-blue" /> Secure Checkout
              </h3>
              <button
                className="icon-btn"
                onClick={() => setCheckoutInvoice(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div
                style={{
                  background: "var(--color-surface-2)",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <p className="text-xs text-muted" style={{ fontWeight: 600 }}>
                    Billing: {checkoutInvoice.invoiceNumber}
                  </p>
                  <p className="text-sm font-semibold">
                    {checkoutInvoice.projectName}
                  </p>
                </div>
                <h3 style={{ fontWeight: 800, color: "var(--color-text)" }}>
                  {formatCurrency(checkoutInvoice.totalAmount)}
                </h3>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setProcessingPayment(true);
                  try {
                    await api.post("/payments", {
                      amount: checkoutInvoice.totalAmount,
                      paymentDate: new Date().toISOString().split("T")[0],
                      paymentMethod: "STRIPE",
                      status: "COMPLETED",
                      transactionId:
                        "TXN-" +
                        Math.random()
                          .toString(36)
                          .substring(2, 9)
                          .toUpperCase(),
                      notes: `Paid online via Client Portal (Ref: ${checkoutInvoice.invoiceNumber})`,
                      projectId: checkoutInvoice.projectId,
                      clientId: checkoutInvoice.clientId,
                      invoiceId: checkoutInvoice.id,
                    });
                    setCheckoutInvoice(null);
                    setCardNo("");
                    setCardExpiry("");
                    setCardCvc("");
                    setCardName("");
                    fetchInvoiceData();
                  } catch (err) {
                    alert("Payment processing failed");
                  } finally {
                    setProcessingPayment(false);
                  }
                }}
                className="modal-form"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--spacing-md)",
                }}
              >
                <div className="form-group">
                  <label className="form-label">Cardholder Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="John Doe"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Credit Card Number</label>
                  <div className="input-with-icon">
                    <CreditCard className="input-icon" size={18} />
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: "42px" }}
                      placeholder="4111 2222 3333 4444"
                      value={cardNo}
                      onChange={(e) => setCardNo(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Expiration Date</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CVC / CVV</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="•••"
                      maxLength={4}
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "11px",
                    color: "var(--color-text-secondary)",
                    background: "var(--color-success-bg)",
                    padding: "10px",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  <CheckCircle size={16} className="text-success" />
                  <span>Payments are processed securely via mock SSL.</span>
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
                    onClick={() => setCheckoutInvoice(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={processingPayment}
                  >
                    {processingPayment
                      ? "Processing..."
                      : `Pay ${formatCurrency(checkoutInvoice.totalAmount)}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
