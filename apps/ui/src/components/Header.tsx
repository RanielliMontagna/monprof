import { Monitor, Save } from "lucide-react";

interface HeaderProps {
  onSaveClick: () => void;
}

function Header({ onSaveClick }: HeaderProps) {
  return (
    <header className="bg-catppuccin-mantle border-b border-catppuccin-surface1 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2 sm:gap-3">
        <Monitor className="w-5 h-5 sm:w-6 sm:h-6 text-catppuccin-blue flex-shrink-0" />
        <h1 className="text-lg sm:text-xl font-semibold text-catppuccin-text">Monprof</h1>
        <span className="text-xs sm:text-sm text-catppuccin-overlay hidden sm:inline">
          Monitor Profiles
        </span>
      </div>
      <button
        type="button"
        onClick={onSaveClick}
        className="btn btn-primary flex items-center gap-1.5 sm:gap-2 group text-sm sm:text-base px-3 sm:px-4"
        title="Save your current display configuration as a new profile"
      >
        <Save className="w-4 h-4 transition-transform group-hover:scale-110 flex-shrink-0" />
        <span className="hidden sm:inline">Save Current Layout</span>
        <span className="sm:hidden">Save</span>
      </button>
    </header>
  );
}

export default Header;
