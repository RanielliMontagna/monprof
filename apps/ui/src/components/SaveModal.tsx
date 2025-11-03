import { Monitor, Save, X } from "lucide-react";
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
    const trimmed = profileName.trim();

    if (!trimmed) {
      setError("Profile name is required");
      return;
    }

    if (existingNames.includes(trimmed)) {
      setError("A profile with this name already exists");
      return;
    }

    onSave(trimmed);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div
        className="bg-catppuccin-mantle border border-catppuccin-surface1 rounded-xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-catppuccin-surface1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-catppuccin-blue/20 rounded-lg flex items-center justify-center">
              <Monitor className="w-5 h-5 text-catppuccin-blue" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-catppuccin-text">Save Current Layout</h2>
              <p className="text-xs text-catppuccin-overlay">Create a new profile</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-catppuccin-surface0 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-catppuccin-subtext" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label
              htmlFor="profile-name-input"
              className="block text-sm font-medium text-catppuccin-subtext mb-2"
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
              placeholder="e.g., professional, gaming, home-office"
              className="input"
            />
            {error && (
              <p className="text-sm text-catppuccin-red mt-2 flex items-center gap-1">
                <span className="w-4 h-4 flex items-center justify-center">!</span>
                {error}
              </p>
            )}
            <p className="text-xs text-catppuccin-overlay mt-2">
              This will save your current display configuration as a new profile
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-catppuccin-surface1">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn btn-primary flex items-center gap-2"
            disabled={!profileName.trim()}
          >
            <Save className="w-4 h-4" />
            <span>Save Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SaveModal;
