import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";
import CommandPalette from "../components/ui/CommandPalette";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  ClipboardList,
  Receipt,
  CreditCard,
  FolderClosed,
  CalendarRange,
  MessageSquareCode,
  BrainCircuit,
  BarChart3,
  UserCog,
  Settings,
  LogOut,
  Sun,
  Moon,
  Search,
  Bell,
  Menu,
  X,
  Plus,
} from "lucide-react";
import "./DashboardLayout.css";

const DashboardLayout = () => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  // Palette & Sidebar Widget states
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [activeProjects, setActiveProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [widgetExpanded, setWidgetExpanded] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getNavItems = () => {
    const isAdmin = currentUser?.role === "ADMIN";
    if (isAdmin) {
      return [
        { path: "/", label: "Dashboard", icon: LayoutDashboard },
        { path: "/clients", label: "Clients", icon: Users },
        { path: "/projects", label: "Projects", icon: FolderKanban },
        { path: "/tasks", label: "Task Board", icon: ClipboardList },
        { path: "/invoices", label: "Invoices", icon: Receipt },
        { path: "/payments", label: "Payments", icon: CreditCard },
        { path: "/files", label: "Files", icon: FolderClosed },
        { path: "/calendar", label: "Calendar", icon: CalendarRange },
        { path: "/chat", label: "Messages", icon: MessageSquareCode },
        { path: "/ai-estimator", label: "AI Estimator", icon: BrainCircuit },
        { path: "/reports", label: "Reports", icon: BarChart3 },
        { path: "/profile", label: "Profile", icon: UserCog },
        { path: "/settings", label: "Settings", icon: Settings },
      ];
    } else {
      return [
        { path: "/projects", label: "My Projects", icon: FolderKanban },
        { path: "/tasks", label: "Task Board", icon: ClipboardList },
        { path: "/invoices", label: "My Invoices", icon: Receipt },
        { path: "/chat", label: "Messages", icon: MessageSquareCode },
        { path: "/reports", label: "Reports", icon: BarChart3 },
        { path: "/profile", label: "Profile", icon: UserCog },
        { path: "/settings", label: "Settings", icon: Settings },
      ];
    }
  };

  const getInitials = () => {
    if (!currentUser) return "F";
    return (currentUser.firstName[0] + currentUser.lastName[0]).toUpperCase();
  };

  const handleQuickAdd = (targetPath) => {
    setQuickAddOpen(false);
    navigate(targetPath);
  };

  // Keyboard shortcut listener and project data sync
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    const fetchActiveProjects = async () => {
      try {
        const res = await api.get("/projects");
        const active = res.data
          .filter((p) => p.status === "IN_PROGRESS" || p.status === "PLANNING")
          .slice(0, 3);
        setActiveProjects(active);
      } catch (err) {
        // Silent error
      }
    };
    fetchActiveProjects();

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [location.pathname]);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);
    } catch (err) {
      // Silent error
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      // Silent error
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications([]);
    } catch (err) {
      // Silent error
    }
  };

  return (
    <div className="layout-container">
      {/* Global Command Palette modal overlay */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* Sidebar for Desktop */}
      <aside
        className={`sidebar ${sidebarCollapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
      >
        <div className="sidebar-header">
          <div className="logo-container">
            <BrainCircuit className="logo-icon" size={28} />
            {!sidebarCollapsed && (
              <span className="logo-text">
                Freelance<span>OS</span>
              </span>
            )}
          </div>
          <button
            className="mobile-close-btn"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {getNavItems().map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => setMobileOpen(false)}
                title={sidebarCollapsed ? item.label : ""}
              >
                <Icon size={20} className="nav-icon" />
                {!sidebarCollapsed && (
                  <span className="nav-label">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapsible Active Projects widget */}
        {!sidebarCollapsed && activeProjects.length > 0 && (
          <div
            className="sidebar-projects-widget"
            style={{
              padding: "0 16px",
              marginTop: "16px",
              borderTop: "1px solid var(--color-border-light)",
              paddingTop: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                marginBottom: "8px",
              }}
              onClick={() => setWidgetExpanded(!widgetExpanded)}
            >
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "var(--color-text-muted)",
                  letterSpacing: "0.5px",
                }}
              >
                Active Projects
              </span>
              <span
                style={{ fontSize: "9px", color: "var(--color-text-muted)" }}
              >
                {widgetExpanded ? "▼" : "▲"}
              </span>
            </div>

            {widgetExpanded && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  marginTop: "8px",
                }}
              >
                {activeProjects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => navigate(`/projects/${proj.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "12px",
                        marginBottom: "4px",
                      }}
                    >
                      <span
                        className="font-semibold"
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "140px",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {proj.name}
                      </span>
                      <span className="text-muted" style={{ fontSize: "11px" }}>
                        {proj.progress}%
                      </span>
                    </div>
                    <div
                      style={{
                        background: "var(--color-border-light)",
                        height: "4px",
                        borderRadius: "2px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          background: "var(--color-primary)",
                          width: `${proj.progress}%`,
                          height: "100%",
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="sidebar-footer">
          <button
            className="nav-item logout-btn"
            onClick={handleLogout}
            title={sidebarCollapsed ? "Logout" : ""}
          >
            <LogOut size={20} className="nav-icon" />
            {!sidebarCollapsed && <span className="nav-label">Logout</span>}
          </button>
          {!sidebarCollapsed && currentUser && (
            <div className="user-profile-section">
              <div className="avatar user-avatar-sm">{getInitials()}</div>
              <div className="user-details">
                <p className="user-name">
                  {currentUser.firstName} {currentUser.lastName}
                </p>
                <p className="user-email">{currentUser.email}</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-area">
        {/* Top Navbar */}
        <header className="topnav glass">
          <div className="topnav-left">
            <button
              className="menu-toggle-btn"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={22} />
            </button>
            <button
              className="desktop-collapse-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <Menu size={20} />
            </button>

            {/* Interactive palette search input */}
            <div
              className="search-bar-wrapper"
              onClick={() => setCommandPaletteOpen(true)}
              style={{ cursor: "pointer" }}
            >
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder="Fuzzy search projects, tasks... (Ctrl+K)"
                className="search-input"
                style={{ cursor: "pointer" }}
                readOnly
              />
            </div>
          </div>

          <div className="topnav-right">
            {/* Quick Add Menu */}
            <div className="dropdown-container">
              <button
                className="btn btn-primary btn-sm quick-add-btn"
                onClick={() => setQuickAddOpen(!quickAddOpen)}
              >
                <Plus size={16} /> {!sidebarCollapsed && <span>Quick Add</span>}
              </button>
              {quickAddOpen && (
                <div className="dropdown-menu quick-add-menu show">
                  <div
                    className="dropdown-item"
                    onClick={() => handleQuickAdd("/tasks")}
                  >
                    + Add New Task
                  </div>
                  <div
                    className="dropdown-item"
                    onClick={() => handleQuickAdd("/clients")}
                  >
                    + New Client
                  </div>
                  <div
                    className="dropdown-item"
                    onClick={() => handleQuickAdd("/invoices")}
                  >
                    + Create Invoice
                  </div>
                  <div
                    className="dropdown-item"
                    onClick={() => handleQuickAdd("/projects")}
                  >
                    + Setup Project
                  </div>
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              className="icon-btn"
              onClick={toggleTheme}
              title="Toggle Light/Dark Theme"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notifications Panel */}
            <div className="dropdown-container">
              <button
                className="icon-btn notification-bell-btn"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="bell-badge">{notifications.length}</span>
                )}
              </button>
              {notificationsOpen && (
                <div className="dropdown-menu notification-menu show">
                  <div
                    className="notification-header"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>Notifications ({notifications.length})</span>
                    {notifications.length > 0 && (
                      <button
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--color-primary)",
                          fontSize: "11px",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                        onClick={handleMarkAllAsRead}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div
                    className="notification-list"
                    style={{ maxHeight: "300px", overflowY: "auto" }}
                  >
                    {notifications.length === 0 ? (
                      <div
                        className="notification-item"
                        style={{
                          textAlign: "center",
                          padding: "16px",
                          color: "var(--color-text-muted)",
                          fontSize: "13px",
                        }}
                      >
                        No new notifications
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className="notification-item"
                          onClick={() => handleMarkAsRead(n.id)}
                          style={{ cursor: "pointer" }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                            }}
                          >
                            <p
                              className="notification-title"
                              style={{ fontWeight: 600, fontSize: "13px" }}
                            >
                              {n.title}
                            </p>
                            <span
                              className="badge badge-neutral"
                              style={{ fontSize: "8px", padding: "1px 4px" }}
                            >
                              {n.type}
                            </span>
                          </div>
                          <p
                            className="notification-message"
                            style={{
                              fontSize: "12px",
                              color: "var(--color-text-secondary)",
                              marginTop: "2px",
                            }}
                          >
                            {n.message}
                          </p>
                          {n.createdAt && (
                            <p
                              className="notification-time"
                              style={{ fontSize: "10px", marginTop: "4px" }}
                            >
                              {new Date(n.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="vertical-divider"></div>

            {/* Current User Info */}
            <div
              className="avatar user-avatar-top"
              onClick={() => navigate("/profile")}
            >
              {getInitials()}
            </div>
          </div>
        </header>

        {/* Content Panel */}
        <main className="content-panel">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
