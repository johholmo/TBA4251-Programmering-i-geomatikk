import { useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import WelcomePopup from "./components/popup/Welcome";
import Task1IntroPopup from "./components/popup/Task1";
import UploadDataPopup from "./components/popup/UploadData";
import Tour from "./components/ToolTour";
import 'leaflet/dist/leaflet.css';
import Map from "./components/Map";


type ModalKey = "welcome" | "task1" | "upload" | null;

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [showTour, setShowTour] = useState(false);
  const [showTask1Intro, setShowTask1Intro] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const [lastModal, setLastModal] = useState<ModalKey>("welcome");

  // Openers that ALSO record the last modal:
  const openWelcome = () => { setShowWelcome(true); setLastModal("welcome"); };
  const openTask1   = () => { setShowTask1Intro(true); setLastModal("task1"); };
  const openUpload  = () => { setShowUpload(true); setLastModal("upload"); };

  const closeWelcome = () => setShowWelcome(false);
  const closeTask1   = () => setShowTask1Intro(false);
  const closeUpload  = () => setShowUpload(false);

  // Pågående oppgave knappen skal vise til siste åpne popup
  const handleCurrentTaskClick = () => {
    switch (lastModal) {
      case "welcome": openWelcome(); break;
      case "task1":   openTask1();   break;
      case "upload":  openUpload();  break;
      default:        openWelcome();
    }
  };

  const handleLayersLoaded = (layers: { name: string; data: any }[]) => {
    alert(`Lastet ${layers.length} lag:\n- ${layers.map(l => l.name).join("\n- ")}`);
    closeUpload();
  };

  // TODO: Update text here
  const steps = [
    { anchorId: "tool-upload",    text: "Importer GeoJSON for å begynne." },
    { anchorId: "tool-buffer",    text: "Lag buffer i meter rundt objekter (f.eks. 200 m fra vann)." },
    { anchorId: "tool-intersect", text: "Behold kun overlapp mellom to lag." },
    { anchorId: "tool-union",     text: "Slå sammen geometrier fra flere lag." },
    { anchorId: "tool-diff",      text: "A minus B for å fjerne uønskede områder." },
    { anchorId: "tool-clip",      text: "Klipp et lag til et studieområde." },
    { anchorId: "tool-task",      text: "Her ser du alltid hvilken oppgave du er på." },
  ];

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="brand">
          <span className="logo-dot" aria-hidden /> Klimarisiko GIS
        </div>
        <Navbar
          onUploadClick={openUpload}
          onCurrentTaskClick={handleCurrentTaskClick}
        />
      </header>

      <aside className="app-sidebar">
        <Sidebar />
      </aside>

      

      {/* Map */}
      <main className="app-main">
        <Map />
      </main>


      {/* Welcome */}
      <WelcomePopup
        isOpen={showWelcome}
        onClose={() => { closeWelcome(); }}
        onAfterTour={() => { setShowTour(false); openTask1(); }}
        onStartTasks={() => { closeWelcome(); openTask1(); }}
        onStartTour={() => { setShowTour(true); setShowWelcome(false); }}
      />

      {/* Tool Tour */}
      <Tour
        open={showTour}
        steps={steps}
        onClose={() => setShowTour(false)}
        onComplete={() => { setShowTour(false); openTask1(); }}
      />

      {/* Task 1 intro */}
      <Task1IntroPopup
        isOpen={showTask1Intro}
        onClose={closeTask1}
      />

      {/* Upload */}
      <UploadDataPopup
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
      />

    </div>
  );
}
