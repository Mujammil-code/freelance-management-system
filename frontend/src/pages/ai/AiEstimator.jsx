import React, { useState } from "react";
import api from "../../services/api";
import {
  BrainCircuit,
  Calendar,
  Cpu,
  Clock,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  Award,
} from "lucide-react";
import "./AiEstimator.css";

const AiEstimator = () => {
  const [projectType, setProjectType] = useState("SaaS Dashboard");
  const [numberOfPages, setNumberOfPages] = useState(10);
  const [complexity, setComplexity] = useState("MEDIUM");
  const [teamSize, setTeamSize] = useState(1);
  const [deadline, setDeadline] = useState(30);
  const [description, setDescription] = useState("");
  // Selection checklist
  const [techList, setTechList] = useState([
    "React",
    "Java Spring Boot",
    "PostgreSQL",
  ]);
  const [featureList, setFeatureList] = useState([
    "Authentication",
    "Payment Integration",
    "Live Chat Messages",
  ]);

  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);

  const availableTechs = [
    "React",
    "Java Spring Boot",
    "PostgreSQL",
    "MongoDB",
    "NodeJS",
    "AWS",
    "Docker",
    "Stripe",
  ];
  const availableFeatures = [
    "Authentication",
    "Payment Integration",
    "Live Chat Messages",
    "File Storage Manager",
    "Deadlines Calendar",
    "Analytics Reports",
  ];

  const presets = [
    {
      name: "Simple Portfolio",
      projectType: "Static Website",
      numberOfPages: 3,
      complexity: "LOW",
      teamSize: 1,
      deadline: 10,
      techList: ["React"],
      featureList: [],
      description:
        "Single-page developer portfolio website containing contact forms and projects listing.",
    },
    {
      name: "E-commerce App",
      projectType: "E-commerce Store",
      numberOfPages: 12,
      complexity: "HIGH",
      teamSize: 2,
      deadline: 45,
      techList: ["React", "NodeJS", "MongoDB", "Stripe"],
      featureList: [
        "Authentication",
        "Payment Integration",
        "File Storage Manager",
      ],
      description:
        "Full-stack retail store with cart functionalities, checkout, and admin dashboard panels.",
    },
    {
      name: "SaaS Platform Backend",
      projectType: "REST API Integration",
      numberOfPages: 8,
      complexity: "MEDIUM",
      teamSize: 1,
      deadline: 30,
      techList: ["Java Spring Boot", "PostgreSQL", "Docker"],
      featureList: [
        "Authentication",
        "Live Chat Messages",
        "Analytics Reports",
      ],
      description:
        "Enterprise REST services managing user sessions, chat relays, and billing ledger audits.",
    },
  ];

  const applyPreset = (preset) => {
    setProjectType(preset.projectType);
    setNumberOfPages(preset.numberOfPages);
    setComplexity(preset.complexity);
    setTeamSize(preset.teamSize);
    setDeadline(preset.deadline);
    setTechList(preset.techList);
    setFeatureList(preset.featureList);
    setDescription(preset.description);
  };

  const toggleTech = (tech) => {
    setTechList((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech],
    );
  };

  const toggleFeature = (feat) => {
    setFeatureList((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat],
    );
  };

  const handleGenerateEstimate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setEstimate(null);

    try {
      const res = await api.post("/ai/estimate", {
        projectType,
        numberOfPages,
        complexity,
        technologies: techList,
        features: featureList,
        teamSize,
        deadline,
        description,
      });
      // Simulate slight network latency for premium AI processing animation feel!
      setTimeout(() => {
        setEstimate(res.data);
        setLoading(false);
      }, 1000);
    } catch (err) {
      alert("Failed to generate AI estimate");
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case "HIGH":
        return "var(--color-danger)";
      case "MEDIUM":
        return "var(--color-warning)";
      default:
        return "var(--color-success)";
    }
  };

  return (
    <div className="ai-estimator-page page-container">
      {/* Header */}
      <div
        className="dashboard-header"
        style={{ marginBottom: "var(--spacing-xl)" }}
      >
        <div>
          <h1
            className="dashboard-title flex-center"
            style={{ gap: "var(--spacing-sm)", justifyContent: "flex-start" }}
          >
            <BrainCircuit className="text-blue" size={32} /> AI Project
            Estimator
          </h1>
          <p className="dashboard-subtitle">
            Generate high-fidelity timeline, difficulty score, and risk matrix
            calculations.
          </p>
        </div>
      </div>

      <div className="ai-split-grid">
        {/* Left Side Form inputs */}
        <div className="card input-card-panel">
          <h3
            className="section-title flex-center"
            style={{
              gap: "6px",
              justifyContent: "flex-start",
              borderBottom: "1px solid var(--color-border)",
              paddingBottom: "12px",
            }}
          >
            <Cpu size={18} className="text-blue" /> Scope Specifications
          </h3>

          <div className="presets-section" style={{ marginTop: "16px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--color-text-muted)",
                display: "block",
                marginBottom: "8px",
              }}
            >
              Select Preset Template
            </span>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{
                    borderRadius: "var(--radius-full)",
                    padding: "4px 12px",
                  }}
                  onClick={() => applyPreset(preset)}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleGenerateEstimate}
            className="ai-input-form"
            style={{ marginTop: "var(--spacing-md)" }}
          >
            <div className="form-group">
              <label className="form-label">Project Category</label>
              <select
                className="form-input form-select"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
              >
                <option value="SaaS Dashboard">SaaS Dashboard Dashboard</option>
                <option value="Mobile App">Mobile Native App</option>
                <option value="E-commerce Store">E-commerce Marketplace</option>
                <option value="Static Website">Corporate Static Website</option>
                <option value="REST API Integration">
                  REST API backend Microservice
                </option>
              </select>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Target Page Count</label>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  value={numberOfPages}
                  onChange={(e) => setNumberOfPages(Number(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">System Complexity</label>
                <select
                  className="form-input form-select"
                  value={complexity}
                  onChange={(e) => setComplexity(e.target.value)}
                >
                  <option value="LOW">Low Complexity</option>
                  <option value="MEDIUM">Medium / Standard</option>
                  <option value="HIGH">High System Complexity</option>
                  <option value="VERY_HIGH">Very High / Enterprise</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Technologies Scope</label>
              <div className="tech-checkbox-grid">
                {availableTechs.map((t) => (
                  <button
                    type="button"
                    key={t}
                    className={`tech-toggle-chip ${techList.includes(t) ? "active" : ""}`}
                    onClick={() => toggleTech(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Required Feature integrations
              </label>
              <div className="feature-checkbox-list">
                {availableFeatures.map((f) => (
                  <label key={f} className="feature-checkbox-label">
                    <input
                      type="checkbox"
                      checked={featureList.includes(f)}
                      onChange={() => toggleFeature(f)}
                    />

                    <span>{f}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Developer Team Size</label>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  max={10}
                  value={teamSize}
                  onChange={(e) => setTeamSize(Number(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Target Deadline (Days)</label>
                <input
                  type="number"
                  className="form-input"
                  min={3}
                  value={deadline}
                  onChange={(e) => setDeadline(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">System Description / Notes</label>
              <textarea
                className="form-input"
                placeholder="Describe integration specs, layout requirements..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block flex-center"
              style={{ gap: "var(--spacing-sm)" }}
              disabled={loading}
            >
              <Sparkles size={18} />{" "}
              {loading ? "Computing AI Report..." : "Generate AI Estimate"}
            </button>
          </form>
        </div>

        {/* Right Side AI report results */}
        <div className="ai-report-panel">
          {loading ? (
            <div
              className="card loading-ai-report flex-center"
              style={{
                height: "100%",
                flexDirection: "column",
                gap: "var(--spacing-md)",
              }}
            >
              <div
                className="ai-spinner skeleton"
                style={{ width: "80px", height: "80px", borderRadius: "50%" }}
              ></div>
              <h3 className="card-title text-gradient">
                AI Heuristics Analysis
              </h3>
              <p className="card-subtitle">
                Estimating working hours, milestones timelines, and system
                risks...
              </p>
            </div>
          ) : estimate ? (
            <div className="card ai-result-report-card show">
              <div className="report-header">
                <div
                  className="flex-center"
                  style={{ gap: "8px", justifyContent: "flex-start" }}
                >
                  <Sparkles size={20} className="text-blue" />
                  <h3 className="report-badge-title">AI Estimation Proposal</h3>
                </div>
                <span className="badge badge-success">READY</span>
              </div>

              {/* KPI metrics row */}
              <div className="report-metrics-row">
                <div className="report-metric-card">
                  <Calendar size={18} className="text-blue" />
                  <div className="metric-text-box">
                    <p className="metric-title">Estimated Time</p>
                    <p className="metric-data">{estimate.estimatedDays} Days</p>
                  </div>
                </div>

                <div className="report-metric-card">
                  <Clock size={18} className="text-purple" />
                  <div className="metric-text-box">
                    <p className="metric-title">Total Effort</p>
                    <p className="metric-data">{estimate.workingHours} Hours</p>
                  </div>
                </div>
              </div>

              {/* Dial Rings Row */}
              <div className="report-dials-row">
                <div className="report-dial-box">
                  <Award size={20} className="text-orange" />
                  <div className="dial-value-text">
                    <p className="dial-label">Difficulty Score</p>
                    <p className="dial-val">
                      {estimate.difficultyScore}{" "}
                      <span className="text-muted">/ 10</span>
                    </p>
                  </div>
                </div>

                <div className="report-dial-box">
                  <ShieldAlert
                    size={20}
                    style={{ color: getRiskColor(estimate.riskLevel) }}
                  />
                  <div className="dial-value-text">
                    <p className="dial-label">Risk Threshold</p>
                    <p
                      className="dial-val"
                      style={{ color: getRiskColor(estimate.riskLevel) }}
                    >
                      {estimate.riskLevel}
                    </p>
                  </div>
                </div>
              </div>

              {/* Accrodion schedule phases */}
              <div className="report-phases-section">
                <h4 className="report-sub-title">
                  Suggested Delivery Schedule
                </h4>
                <div className="phases-list">
                  {estimate.phases.map((phase, idx) => (
                    <div key={idx} className="phase-item">
                      <ChevronRight size={14} className="text-blue" />
                      <span>{phase}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checkpoints milestones */}
              <div className="report-milestones-section">
                <h4 className="report-sub-title">Recommended Milestones</h4>
                <div className="milestones-checkpoints-list">
                  {estimate.milestones.map((m, idx) => (
                    <div key={idx} className="milestone-checkpoint-row">
                      <div className="checkpoint-dot"></div>
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warning box */}
              {estimate.warnings && estimate.warnings.length > 0 && (
                <div className="report-warnings-box">
                  <h4
                    className="warning-box-title flex-center"
                    style={{
                      gap: "6px",
                      justifyContent: "flex-start",
                      color: "var(--color-danger)",
                    }}
                  >
                    <AlertTriangle size={16} /> Scope Constraints Alerts
                  </h4>
                  <ul className="warnings-bullet-list">
                    {estimate.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div
              className="card report-placeholder flex-center"
              style={{
                height: "100%",
                flexDirection: "column",
                gap: "var(--spacing-md)",
                padding: "60px var(--spacing-xl)",
              }}
            >
              <BrainCircuit size={48} style={{ opacity: 0.2 }} />
              <h3 className="card-title text-muted">Awaiting Scope Input</h3>
              <p
                className="card-subtitle text-center"
                style={{ maxWidth: "300px" }}
              >
                Fill project category and system complexity on the left to
                compute the proposal metrics.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiEstimator;
