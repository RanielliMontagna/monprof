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

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const data = await window.monprof.list();
      setProfiles(data);
      if (!selectedProfile && Object.keys(data).length > 0) {
        setSelectedProfile(Object.keys(data)[0] || null);
      }
    } catch (error) {
      console.error("Failed to load profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyProfile = async (name: string) => {
    try {
      await window.monprof.apply(name);
    } catch (error) {
      console.error(`Failed to apply profile ${name}:`, error);
      alert(`Failed to apply profile: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleSaveProfile = async (name: string) => {
    try {
      await window.monprof.save(name);
      await loadProfiles();
      setSelectedProfile(name);
      setShowSaveModal(false);
    } catch (error) {
      console.error(`Failed to save profile ${name}:`, error);
      alert(`Failed to save profile: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleUpdateProfile = async (name: string, profile: Profile) => {
    try {
      await window.monprof.update({ name, profile });
      await loadProfiles();
      setSelectedProfile(name);
    } catch (error) {
      console.error(`Failed to update profile ${name}:`, error);
      alert(`Failed to update profile: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  if (loading) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Header onSaveClick={() => setShowSaveModal(true)} />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
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
