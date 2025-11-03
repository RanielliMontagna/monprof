import { Maximize2, Monitor, Move, Power, RefreshCw, RotateCcw, Save, Star } from "lucide-react";
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditedProfile(profile ? { ...profile, outputs: [...profile.outputs] } : null);
    setHasChanges(false);
  }, [profile]);

  if (!profileName || !profile) {
    return (
      <main className="flex-1 p-6 md:p-8 flex flex-col items-center justify-center text-center">
        <Monitor className="w-20 h-20 text-catppuccin-overlay mb-4 opacity-30" />
        <p className="text-catppuccin-subtext text-lg mb-2">No profile selected</p>
        <p className="text-catppuccin-overlay text-sm max-w-md">
          Select a profile from the sidebar to view or edit its display configuration
        </p>
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

  const handleSave = async () => {
    if (editedProfile && hasChanges) {
      setSaving(true);
      try {
        await onUpdate(profileName, editedProfile);
        setHasChanges(false);
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-catppuccin-base">
      <div className="max-w-5xl mx-auto p-6 md:p-8">
        {/* Header */}
        <div className="mb-6 pb-6 border-b border-catppuccin-surface1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold text-catppuccin-text mb-1">{profileName}</h2>
              <p className="text-sm text-catppuccin-overlay">
                {editedProfile?.outputs.length || 0}{" "}
                {editedProfile?.outputs.length === 1 ? "display" : "displays"} configured
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
                title="Save changes to this profile"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </button>
              <button
                type="button"
                onClick={onSaveAsCurrent}
                className="btn btn-secondary flex items-center gap-2"
                title="Replace this profile with your current display configuration"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Update from Current</span>
                <span className="sm:hidden">Update</span>
              </button>
            </div>
          </div>
          {hasChanges && (
            <div className="flex items-center gap-2 text-sm text-catppuccin-yellow">
              <span className="w-2 h-2 bg-catppuccin-yellow rounded-full animate-pulse" />
              <span>You have unsaved changes</span>
            </div>
          )}
        </div>

        {/* Outputs */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-catppuccin-text mb-4">Display Outputs</h3>
          {editedProfile?.outputs.length === 0 ? (
            <div className="card text-center py-12">
              <Monitor className="w-12 h-12 text-catppuccin-overlay mx-auto mb-3 opacity-50" />
              <p className="text-catppuccin-subtext">No displays in this profile</p>
            </div>
          ) : (
            editedProfile?.outputs.map((output, index) => (
              <div key={`${output.name}-${index}`} className="card card-hover space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-catppuccin-blue" />
                    <h4 className="text-lg font-semibold text-catppuccin-text">{output.name}</h4>
                    {output.primary && (
                      <span className="badge badge-primary flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Primary
                      </span>
                    )}
                    {!output.enabled && (
                      <span className="badge bg-catppuccin-surface1 text-catppuccin-overlay border-catppuccin-surface2">
                        Disabled
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Enabled */}
                  <div>
                    <label
                      htmlFor={`enabled-${index}`}
                      className="block text-sm font-medium text-catppuccin-subtext mb-2 flex items-center gap-2"
                    >
                      <Power className="w-4 h-4" />
                      Status
                    </label>
                    <select
                      id={`enabled-${index}`}
                      value={output.enabled ? "enabled" : "disabled"}
                      onChange={(e) =>
                        updateOutput(index, { enabled: e.target.value === "enabled" })
                      }
                      className="select"
                    >
                      <option value="enabled">Enabled</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </div>

                  {/* Primary */}
                  {output.enabled && (
                    <div>
                      <label
                        htmlFor={`primary-${index}`}
                        className="block text-sm font-medium text-catppuccin-subtext mb-2 flex items-center gap-2"
                      >
                        <Star className="w-4 h-4" />
                        Primary Display
                      </label>
                      <select
                        id={`primary-${index}`}
                        value={output.primary ? "true" : "false"}
                        onChange={(e) =>
                          updateOutput(index, { primary: e.target.value === "true" })
                        }
                        className="select"
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </div>
                  )}

                  {/* Rotation */}
                  {output.enabled && (
                    <div>
                      <label
                        htmlFor={`rotation-${index}`}
                        className="block text-sm font-medium text-catppuccin-subtext mb-2 flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
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
                        className="select"
                      >
                        <option value="normal">Normal (0°)</option>
                        <option value="left">Left (90°)</option>
                        <option value="right">Right (270°)</option>
                        <option value="inverted">Inverted (180°)</option>
                      </select>
                    </div>
                  )}

                  {/* Mode */}
                  {output.enabled && (
                    <div>
                      <label
                        htmlFor={`mode-${index}`}
                        className="block text-sm font-medium text-catppuccin-subtext mb-2 flex items-center gap-2"
                      >
                        <Maximize2 className="w-4 h-4" />
                        Resolution & Refresh
                      </label>
                      <input
                        id={`mode-${index}`}
                        type="text"
                        value={output.mode || ""}
                        onChange={(e) => updateOutput(index, { mode: e.target.value })}
                        placeholder="e.g., 1920x1080@60"
                        className="input"
                        title="Format: WIDTHxHEIGHT@REFRESH (e.g., 1920x1080@60)"
                      />
                      <p className="text-xs text-catppuccin-overlay mt-1">
                        Format: WIDTH×HEIGHT@REFRESH
                      </p>
                    </div>
                  )}

                  {/* Position */}
                  {output.enabled && output.position && (
                    <>
                      <div>
                        <label
                          htmlFor={`pos-x-${index}`}
                          className="block text-sm font-medium text-catppuccin-subtext mb-2 flex items-center gap-2"
                        >
                          <Move className="w-4 h-4" />
                          Position X (px)
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
                          className="input"
                          title="Horizontal position in pixels"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`pos-y-${index}`}
                          className="block text-sm font-medium text-catppuccin-subtext mb-2 flex items-center gap-2"
                        >
                          <Move className="w-4 h-4 rotate-90" />
                          Position Y (px)
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
                          className="input"
                          title="Vertical position in pixels"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

export default MainPanel;
