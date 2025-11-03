import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import Header from "./components/Header";
import MainPanel from "./components/MainPanel";
import SaveModal from "./components/SaveModal";
import Sidebar from "./components/Sidebar";
import type { Profile } from "./types";

function App() {
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.monprof) {
      loadProfiles();
    } else {
      console.warn("Monprof API not available. Running outside Electron?");
      setError("Monprof API not available. Please run this application in Electron.");
      setLoading(false);
    }
  }, []);

  const loadProfiles = async () => {
    if (!window.monprof) {
      setError("Monprof API not available");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await window.monprof.list();
      setProfiles(data);
      if (!selectedProfile && Object.keys(data).length > 0) {
        setSelectedProfile(Object.keys(data)[0] || null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load profiles";
      setError(errorMessage);
      console.error("Failed to load profiles:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyProfile = async (name: string) => {
    if (!window.monprof) {
      alert("Monprof API not available");
      return;
    }

    try {
      await window.monprof.apply(name);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`Failed to apply profile ${name}:`, err);
      alert(`Failed to apply profile: ${errorMessage}`);
    }
  };

  const handleSaveProfile = async (name: string) => {
    if (!window.monprof) {
      alert("Monprof API not available");
      return;
    }

    try {
      await window.monprof.save(name);
      await loadProfiles();
      setSelectedProfile(name);
      setShowSaveModal(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`Failed to save profile ${name}:`, err);
      alert(`Failed to save profile: ${errorMessage}`);
    }
  };

  const handleUpdateProfile = async (name: string, profile: Profile) => {
    if (!window.monprof) {
      alert("Monprof API not available");
      return;
    }

    try {
      await window.monprof.update({ name, profile });
      await loadProfiles();
      setSelectedProfile(name);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`Failed to update profile ${name}:`, err);
      alert(`Failed to update profile: ${errorMessage}`);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-catppuccin-base">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-catppuccin-blue animate-spin mx-auto mb-4" />
          <p className="text-catppuccin-subtext">Loading profiles...</p>
        </div>
      </div>
    );
  }

  if (error && Object.keys(profiles).length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-catppuccin-base p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-catppuccin-red mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-catppuccin-text mb-2">
            Error Loading Profiles
          </h2>
          <p className="text-catppuccin-subtext mb-4">{error}</p>
          <button type="button" onClick={loadProfiles} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-catppuccin-base">
      <Header onSaveClick={() => setShowSaveModal(true)} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          profiles={profiles}
          selectedProfile={selectedProfile}
          onSelect={setSelectedProfile}
          onApply={handleApplyProfile}
        />
        <MainPanel
          profileName={selectedProfile}
          profile={selectedProfile ? profiles[selectedProfile] || null : null}
          onUpdate={handleUpdateProfile}
          onSaveAsCurrent={() => setShowSaveModal(true)}
        />
      </div>
      {showSaveModal && (
        <SaveModal
          onClose={() => setShowSaveModal(false)}
          onSave={handleSaveProfile}
          existingNames={Object.keys(profiles)}
        />
      )}
    </div>
  );
}

export default App;
