import { useEffect, useState } from "react";
import type { DisplayOutput, Profile } from "../types";

interface MainPanelProps {
  profileName: string | null;
  profile: Profile | null;
  onUpdate: (name: string, profile: Profile) => void;
  onSaveAsCurrent: () => void;
}

function MainPanel({ profileName, profile, onUpdate, onSaveAsCurrent }: MainPanelProps) {
  const [editedProfile, setEditedProfile] = useState<Profile | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEditedProfile(profile ? { ...profile, outputs: [...profile.outputs] } : null);
    setHasChanges(false);
  }, [profile]);

  if (!profileName || !profile) {
    return (
      <main
        style={{
          flex: 1,
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-secondary)",
        }}
      >
        <p>Select a profile from the sidebar to view or edit</p>
      </main>
    );
  }

  const updateOutput = (index: number, updates: Partial<DisplayOutput>) => {
    if (!editedProfile) return;

    const newOutputs = [...editedProfile.outputs];
    newOutputs[index] = { ...newOutputs[index], ...updates };
    setEditedProfile({ outputs: newOutputs });
    setHasChanges(true);
  };

  const handleSave = () => {
    if (editedProfile && hasChanges) {
      onUpdate(profileName, editedProfile);
      setHasChanges(false);
    }
  };

  return (
    <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{profileName}</h2>
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <button type="button" onClick={handleSave} disabled={!hasChanges}>
            Save Profile
          </button>
          <button type="button" onClick={onSaveAsCurrent}>
            Save current layout as this profile
          </button>
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Outputs</h3>
        {editedProfile?.outputs.map((output, index) => (
          <div
            key={`${output.name}-${index}`}
            style={{
              background: "var(--bg-tertiary)",
              padding: "1.5rem",
              borderRadius: "8px",
              marginBottom: "1rem",
              border: "1px solid var(--border)",
            }}
          >
            <h4 style={{ marginBottom: "1rem", color: "var(--accent)" }}>{output.name}</h4>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
              <div>
                <label
                  htmlFor={`enabled-${index}`}
                  style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}
                >
                  Enabled
                </label>
                <select
                  id={`enabled-${index}`}
                  value={output.enabled ? "enabled" : "disabled"}
                  onChange={(e) => updateOutput(index, { enabled: e.target.value === "enabled" })}
                >
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor={`primary-${index}`}
                  style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}
                >
                  Primary
                </label>
                <select
                  id={`primary-${index}`}
                  value={output.primary ? "true" : "false"}
                  onChange={(e) => updateOutput(index, { primary: e.target.value === "true" })}
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor={`rotation-${index}`}
                  style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}
                >
                  Rotation
                </label>
                <select
                  id={`rotation-${index}`}
                  value={output.rotation || "normal"}
                  onChange={(e) =>
                    updateOutput(index, {
                      rotation: e.target.value as DisplayOutput["rotation"],
                    })
                  }
                >
                  <option value="normal">Normal</option>
                  <option value="left">Left (90°)</option>
                  <option value="right">Right (270°)</option>
                  <option value="inverted">Inverted (180°)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor={`mode-${index}`}
                  style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}
                >
                  Mode (WIDTHxHEIGHT@REFRESH)
                </label>
                <input
                  id={`mode-${index}`}
                  type="text"
                  value={output.mode || ""}
                  onChange={(e) => updateOutput(index, { mode: e.target.value })}
                  placeholder="e.g., 1920x1080@60"
                />
              </div>

              {output.position && (
                <>
                  <div>
                    <label
                      htmlFor={`pos-x-${index}`}
                      style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}
                    >
                      Position X
                    </label>
                    <input
                      id={`pos-x-${index}`}
                      type="number"
                      value={output.position[0]}
                      onChange={(e) => {
                        if (output.position) {
                          updateOutput(index, {
                            position: [
                              Number.parseInt(e.target.value, 10) || 0,
                              output.position[1],
                            ],
                          });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`pos-y-${index}`}
                      style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}
                    >
                      Position Y
                    </label>
                    <input
                      id={`pos-y-${index}`}
                      type="number"
                      value={output.position[1]}
                      onChange={(e) => {
                        if (output.position) {
                          updateOutput(index, {
                            position: [
                              output.position[0],
                              Number.parseInt(e.target.value, 10) || 0,
                            ],
                          });
                        }
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export default MainPanel;
