import { useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import WelcomePopup from "./components/WelcomePopup";

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [showStartTasks, setShowStartTasks] = useState(false);

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="brand">
          <span className="logo-dot" aria-hidden /> Klimarisiko GIS
        </div>
        <Navbar />
      </header>

      

      <aside className="app-sidebar">
        <Sidebar />
      </aside>

      <main className="app-main">
        {/* Her kommer kartet senere (Leaflet/MapLibre).
           Inntil videre bare en placeholder. */}
        <div className="map-placeholder">
          <div>
            <h2>Kartområde</h2>
            <p>Her rendres kartet senere.</p>
          </div>
        </div>
      </main>

      <WelcomePopup
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
        onAfterTour={() => setShowStartTasks(true)} // valgfritt
      />

    </div>
  );
}
