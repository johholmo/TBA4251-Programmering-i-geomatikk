import { useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Welcome from "./components/popup/Welcome";
import Task1 from "./components/popup/Task1";
import Task2 from "./components/popup/Task2";
import Task3 from "./components/popup/Task3";
import Task4 from "./components/popup/Task4";
import Task5 from "./components/popup/Task5";
import Task6 from "./components/popup/Task6";
import Task7 from "./components/popup/Task7";
import Task8 from "./components/popup/Task8";
import Task9 from "./components/popup/Task9";
import Task10 from "./components/popup/Task10";
import Done from "./components/popup/Done";
import UploadData from "./components/tools/UploadData";
import Map from "./components/Map";
import Clip from "./components/tools/Clip";
import Buffer from "./components/tools/Buffer";
import Intersect from "./components/tools/Intersect";
import Union from "./components/tools/Union";
import Difference from "./components/tools/Difference";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

type TaskKey =
  | "task1"
  | "task2"
  | "task3"
  | "task4"
  | "task5"
  | "task6"
  | "task7"
  | "task8"
  | "task9"
  | "task10"
  | null;

export default function App() {
  // UI-åpning/lukking
  const [showWelcome, setShowWelcome] = useState(true);
  const [showTour, setShowTour] = useState(false);

  const [showTask1Intro, setShowTask1Intro] = useState(false);
  const [showTask2Intro, setShowTask2Intro] = useState(false);
  const [showTask3Intro, setShowTask3Intro] = useState(false);
  const [showTask4Intro, setShowTask4Intro] = useState(false);
  const [showTask5Intro, setShowTask5Intro] = useState(false);
  const [showTask6Intro, setShowTask6Intro] = useState(false);
  const [showTask7Intro, setShowTask7Intro] = useState(false);
  const [showTask8Intro, setShowTask8Intro] = useState(false);
  const [showTask9Intro, setShowTask9Intro] = useState(false);
  const [showTask10Intro, setShowTask10Intro] = useState(false);

  const [showUpload, setShowUpload] = useState(false);
  const [showClipTool, setShowClipTool] = useState(false);
  const [showBuffer, setShowBuffer] = useState(false);
  const [showIntersect, setShowIntersect] = useState(false);
  const [showUnion, setShowUnion] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  const [lastTask, setLastTask] = useState<TaskKey>(null);
  const [hasUploaded, setHasUploaded] = useState(false);

  const [showDone, setShowDone] = useState(false);

  // Åpne oppgaver
  const openTask1 = () => {
    setShowTask1Intro(true);
    setLastTask("task1");
  };
  const openTask2 = () => {
    setShowTask2Intro(true);
    setLastTask("task2");
  };
  const openTask3 = () => {
    setShowTask3Intro(true);
    setLastTask("task3");
  };
  const openTask4 = () => {
    setShowTask4Intro(true);
    setLastTask("task4");
  };
  const openTask5 = () => {
    setShowTask5Intro(true);
    setLastTask("task5");
  };
  const openTask6 = () => {
    setShowTask6Intro(true);
    setLastTask("task6");
  };
  const openTask7 = () => {
    setShowTask7Intro(true);
    setLastTask("task7");
  };
  const openTask8 = () => {
    setShowTask8Intro(true);
    setLastTask("task8");
  };
  const openTask9 = () => {
    setShowTask9Intro(true);
    setLastTask("task9");
  };
  const openTask10 = () => {
    setShowTask10Intro(true);
    setLastTask("task10");
  };

  // Åpne annet
  const openWelcome = () => setShowWelcome(true);
  const openUpload = () => setShowUpload(true);
  const openClipTool = () => setShowClipTool(true);
  const openBuffer = () => setShowBuffer(true);
  const openIntersect = () => setShowIntersect(true);
  const openUnion = () => setShowUnion(true);
  const openDiff = () => setShowDiff(true);
  const openDone = () => {
    setShowDone(true);
    setLastTask(null);
  };

  // Lukke oppgaver
  const closeTask1 = () => setShowTask1Intro(false);
  const closeTask2 = () => setShowTask2Intro(false);
  const closeTask3 = () => setShowTask3Intro(false);
  const closeTask4 = () => setShowTask4Intro(false);
  const closeTask5 = () => setShowTask5Intro(false);
  const closeTask6 = () => setShowTask6Intro(false);
  const closeTask7 = () => setShowTask7Intro(false);
  const closeTask8 = () => setShowTask8Intro(false);
  const closeTask9 = () => setShowTask9Intro(false);
  const closeTask10 = () => setShowTask10Intro(false);

  // Lukke annet
  const closeWelcome = () => setShowWelcome(false);

  // “Neste oppgave”. openTaskX() setter lastTask = "taskX"
  const advanceFromTask1 = () => {
    setShowTask1Intro(false);
    openTask2();
  };
  const advanceFromTask2 = () => {
    setShowTask2Intro(false);
    openTask3();
  };
  const advanceFromTask3 = () => {
    setShowTask3Intro(false);
    openTask4();
  };
  const advanceFromTask4 = () => {
    setShowTask4Intro(false);
    openTask5();
  };
  const advanceFromTask5 = () => {
    setShowTask5Intro(false);
    openTask6();
  };
  const advanceFromTask6 = () => {
    setShowTask6Intro(false);
    openTask7();
  };
  const advanceFromTask7 = () => {
    setShowTask7Intro(false);
    openTask8();
  };
  const advanceFromTask8 = () => {
    setShowTask8Intro(false);
    openTask9();
  };
  const advanceFromTask9 = () => {
    setShowTask9Intro(false);
    openTask10();
  };
  const advanceFromTask10 = () => {
    setShowTask10Intro(false);
    openDone();
  };

  // Start på nytt - reset alt
  // TODO: Også slette alle datalag i Map
  const advanceFromDone = () => {
    setShowDone(false);
    setHasUploaded(false);
    setLastTask(null);
    setShowWelcome(true);
  };

  // “Pågående oppgave”:
  const handleCurrentTaskClick = () => {
    switch (lastTask) {
      case "task1":
        return openTask1();
      case "task2":
        return openTask2();
      case "task3":
        return openTask3();
      case "task4":
        return openTask4();
      case "task5":
        return openTask5();
      case "task6":
        return openTask6();
      case "task7":
        return openTask7();
      case "task8":
        return openTask8();
      case "task9":
        return openTask9();
      case "task10":
        return openTask10();
      default:
        return openWelcome();
    }
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="brand">
          <span className="logo-dot" aria-hidden /> Klimarisiko GIS
        </div>
        <Navbar
          onUploadClick={openUpload}
          onCurrentTaskClick={handleCurrentTaskClick}
          onOpenClipTool={openClipTool}
          onOpenBufferTool={openBuffer}
          onOpenDiffTool={openDiff}
          onOpenIntersectTool={openIntersect}
          onOpenUnionTool={openUnion}
        />
      </header>

      <aside className="app-sidebar">
        <Sidebar />
      </aside>

      <main className="app-main">
        <Map />
      </main>

      {/* Welcome */}
      <Welcome
        isOpen={showWelcome}
        onClose={closeWelcome}
        onAfterTour={() => {
          setShowTour(false);
          setShowWelcome(false); // ensure Welcome is closed after tour
          openTask1();
        }}
        onStartTasks={() => {
          closeWelcome();
          openTask1();
        }}
        onStartTour={() => {
          setShowTour(true);
          setShowWelcome(false);
        }}
      />

      {/* Task popups */}
      <Task1 isOpen={showTask1Intro} onClose={closeTask1} onAdvance={advanceFromTask1} />
      <Task2 isOpen={showTask2Intro} onClose={closeTask2} onAdvance={advanceFromTask2} />
      <Task3 isOpen={showTask3Intro} onClose={closeTask3} onAdvance={advanceFromTask3} />
      <Task4 isOpen={showTask4Intro} onClose={closeTask4} onAdvance={advanceFromTask4} />
      <Task5 isOpen={showTask5Intro} onClose={closeTask5} onAdvance={advanceFromTask5} />
      <Task6 isOpen={showTask6Intro} onClose={closeTask6} onAdvance={advanceFromTask6} />
      <Task7 isOpen={showTask7Intro} onClose={closeTask7} onAdvance={advanceFromTask7} />
      <Task8 isOpen={showTask8Intro} onClose={closeTask8} onAdvance={advanceFromTask8} />
      <Task9 isOpen={showTask9Intro} onClose={closeTask9} onAdvance={advanceFromTask9} />
      <Task10 isOpen={showTask10Intro} onClose={closeTask10} onAdvance={advanceFromTask10} />

      <Done isOpen={showDone} onClose={() => setShowDone(false)} onAdvance={advanceFromDone} />

      {/* Ikke-task popups */}
      <UploadData
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUploaded={() => {
          setHasUploaded(true);
          setShowUpload(false);
          setShowTask1Intro(false);
          openTask2();
        }}
      />

      <Clip isOpen={showClipTool} onClose={() => setShowClipTool(false)} />

      <Buffer isOpen={showBuffer} onClose={() => setShowBuffer(false)} />

      <Intersect isOpen={showIntersect} onClose={() => setShowIntersect(false)} />

      <Union isOpen={showUnion} onClose={() => setShowUnion(false)} />

      <Difference isOpen={showDiff} onClose={() => setShowDiff(false)} />
    </div>
  );
}
