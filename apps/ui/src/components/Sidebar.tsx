import { Monitor, Play } from "lucide-react";
import type { Profile } from "../types";

interface SidebarProps {
  profiles: Record<string, Profile>;
  selectedProfile: string | null;
  onSelect: (name: string) => void;
  onApply: (name: string) => void;
}

function Sidebar({ profiles, selectedProfile, onSelect, onApply }: SidebarProps) {
  const profileNames = Object.keys(profiles);

  if (profileNames.length === 0) {
    return (
      <aside className="w-64 md:w-80 bg-catppuccin-mantle border-r border-catppuccin-surface1 p-6 flex flex-col items-center justify-center min-h-0">
        <Monitor className="w-16 h-16 text-catppuccin-overlay mb-4 opacity-50" />
        <p className="text-catppuccin-subtext text-sm text-center mb-2">No profiles yet</p>
        <p className="text-catppuccin-overlay text-xs text-center">
          Save your current display configuration to get started
        </p>
      </aside>
    );
  }

  return (
    <aside className="w-64 md:w-80 bg-catppuccin-mantle border-r border-catppuccin-surface1 flex flex-col min-w-0">
      <div className="p-4 border-b border-catppuccin-surface1">
        <h2 className="text-sm font-semibold text-catppuccin-text uppercase tracking-wide">
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
                <div
                  className={`
                    group relative p-3 rounded-lg cursor-pointer transition-all duration-200
                    ${
                      isSelected
                        ? "bg-catppuccin-blue/20 border-2 border-catppuccin-blue shadow-md shadow-catppuccin-blue/10"
                        : "bg-catppuccin-surface0 border border-catppuccin-surface1 hover:bg-catppuccin-surface1 hover:border-catppuccin-surface2"
                    }
                  `}
                  onClick={() => onSelect(name)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(name);
                    }
                  }}
                  role="button"
                  tabIndex={0}
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
                      <span>Apply</span>
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

export default Sidebar;
