import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  Search,
  FolderKanban,
  Users,
  ClipboardList,
  Receipt,
  CreditCard,
  Settings,
  Terminal,
  Sparkles,
} from "lucide-react";
import "./CommandPalette.css";

const CommandPalette = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
      fetchFuzzyData();
    }
  }, [isOpen]);

  const fetchFuzzyData = async () => {
    try {
      const [projectsRes, clientsRes] = await Promise.all([
        api.get("/projects"),
        api.get("/clients", { params: { size: 50 } }),
      ]);
      setProjects(projectsRes.data);
      setClients(clientsRes.data.content);
    } catch (err) {
      // Silent error
    }
  };

  // Default actions list
  const staticCommands = [
    { label: "Go to Dashboard", path: "/", icon: Terminal },
    { label: "Go to Task Board", path: "/tasks", icon: ClipboardList },
    { label: "Go to Clients CRM", path: "/clients", icon: Users },
    { label: "Go to Projects Hub", path: "/projects", icon: FolderKanban },
    { label: "Go to Billing Ledger", path: "/invoices", icon: Receipt },
    { label: "Go to Payments Ledger", path: "/payments", icon: CreditCard },
    {
      label: "Estimate Project with AI",
      path: "/ai-estimator",
      icon: Sparkles,
    },
    { label: "Go to Settings", path: "/settings", icon: Settings },
  ];

  // Filtering commands, projects, and clients
  const filteredCommands = staticCommands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()),
  );

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(query.toLowerCase())),
  );

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(query.toLowerCase())),
  );

  const totalItems =
    filteredCommands.length + filteredProjects.length + filteredClients.length;

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === "Enter") {
      e.preventDefault();
      triggerSelectedItem();
    }
  };

  const triggerSelectedItem = () => {
    let currentIdx = 0;

    // 1. Static Commands
    for (let cmd of filteredCommands) {
      if (currentIdx === selectedIndex) {
        navigate(cmd.path);
        onClose();
        return;
      }
      currentIdx++;
    }

    // 2. Matching Projects
    for (let proj of filteredProjects) {
      if (currentIdx === selectedIndex) {
        navigate(`/projects/${proj.id}`);
        onClose();
        return;
      }
      currentIdx++;
    }

    // 3. Matching Clients
    for (let client of filteredClients) {
      if (currentIdx === selectedIndex) {
        navigate(`/clients/${client.id}`);
        onClose();
        return;
      }
      currentIdx++;
    }
  };

  if (!isOpen) return null;

  let renderIdx = 0;

  return (
    <div className="command-palette-backdrop" onClick={onClose}>
      <div
        className="command-palette-card card"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="palette-search-wrapper">
          <Search className="palette-search-icon" size={20} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search record..."
            className="palette-search-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />

          <kbd className="palette-kbd">ESC</kbd>
        </div>

        <div className="palette-results-viewport">
          {/* Static Navigation Commands */}
          {filteredCommands.length > 0 && (
            <div className="palette-results-section">
              <span className="section-label">Navigation & Shortcuts</span>
              {filteredCommands.map((cmd) => {
                const Icon = cmd.icon;
                const active = renderIdx === selectedIndex;
                const currentIdx = renderIdx++;
                return (
                  <div
                    key={cmd.path}
                    className={`palette-item ${active ? "active" : ""}`}
                    onClick={() => {
                      navigate(cmd.path);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(currentIdx)}
                  >
                    <Icon size={16} />
                    <span>{cmd.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Projects results */}
          {filteredProjects.length > 0 && (
            <div className="palette-results-section">
              <span className="section-label">Projects Hub</span>
              {filteredProjects.map((proj) => {
                const active = renderIdx === selectedIndex;
                const currentIdx = renderIdx++;
                return (
                  <div
                    key={proj.id}
                    className={`palette-item ${active ? "active" : ""}`}
                    onClick={() => {
                      navigate(`/projects/${proj.id}`);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(currentIdx)}
                  >
                    <FolderKanban size={16} className="text-blue" />
                    <span>Project: {proj.name}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* CRM Clients results */}
          {filteredClients.length > 0 && (
            <div className="palette-results-section">
              <span className="section-label">Clients CRM</span>
              {filteredClients.map((client) => {
                const active = renderIdx === selectedIndex;
                const currentIdx = renderIdx++;
                return (
                  <div
                    key={client.id}
                    className={`palette-item ${active ? "active" : ""}`}
                    onClick={() => {
                      navigate(`/clients/${client.id}`);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(currentIdx)}
                  >
                    <Users size={16} className="text-purple" />
                    <span>
                      Client: {client.name}{" "}
                      {client.company ? `(${client.company})` : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {totalItems === 0 && (
            <div
              className="palette-empty-state text-center"
              style={{ padding: "30px 0" }}
            >
              <p className="text-sm text-muted">
                No commands or registers match "{query}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
