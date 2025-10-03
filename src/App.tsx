import { useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Popup from "./components/Popup";

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true);

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

      {/* Gjenbrukbar popup – velkomst/walkthrough-start */}
      <Popup
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
        title="Velkommen til walkthrough"
        step={1}
        totalSteps={9}
        highlightColor="var(--brand)"
        hintContent={
          <ul>
            <li>Du kan alltid se fremdriften øverst.</li>
            <li>Bruk verktøylinjen for å løse hvert steg.</li>
            <li>Tips: Slå av/på lag i sidepanelet.</li>
          </ul>
        }
        actions={[
          {
            label: "Vis verktøy-intro",
            variant: "secondary",
            onClick: () => alert("Coachmarks kommer her i neste iterasjon ✨"),
          },
          {
            label: "Start oppgave",
            variant: "primary",
            onClick: () => setShowWelcome(false),
          },
        ]}
      >
        <p>
          I denne guiden finner du trygge områder for ny bebyggelse i Trondheim ved
          å bruke GIS-verktøy steg for steg.
        </p>
        <p>
          Klikk <b>Start oppgave</b> for å begynne, eller <b>Vis verktøy-intro</b> for en
          kort omvisning i menyen.
        </p>
      </Popup>
    </div>
  );
}
