import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

// Layouts
import DashboardLayout from "./layouts/DashboardLayout";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Dashboard Pages
import Dashboard from "./pages/dashboard/Dashboard";
import Clients from "./pages/clients/Clients";
import ClientDetail from "./pages/clients/ClientDetail";
import Projects from "./pages/projects/Projects";
import ProjectDetail from "./pages/projects/ProjectDetail";
import TaskBoard from "./pages/tasks/TaskBoard";
import Invoices from "./pages/invoices/Invoices";
import Payments from "./pages/payments/Payments";
import Files from "./pages/files/Files";
import Calendar from "./pages/calendar/Calendar";
import Chat from "./pages/chat/Chat";
import AiEstimator from "./pages/ai/AiEstimator";
import Reports from "./pages/reports/Reports";
import Profile from "./pages/profile/Profile";
import Settings from "./pages/settings/Settings";

// Loading Component
const PageLoader = () => (
  <div
    style={{
      display: "flex",
      height: "100vh",
      width: "100vw",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--color-bg)",
    }}
  >
    <div
      className="skeleton"
      style={{ width: "80px", height: "80px", borderRadius: "50%" }}
    ></div>
  </div>
);

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Admin Only Route Guard
const AdminRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role !== "ADMIN") {
    return <Navigate to="/projects" replace />;
  }

  return <>{children}</>;
};

// Public Route Guard (Redirects to dashboard or projects if already logged in)
const PublicRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (currentUser) {
    if (currentUser.role === "ADMIN") {
      return <Navigate to="/" replace />;
    } else {
      return <Navigate to="/projects" replace />;
    }
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              }
            />

            {/* Dashboard Sub-routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route
                index
                element={
                  <AdminRoute>
                    <Dashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="clients"
                element={
                  <AdminRoute>
                    <Clients />
                  </AdminRoute>
                }
              />
              <Route
                path="clients/:id"
                element={
                  <AdminRoute>
                    <ClientDetail />
                  </AdminRoute>
                }
              />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/:id" element={<ProjectDetail />} />
              <Route path="tasks" element={<TaskBoard />} />
              <Route path="invoices" element={<Invoices />} />
              <Route
                path="payments"
                element={
                  <AdminRoute>
                    <Payments />
                  </AdminRoute>
                }
              />
              <Route path="files" element={<Files />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="chat" element={<Chat />} />
              <Route
                path="ai-estimator"
                element={
                  <AdminRoute>
                    <AiEstimator />
                  </AdminRoute>
                }
              />
              <Route path="reports" element={<Reports />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Catch-all Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
