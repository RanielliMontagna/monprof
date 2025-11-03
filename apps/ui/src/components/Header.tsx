import { Monitor, Save } from "lucide-react";

interface HeaderProps {
  onSaveClick: () => void;
}

function Header({ onSaveClick }: HeaderProps) {
  return (
    <header className="bg-catppuccin-mantle border-b border-catppuccin-surface1 px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <Monitor className="w-6 h-6 text-catppuccin-blue" />
        <h1 className="text-xl font-semibold text-catppuccin-text">Monprof</h1>
        <span className="text-sm text-catppuccin-overlay">Monitor Profiles</span>
      </div>
      <button
        type="button"
        onClick={onSaveClick}
        className="btn btn-primary flex items-center gap-2 group"
        title="Save your current display configuration as a new profile"
      >
        <Save className="w-4 h-4 transition-transform group-hover:scale-110" />
        <span>Save Current Layout</span>
      </button>
    </header>
  );
}

export default Header;
