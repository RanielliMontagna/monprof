import { useState } from "react";

interface SaveModalProps {
  onClose: () => void;
  onSave: (name: string) => void;
  existingNames: string[];
}

function SaveModal({ onClose, onSave, existingNames }: SaveModalProps) {
  const [profileName, setProfileName] = useState("");
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!profileName.trim()) {
      setError("Profile name is required");
      return;
    }

    if (existingNames.includes(profileName.trim())) {
      setError("A profile with this name already exists");
      return;
    }

    onSave(profileName.trim());
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-secondary)",
          padding: "2rem",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          minWidth: "400px",
          maxWidth: "90%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem" }}>Save Current Layout</h2>

        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="profile-name-input"
            style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}
          >
            Profile Name
          </label>
          <input
            id="profile-name-input"
            type="text"
            value={profileName}
            onChange={(e) => {
              setProfileName(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSave();
              }
            }}
            placeholder="e.g., professional, gaming"
            style={{ width: "100%" }}
          />
          {error && (
            <p style={{ color: "var(--error)", fontSize: "0.85rem", marginTop: "0.5rem" }}>
              {error}
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
          >
            Cancel
          </button>
          <button type="button" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default SaveModal;
