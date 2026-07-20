import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  BarChart3,
  FileSpreadsheet,
  FolderKanban,
  DollarSign,
  Clock,
} from "lucide-react";
import "./Reports.css";

const Reports = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN";

  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [clientRows, setClientRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Client stats calculations
  const totalClientProjects = projects.length;
  const completedClientProjects = projects.filter(
    (p) => p.status === "COMPLETED",
  ).length;
  const totalClientBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalClientPaid = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalClientPending = totalClientBudget - totalClientPaid;

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        if (isAdmin) {
          const [projectsRes, invoicesRes, paymentsRes, clientsRes] =
            await Promise.all([
              api.get("/projects"),
              api.get("/invoices"),
              api.get("/payments"),
              api.get("/clients", { params: { size: 100 } }),
            ]);

          setProjects(projectsRes.data);
          setInvoices(invoicesRes.data);
          setPayments(paymentsRes.data);

          // Compile client performance metrics
          const clients = clientsRes.data.content;
          const rows = clients.map((c) => {
            const clientProjects = projectsRes.data.filter(
              (p) => p.clientId === c.id,
            );
            const clientPayments = paymentsRes.data.filter(
              (p) => p.clientId === c.id && p.status === "COMPLETED",
            );
            const revenue = clientPayments.reduce(
              (sum, p) => sum + p.amount,
              0,
            );

            return {
              clientName: c.name,
              projectsCount: clientProjects.length,
              revenue,
              status: c.status,
            };
          });
          setClientRows(rows);
        } else {
          const [projectsRes, invoicesRes, paymentsRes] = await Promise.all([
            api.get("/projects"),
            api.get("/invoices"),
            api.get("/payments"),
          ]);

          setProjects(projectsRes.data);
          setInvoices(invoicesRes.data);
          setPayments(paymentsRes.data);
        }
      } catch (err) {
        // Handle silently
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [currentUser]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(val);
  };

  const handleExportCSV = () => {
    if (isAdmin) {
      if (clientRows.length === 0) return;
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent +=
        "Client Name,Projects Allocated,Total Revenue Earned,CRM Status\r\n";

      clientRows.forEach((row) => {
        csvContent += `"${row.clientName}",${row.projectsCount},${row.revenue},"${row.status}"\r\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `FreelanceOS_Client_Report_${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      if (projects.length === 0) return;

      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent +=
        "Project Name,Category,Status,Progress (%),Total Budget,Amount Paid,Deadline\r\n";

      projects.forEach((p) => {
        csvContent += `"${p.name}","${p.category || "Unassigned"}","${p.status}",${p.progress},${p.budget},${p.amountPaid || 0},"${p.deadline || "No Deadline"}"\r\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `My_Projects_Report_${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="reports-page page-container">
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
            <BarChart3 className="text-blue" size={32} />
            {isAdmin
              ? "Financial & Client Reports"
              : "My Project & Financial Report"}
          </h1>
          <p className="dashboard-subtitle">
            {isAdmin
              ? "Export CSV/Excel metrics of revenue, client performance, and project counts."
              : "Export and review a comprehensive breakdown of your active project progress, invoices, and payments."}
          </p>
        </div>
      </div>

      {/* Client Specific KPI Cards */}
      {!isAdmin && !loading && (
        <div className="grid-3" style={{ marginBottom: "var(--spacing-lg)" }}>
          <div
            className="card"
            style={{
              padding: "20px",
              display: "flex",
              gap: "16px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                background: "var(--color-primary-bg)",
                color: "var(--color-primary)",
                padding: "12px",
                borderRadius: "50%",
              }}
            >
              <FolderKanban size={24} />
            </div>
            <div>
              <p className="text-xs text-muted" style={{ fontWeight: 600 }}>
                TOTAL PROJECT WORKSPACES
              </p>
              <h3 style={{ fontSize: "20px", fontWeight: 800 }}>
                {totalClientProjects}
              </h3>
              <p className="text-xs text-muted">
                {completedClientProjects} Completed
              </p>
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: "20px",
              display: "flex",
              gap: "16px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                background: "var(--color-success-bg)",
                color: "var(--color-success)",
                padding: "12px",
                borderRadius: "50%",
              }}
            >
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-xs text-muted" style={{ fontWeight: 600 }}>
                TOTAL COMPLETED PAYMENTS
              </p>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "var(--color-success)",
                }}
              >
                {formatCurrency(totalClientPaid)}
              </h3>
              <p className="text-xs text-muted">
                Out of {formatCurrency(totalClientBudget)} Budget
              </p>
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: "20px",
              display: "flex",
              gap: "16px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                background: "var(--color-warning-bg)",
                color: "var(--color-warning)",
                padding: "12px",
                borderRadius: "50%",
              }}
            >
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs text-muted" style={{ fontWeight: 600 }}>
                OUTSTANDING BALANCE
              </p>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "var(--color-warning)",
                }}
              >
                {formatCurrency(totalClientPending)}
              </h3>
              <p className="text-xs text-muted">Remaining pending release</p>
            </div>
          </div>
        </div>
      )}

      {/* Export action card */}
      <div
        className="card export-actions-card"
        style={{ marginBottom: "var(--spacing-lg)" }}
      >
        <h3 className="card-title" style={{ fontSize: "var(--font-size-md)" }}>
          Download Report
        </h3>
        <p
          className="card-subtitle"
          style={{ marginBottom: "var(--spacing-md)" }}
        >
          Export your database summaries as a CSV spreadsheet.
        </p>
        <div style={{ display: "flex", gap: "var(--spacing-md)" }}>
          <button
            className="btn btn-primary flex-center"
            style={{ gap: "6px" }}
            onClick={handleExportCSV}
          >
            <FileSpreadsheet size={18} />
            {isAdmin
              ? "Export Client Performance Index (CSV)"
              : "Export My Project Logs (CSV)"}
          </button>
        </div>
      </div>

      {/* Tables layout */}
      {loading ? (
        <div className="skeleton" style={{ height: "300px" }}></div>
      ) : isAdmin ? (
        /* Admin Client Index Table */
        <div className="card">
          <div
            className="flex-center"
            style={{
              justifyContent: "space-between",
              marginBottom: "var(--spacing-lg)",
            }}
          >
            <h3
              className="card-title"
              style={{ fontSize: "var(--font-size-md)" }}
            >
              Client Performance Index
            </h3>
            <span className="badge badge-success">ACTIVE CRM</span>
          </div>

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
                <th>Client Name</th>
                <th>Projects Managed</th>
                <th>CRM Status</th>
                <th>Total Invoiced</th>
              </tr>
            </thead>
            <tbody>
              {clientRows.map((row, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: "1px solid var(--color-border-light)",
                    height: "52px",
                  }}
                >
                  <td className="font-semibold">{row.clientName}</td>
                  <td>{row.projectsCount}</td>
                  <td>
                    <span
                      className={`badge ${row.status === "ACTIVE" ? "badge-success" : "badge-neutral"}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="font-semibold text-green">
                    {formatCurrency(row.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Client Workspace Project Table */
        <div className="card">
          <div
            className="flex-center"
            style={{
              justifyContent: "space-between",
              marginBottom: "var(--spacing-lg)",
            }}
          >
            <h3
              className="card-title"
              style={{ fontSize: "var(--font-size-md)" }}
            >
              Allocated Workspace Projects
            </h3>
            <span className="badge badge-info">WORKSPACE SUMMARY</span>
          </div>

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
                <th>Project Name</th>
                <th>Status</th>
                <th>Sprint Progress</th>
                <th>Total Budget</th>
                <th>Paid So Far</th>
                <th>Target Deadline</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: "1px solid var(--color-border-light)",
                    height: "52px",
                  }}
                >
                  <td className="font-semibold">{p.name}</td>
                  <td>
                    <span
                      className={`badge ${p.status === "COMPLETED" ? "badge-success" : p.status === "IN_PROGRESS" ? "badge-info" : "badge-neutral"}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          background: "var(--color-surface-2)",
                          width: "60px",
                          height: "6px",
                          borderRadius: "3px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            background: "var(--color-primary)",
                            width: `${p.progress}%`,
                            height: "100%",
                          }}
                        ></div>
                      </div>
                      <span className="text-xs" style={{ fontWeight: 600 }}>
                        {p.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="font-semibold">{formatCurrency(p.budget)}</td>
                  <td className="font-semibold text-green">
                    {formatCurrency(p.amountPaid || 0)}
                  </td>
                  <td>{p.deadline || "No Deadline"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Reports;
