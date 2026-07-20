import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Check,
  X,
  Building2,
  DollarSign,
  BellRing,
} from "lucide-react";
import "./Calendar.css";

const Calendar = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN";

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [reminding, setReminding] = useState(false);

  const fetchCalendarEvents = async () => {
    setLoading(true);
    try {
      const [projectsRes, tasksRes, invoicesRes] = await Promise.all([
        api.get("/projects"),
        api.get("/tasks/my-tasks"),
        api.get("/invoices"),
      ]);

      const compiledEvents = [];

      // Map Projects (Start and Deadline dates)
      projectsRes.data.forEach((p) => {
        if (p.startDate) {
          compiledEvents.push({
            id: p.id,
            date: p.startDate,
            type: "project-start",
            title: `[Start] ${p.name} - ${p.clientName || "No Client"}`,
            color: "#8b5cf6", // Purple
            details: {
              name: p.name,
              clientName: p.clientName || "No Client",
              budget: p.budget,
              status: p.status,
              startDate: p.startDate,
              progress: p.progress,
            },
          });
        }
        if (p.deadline) {
          compiledEvents.push({
            id: p.id,
            date: p.deadline,
            type: "project-end",
            title: `[Deadline] ${p.name} - ${p.clientName || "No Client"}`,
            color: "#f59e0b", // Orange/Yellow
            details: {
              name: p.name,
              clientName: p.clientName || "No Client",
              budget: p.budget,
              status: p.status,
              deadline: p.deadline,
              progress: p.progress,
            },
          });
        }
      });

      // Map Tasks
      tasksRes.data.forEach((t) => {
        if (t.dueDate && t.status !== "COMPLETED") {
          compiledEvents.push({
            id: t.id,
            date: t.dueDate,
            type: "task",
            title: `Task: ${t.title}`,
            color: "#3b82f6", // Blue
            details: {
              name: t.title,
              clientName: "Internal Task",
              status: t.status,
              dueDate: t.dueDate,
            },
          });
        }
      });

      // Map Invoices (Due Dates)
      invoicesRes.data.forEach((i) => {
        if (i.dueDate && i.status !== "PAID") {
          compiledEvents.push({
            id: i.id,
            date: i.dueDate,
            type: "invoice",
            title: `[Due] ${i.invoiceNumber} - ${i.clientName || "No Client"} (₹${i.totalAmount})`,
            color: "#ef4444", // Red (outstanding payment)
            details: {
              invoiceNumber: i.invoiceNumber,
              clientName: i.clientName || "No Client",
              totalAmount: i.totalAmount,
              status: i.status,
              dueDate: i.dueDate,
            },
          });
        }
      });

      setEvents(compiledEvents);
    } catch (err) {
      // Handle silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarEvents();
  }, []);

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(val);
  };

  const handleSendReminder = async () => {
    if (!selectedEvent || selectedEvent.type !== "invoice") return;
    setReminding(true);
    try {
      await api.post(`/invoices/${selectedEvent.id}/remind`);
      alert(
        `Payment reminder notification and automated chat message sent successfully to client "${selectedEvent.details.clientName}"!`,
      );
      setSelectedEvent(null);
      fetchCalendarEvents(); // refresh status
    } catch (err) {
      alert("Failed to send reminder. Please check backend logs.");
    } finally {
      setReminding(false);
    }
  };

  const renderCells = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const cells = [];

    // Empty cells for padding days of previous month
    for (let i = 0; i < firstDay; i++) {
      cells.push(
        <div key={`empty-${i}`} className="calendar-day-cell empty-day"></div>,
      );
    }

    // Days in current month
    for (let day = 1; day <= totalDays; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayEvents = events.filter((e) => e.date === dateString);

      cells.push(
        <div key={day} className="calendar-day-cell">
          <span className="day-number">{day}</span>
          <div className="day-events-container">
            {dayEvents.slice(0, 3).map((event, idx) => (
              <div
                key={idx}
                className="calendar-event-pill"
                style={{ borderLeftColor: event.color }}
                title={event.title}
                onClick={() => setSelectedEvent(event)}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <span className="more-events-tag">
                +{dayEvents.length - 3} more
              </span>
            )}
          </div>
        </div>,
      );
    }

    return cells;
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="calendar-page page-container">
      {/* Header */}
      <div
        className="dashboard-header"
        style={{ marginBottom: "var(--spacing-lg)" }}
      >
        <div>
          <h1 className="dashboard-title">Deadlines Calendar</h1>
          <p className="dashboard-subtitle">
            Monitor due dates for projects, tasks, and invoice collections.
          </p>
        </div>
      </div>

      {/* Calendar layout card */}
      <div className="card calendar-container">
        {/* Navigation controls */}
        <div className="calendar-navigator-bar">
          <div className="flex-center" style={{ gap: "var(--spacing-sm)" }}>
            <CalendarDays className="text-blue" size={24} />
            <h2 className="calendar-title-text">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
          </div>

          <div className="flex-center" style={{ gap: "var(--spacing-md)" }}>
            <button className="icon-btn nav-arrow" onClick={prevMonth}>
              <ChevronLeft size={20} />
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </button>
            <button className="icon-btn nav-arrow" onClick={nextMonth}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="calendar-week-days-grid">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Calendar days cells */}
        {loading ? (
          <div
            className="skeleton"
            style={{
              height: "400px",
              width: "100%",
              borderRadius: "var(--radius-md)",
            }}
          ></div>
        ) : (
          <div className="calendar-days-grid">{renderCells()}</div>
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="modal-backdrop" onClick={() => setSelectedEvent(null)}>
          <div
            className="modal-content show"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "480px" }}
          >
            <div className="modal-header">
              <h2
                className="modal-title"
                style={{ fontSize: "var(--font-size-md)" }}
              >
                Event Details
              </h2>
              <button
                className="icon-btn flex-center"
                onClick={() => setSelectedEvent(null)}
                style={{
                  width: "32px",
                  height: "32px",
                  border: "none",
                  background: "transparent",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--spacing-md)",
              }}
            >
              <div>
                <span
                  className={`badge ${
                    selectedEvent.type.startsWith("project")
                      ? "badge-success"
                      : selectedEvent.type === "invoice"
                        ? "badge-danger"
                        : "badge-neutral"
                  }`}
                  style={{ marginBottom: "var(--spacing-sm)" }}
                >
                  {selectedEvent.type.toUpperCase().replace("-", " ")}
                </span>
                <h3
                  style={{
                    fontSize: "var(--font-size-lg)",
                    fontWeight: 800,
                    color: "var(--color-text)",
                  }}
                >
                  {selectedEvent.details.name ||
                    selectedEvent.details.invoiceNumber}
                </h3>
              </div>

              <div
                className="divider"
                style={{ margin: "var(--spacing-sm) 0" }}
              ></div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      background: "var(--color-surface-2)",
                      padding: "8px",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    <Building2 size={18} />
                  </div>
                  <div>
                    <p
                      className="text-xs text-muted"
                      style={{ fontWeight: 600 }}
                    >
                      CLIENT ASSOCIATED
                    </p>
                    <p
                      style={{
                        fontWeight: 600,
                        fontSize: "var(--font-size-sm)",
                      }}
                    >
                      {selectedEvent.details.clientName}
                    </p>
                  </div>
                </div>

                {selectedEvent.details.budget !== undefined && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        background: "var(--color-surface-2)",
                        padding: "8px",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      <DollarSign size={18} />
                    </div>
                    <div>
                      <p
                        className="text-xs text-muted"
                        style={{ fontWeight: 600 }}
                      >
                        WORKSPACE BUDGET
                      </p>
                      <p
                        style={{
                          fontWeight: 600,
                          fontSize: "var(--font-size-sm)",
                          color: "var(--color-primary)",
                        }}
                      >
                        {formatCurrency(selectedEvent.details.budget)}
                      </p>
                    </div>
                  </div>
                )}

                {selectedEvent.details.totalAmount !== undefined && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        background: "var(--color-danger-bg)",
                        padding: "8px",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--color-danger)",
                      }}
                    >
                      <DollarSign size={18} />
                    </div>
                    <div>
                      <p
                        className="text-xs text-muted"
                        style={{ fontWeight: 600 }}
                      >
                        TOTAL BILLING AMOUNT
                      </p>
                      <p
                        style={{
                          fontWeight: 600,
                          fontSize: "var(--font-size-sm)",
                          color: "var(--color-danger)",
                        }}
                      >
                        {formatCurrency(selectedEvent.details.totalAmount)}
                      </p>
                    </div>
                  </div>
                )}

                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      background: "var(--color-surface-2)",
                      padding: "8px",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    <CalendarDays size={18} />
                  </div>
                  <div>
                    <p
                      className="text-xs text-muted"
                      style={{ fontWeight: 600 }}
                    >
                      EVENT DUE DATE
                    </p>
                    <p
                      style={{
                        fontWeight: 600,
                        fontSize: "var(--font-size-sm)",
                      }}
                    >
                      {selectedEvent.date}
                    </p>
                  </div>
                </div>

                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      background: "var(--color-surface-2)",
                      padding: "8px",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    <Check size={18} />
                  </div>
                  <div>
                    <p
                      className="text-xs text-muted"
                      style={{ fontWeight: 600 }}
                    >
                      CURRENT STATE
                    </p>
                    <span
                      className={`badge ${
                        selectedEvent.details.status === "PAID" ||
                        selectedEvent.details.status === "COMPLETED"
                          ? "badge-success"
                          : selectedEvent.details.status === "OVERDUE"
                            ? "badge-danger"
                            : "badge-warning"
                      }`}
                      style={{ marginTop: "2px" }}
                    >
                      {selectedEvent.details.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reminder actions block for unpaid invoices */}
              {selectedEvent.type === "invoice" &&
                selectedEvent.details.status !== "PAID" &&
                isAdmin && (
                  <div
                    style={{
                      marginTop: "var(--spacing-md)",
                      borderTop: "1.5px solid var(--color-border)",
                      paddingTop: "var(--spacing-md)",
                    }}
                  >
                    <button
                      className="btn btn-danger flex-center"
                      style={{
                        width: "100%",
                        gap: "8px",
                        justifyContent: "center",
                      }}
                      onClick={handleSendReminder}
                      disabled={reminding}
                    >
                      <BellRing size={18} />
                      {reminding
                        ? "Sending Reminders..."
                        : "Send Overdue Reminder"}
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
