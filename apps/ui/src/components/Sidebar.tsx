import type { Profile } from "../types";

interface SidebarProps {
  profiles: Record<string, Profile>;
  selectedProfile: string | null;
  onSelect: (name: string) => void;
  onApply: (name: string) => void;
}

function Sidebar({ profiles, selectedProfile, onSelect, onApply }: SidebarProps) {
  const profileNames = Object.keys(profiles);

  const handleRightClick = (e: React.MouseEvent, name: string) => {
    e.preventDefault();
    // TODO: Show context menu for edit/delete
    console.log("Right-click on profile:", name);
  };

  if (profileNames.length === 0) {
    return (
      <aside
        style={{
          width: "250px",
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border)",
          padding: "1rem",
        }}
      >
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          No profiles yet. Save a profile to get started.
        </p>
      </aside>
    );
  }

  return (
    <aside
      style={{
        width: "250px",
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)",
        padding: "1rem",
        overflowY: "auto",
      }}
    >
      <h2 style={{ fontSize: "1rem", marginBottom: "1rem", fontWeight: 600 }}>Profiles</h2>
      <ul style={{ listStyle: "none" }}>
        {profileNames.map((name) => (
          <li key={name} style={{ marginBottom: "0.5rem" }}>
            <div
              style={{
                background: selectedProfile === name ? "var(--bg-tertiary)" : "transparent",
                padding: "0.75rem",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border:
                  selectedProfile === name ? "1px solid var(--accent)" : "1px solid transparent",
              }}
              onClick={() => onSelect(name)}
              onContextMenu={(e) => handleRightClick(e, name)}
            >
              <span style={{ fontWeight: selectedProfile === name ? 600 : 400 }}>{name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onApply(name);
                }}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.5rem",
                  background: "var(--accent)",
                }}
              >
                Apply
              </button>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default Sidebar;
