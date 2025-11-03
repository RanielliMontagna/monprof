import { AlertTriangle, X } from "lucide-react";

interface DeleteConfirmModalProps {
  profileName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmModal({ profileName, onConfirm, onCancel }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-catppuccin-crust/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-catppuccin-base border-2 border-catppuccin-red rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-catppuccin-red/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-catppuccin-red" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-catppuccin-text mb-2">Delete Profile?</h3>
            <p className="text-sm text-catppuccin-subtext">
              Are you sure you want to delete the profile <strong>"{profileName}"</strong>? This
              action cannot be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex-shrink-0 text-catppuccin-overlay hover:text-catppuccin-text transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="btn btn-danger">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;
