import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  Users,
  FolderKanban,
  CreditCard,
  Landmark,
  AlertCircle,
  ShieldCheck,
  ArrowUpRight,
  Plus,
  Clock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, chartsRes] = await Promise.all([
          api.get("/dashboard/stats"),
          api.get("/dashboard/charts"),
        ]);
        setStats(statsRes.data);
        setChartData(chartsRes.data);
      } catch (err) {
        // Handle error silently
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(val);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "IN_PROGRESS":
        return "#8b5cf6";
      case "COMPLETED":
        return "#10b981";
      case "PLANNING":
        return "#3b82f6";
      case "ON_HOLD":
        return "#f59e0b";
      default:
        return "#64748b";
    }
  };

  const COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444"];

  const quickActions = [
    { label: "Create Invoice", path: "/invoices", icon: Plus },
    { label: "Add Client", path: "/clients", icon: Users },
    { label: "Setup Project", path: "/projects", icon: FolderKanban },
    { label: "Estimate Project", path: "/ai-estimator", icon: Clock },
  ];

  if (loading) {
    return (
      <div className="dashboard-grid-loading page-container">
        <div
          className="skeleton-title skeleton"
          style={{
            width: "240px",
            height: "36px",
            marginBottom: "var(--spacing-xl)",
          }}
        ></div>
        <div className="grid-3" style={{ marginBottom: "var(--spacing-xl)" }}>
          <div
            className="skeleton"
            style={{ height: "140px", borderRadius: "var(--radius-lg)" }}
          ></div>
          <div
            className="skeleton"
            style={{ height: "140px", borderRadius: "var(--radius-lg)" }}
          ></div>
          <div
            className="skeleton"
            style={{ height: "140px", borderRadius: "var(--radius-lg)" }}
          ></div>
        </div>
        <div className="grid-2">
          <div
            className="skeleton"
            style={{ height: "300px", borderRadius: "var(--radius-lg)" }}
          ></div>
          <div
            className="skeleton"
            style={{ height: "300px", borderRadius: "var(--radius-lg)" }}
          ></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page page-container">
      {/* Welcome Banner */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Freelance Workspace</h1>
          <p className="dashboard-subtitle">
            Here is what is happening with your business today.
          </p>
        </div>
        <div className="dashboard-header-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate("/ai-estimator")}
          >
            <Plus size={16} /> Run Project AI Estimate
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-4 kpi-grid">
        <div className="card kpi-card border-blue">
          <div className="kpi-card-header">
            <Users size={20} className="kpi-icon text-blue" />
            <span className="kpi-trend trend-up">+12%</span>
          </div>
          <p className="kpi-value">{stats?.totalClients || 0}</p>
          <h3 className="kpi-title">Total Clients</h3>
        </div>

        <div className="card kpi-card border-purple">
          <div className="kpi-card-header">
            <FolderKanban size={20} className="kpi-icon text-purple" />
            <span className="kpi-trend trend-up">+2</span>
          </div>
          <p className="kpi-value">{stats?.activeProjects || 0}</p>
          <h3 className="kpi-title">Active Projects</h3>
        </div>

        <div className="card kpi-card border-orange">
          <div className="kpi-card-header">
            <CreditCard size={20} className="kpi-icon text-orange" />
            <span className="kpi-trend trend-neutral">0%</span>
          </div>
          <p className="kpi-value">
            {formatCurrency(stats?.pendingPayments || 0)}
          </p>
          <h3 className="kpi-title">Pending Invoices</h3>
        </div>

        <div className="card kpi-card border-green">
          <div className="kpi-card-header">
            <Landmark size={20} className="kpi-icon text-green" />
            <span className="kpi-trend trend-up">+24%</span>
          </div>
          <p className="kpi-value">
            {formatCurrency(stats?.monthlyRevenue || 0)}
          </p>
          <h3 className="kpi-title">Total Earnings</h3>
        </div>
      </div>

      {/* Charts Panel */}
      <div className="dashboard-charts-row">
        {/* Monthly earnings chart */}
        <div className="card chart-card revenue-chart">
          <div className="card-header">
            <h2 className="card-title">Earnings Timeline</h2>
            <p className="card-subtitle">
              Completed payments over the past 6 months
            </p>
          </div>
          <div className="chart-wrapper">
            {chartData?.monthlyRevenue && (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart
                  data={chartData.monthlyRevenue}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--color-primary)"
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-primary)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border-light)"
                  />
                  <XAxis
                    dataKey="month"
                    stroke="var(--color-text-secondary)"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="var(--color-text-secondary)"
                    fontSize={12}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-surface)",
                      borderColor: "var(--color-border)",
                      borderRadius: "var(--radius-md)",
                    }}
                    labelStyle={{ color: "var(--color-text)", fontWeight: 600 }}
                  />

                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Project statuses ratio */}
        <div className="card chart-card status-chart">
          <div className="card-header">
            <h2 className="card-title">Project Ratios</h2>
            <p className="card-subtitle">Projects distribution by status</p>
          </div>
          <div className="chart-wrapper flex-center">
            {chartData?.projectStatus &&
            chartData.projectStatus.some((item) => item.value > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={chartData.projectStatus.filter(
                      (item) => item.value > 0,
                    )}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.projectStatus.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-surface)",
                      borderColor: "var(--color-border)",
                      borderRadius: "var(--radius-md)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div
                className="text-center text-muted"
                style={{ padding: "40px 0" }}
              >
                <FolderKanban
                  size={32}
                  style={{ marginBottom: "8px", opacity: 0.5 }}
                />
                <p className="text-sm">
                  No active project metrics recorded yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Activities row */}
      <div className="dashboard-bottom-row">
        {/* Tasks due today */}
        <div className="card bottom-card due-tasks-panel">
          <div className="card-header">
            <h2 className="card-title">Deadlines Due</h2>
            <p className="card-subtitle">
              Pending tasks due for delivery today
            </p>
          </div>
          <div className="timeline-container">
            {stats?.tasksDueToday && stats.tasksDueToday > 0 ? (
              <div className="due-alert alert-error">
                <AlertCircle size={18} />
                <span>
                  You have <strong>{stats.tasksDueToday}</strong> task deadlines
                  due today. Please update their Kanban board cards.
                </span>
              </div>
            ) : (
              <div
                className="no-due-box text-center flex-center"
                style={{
                  flexDirection: "column",
                  padding: "40px 0",
                  gap: "8px",
                }}
              >
                <ShieldCheck
                  size={36}
                  style={{ color: "var(--color-success)" }}
                />
                <p className="text-sm">
                  All task deliverables are fully updated for today!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions panel */}
        <div className="card bottom-card quick-actions-panel">
          <div className="card-header">
            <h2 className="card-title">Workspace Shortcuts</h2>
            <p className="card-subtitle">
              Quick access tools for business management
            </p>
          </div>
          <div className="quick-actions-grid">
            {quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <div
                  key={idx}
                  className="action-button-card"
                  onClick={() => navigate(action.path)}
                >
                  <div className="action-icon-box">
                    <Icon size={20} className="action-icon" />
                  </div>
                  <span className="action-label">{action.label}</span>
                  <ArrowUpRight className="action-arrow" size={16} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
