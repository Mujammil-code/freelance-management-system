import React, { useState, useEffect } from "react";
import api from "../../services/api";
import {
  FolderClosed,
  FileText,
  Image,
  FileCode,
  FileUp,
  Trash2,
  Download,
} from "lucide-react";
import "./Files.css";

const Files = () => {
  const [files, setFiles] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchFilesAndProjects = async () => {
    setLoading(true);
    try {
      const [projectsRes, filesRes] = await Promise.all([
        api.get("/projects"),
        api.get("/files/my-files"),
      ]);
      setProjects(projectsRes.data);
      setFiles(filesRes.data);
      if (projectsRes.data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projectsRes.data[0].id.toString());
      }
    } catch (err) {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilesAndProjects();
  }, []);

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", uploadedFile);
    if (selectedProjectId) {
      formData.append("projectId", selectedProjectId);
    }

    try {
      await api.post("/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchFilesAndProjects();
    } catch (err) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (id) => {
    if (
      !window.confirm("Delete this document? This action cannot be reverted.")
    )
      return;
    try {
      await api.delete(`/files/${id}`);
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      alert("Failed to delete file");
    }
  };

  const getFileIcon = (category) => {
    switch (category) {
      case "IMAGE":
        return <Image size={24} className="file-cat-icon text-purple" />;
      case "PDF":
        return <FileText size={24} className="file-cat-icon text-danger" />;
      case "CONTRACT":
        return <FileText size={24} className="file-cat-icon text-green" />;
      case "DESIGN":
        return <Image size={24} className="file-cat-icon text-orange" />;
      default:
        return <FileCode size={24} className="file-cat-icon text-blue" />;
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return "0 KB";
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const filteredFiles = selectedProjectId
    ? files.filter((f) => f.projectId === Number(selectedProjectId))
    : files;

  return (
    <div className="files-page page-container">
      {/* Header */}
      <div
        className="dashboard-header"
        style={{ marginBottom: "var(--spacing-lg)" }}
      >
        <div>
          <h1 className="dashboard-title">File Hosting Manager</h1>
          <p className="dashboard-subtitle">
            Host project contracts, source design assets, and client briefs
            safely.
          </p>
        </div>

        <div className="upload-btn-wrapper">
          <input
            type="file"
            id="global-file-upload"
            style={{ display: "none" }}
            onChange={handleFileUpload}
            disabled={uploading}
          />

          <button
            className="btn btn-primary"
            disabled={uploading}
            onClick={() =>
              document.getElementById("global-file-upload")?.click()
            }
          >
            <FileUp size={16} />{" "}
            {uploading ? "Uploading Asset..." : "Upload File"}
          </button>
        </div>
      </div>

      {/* Filter and Folder select */}
      <div className="board-filters-bar card">
        <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>
          Active Folder Segment:
        </label>
        <select
          className="form-input form-select"
          style={{ maxWidth: "280px", margin: 0 }}
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
        >
          <option value="">-- All Storage Folders --</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Grid of File Assets */}
      {loading ? (
        <div className="grid-4">
          <div className="skeleton" style={{ height: "140px" }}></div>
          <div className="skeleton" style={{ height: "140px" }}></div>
          <div className="skeleton" style={{ height: "140px" }}></div>
        </div>
      ) : filteredFiles.length > 0 ? (
        <div className="grid-4 files-grid">
          {filteredFiles.map((file) => (
            <div key={file.id} className="card file-asset-card">
              <div className="file-card-top-icon">
                {getFileIcon(file.category)}
                <button
                  className="icon-btn text-danger delete-file-btn"
                  onClick={() => handleDeleteFile(file.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="file-card-details">
                <p
                  className="file-asset-name-title"
                  title={file.originalFileName}
                >
                  {file.originalFileName}
                </p>
                <div
                  className="flex-center"
                  style={{
                    justifyContent: "space-between",
                    marginTop: "var(--spacing-xs)",
                  }}
                >
                  <span className="text-xs text-muted">
                    {formatSize(file.fileSize)}
                  </span>
                  <a
                    href={file.fileUrl}
                    download
                    className="icon-btn text-blue"
                    title="Download Document"
                  >
                    <Download size={16} />
                  </a>
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
          <FolderClosed size={48} style={{ opacity: 0.3 }} />
          <h3 className="card-title">Folder is Empty</h3>
          <p className="card-subtitle">
            Upload project specifications, wireframe layouts, or contract
            documents.
          </p>
          <button
            className="btn btn-primary"
            onClick={() =>
              document.getElementById("global-file-upload")?.click()
            }
          >
            + Upload Asset
          </button>
        </div>
      )}
    </div>
  );
};

export default Files;
