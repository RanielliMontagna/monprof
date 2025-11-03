interface HeaderProps {
  onSaveClick: () => void;
}

function Header({ onSaveClick }: HeaderProps) {
  return (
    <header
      style={{
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border)",
        padding: "1rem 1.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Monprof</h1>
      <button type="button" onClick={onSaveClick}>
        Save current KDE layout as...
      </button>
    </header>
  );
}

export default Header;
