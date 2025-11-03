import { Monitor, Play, Trash2 } from "lucide-react";
import { useState } from "react";
import DeleteConfirmModal from "./DeleteConfirmModal";
import type { Profile } from "../types";

interface SidebarProps {
  profiles: Record<string, Profile>;
  selectedProfile: string | null;
  onSelect: (name: string) => void;
  onApply: (name: string) => void;
  onDelete: (name: string) => void;
}

function Sidebar({ profiles, selectedProfile, onSelect, onApply, onDelete }: SidebarProps) {
  const profileNames = Object.keys(profiles);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  if (profileNames.length === 0) {
    return (
      <>
        <aside className="w-full sm:w-64 md:w-80 bg-catppuccin-mantle border-r border-catppuccin-surface1 p-6 flex flex-col items-center justify-center min-h-0 hidden sm:flex">
          <Monitor className="w-16 h-16 text-catppuccin-overlay mb-4 opacity-50" />
          <p className="text-catppuccin-subtext text-sm text-center mb-2">No profiles yet</p>
          <p className="text-catppuccin-overlay text-xs text-center">
            Save your current display configuration to get started
          </p>
        </aside>
        <div className="sm:hidden p-4 text-center">
          <Monitor className="w-12 h-12 text-catppuccin-overlay mb-3 opacity-50 mx-auto" />
          <p className="text-catppuccin-subtext text-sm mb-1">No profiles yet</p>
          <p className="text-catppuccin-overlay text-xs">
            Save your current display configuration to get started
          </p>
        </div>
      </>
    );
  }

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDelete(deleteTarget);
      setDeleteTarget(null);
      if (selectedProfile === deleteTarget) {
        // If deleted profile was selected, clear selection
        const remaining = profileNames.filter((n) => n !== deleteTarget);
        if (remaining.length > 0) {
          onSelect(remaining[0]);
        }
      }
    }
  };

  return (
    <>
      <aside className="w-full sm:w-64 md:w-80 bg-catppuccin-mantle border-r border-catppuccin-surface1 flex flex-col min-w-0 hidden sm:flex">
        <div className="p-3 sm:p-4 border-b border-catppuccin-surface1">
          <h2 className="text-xs sm:text-sm font-semibold text-catppuccin-text uppercase tracking-wide">
            Profiles ({profileNames.length})
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-2">
            {profileNames.map((name) => {
              const isSelected = selectedProfile === name;
              const outputCount = profiles[name]?.outputs?.length || 0;

              return (
                <li key={name}>
                  <button
                    type="button"
                    className={`
                      group relative w-full text-left p-3 rounded-lg cursor-pointer transition-all duration-200
                      ${
                        isSelected
                          ? "bg-catppuccin-blue/20 border-2 border-catppuccin-blue shadow-md shadow-catppuccin-blue/10"
                          : "bg-catppuccin-surface0 border border-catppuccin-surface1 hover:bg-catppuccin-surface1 hover:border-catppuccin-surface2"
                      }
                    `}
                    onClick={() => onSelect(name)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3
                            className={`font-medium truncate ${
                              isSelected ? "text-catppuccin-blue" : "text-catppuccin-text"
                            }`}
                          >
                            {name}
                          </h3>
                        </div>
                        <p className="text-xs text-catppuccin-overlay">
                          {outputCount} {outputCount === 1 ? "display" : "displays"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onApply(name);
                          }}
                          className={`
                            btn btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5
                            opacity-0 group-hover:opacity-100 transition-opacity
                            ${isSelected ? "opacity-100" : ""}
                          `}
                          title={`Apply "${name}" profile to your displays`}
                        >
                          <Play className="w-3 h-3" />
                          <span className="hidden sm:inline">Apply</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(name);
                          }}
                          className={`
                            btn bg-catppuccin-red/10 hover:bg-catppuccin-red/20 text-catppuccin-red text-xs p-1.5 rounded
                            opacity-0 group-hover:opacity-100 transition-opacity
                            ${isSelected ? "opacity-100" : ""}
                          `}
                          title={`Delete "${name}" profile`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
      {deleteTarget && (
        <DeleteConfirmModal
          profileName={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}

export default Sidebar;
