import { useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Map from "./components/map/Map";
import { Toast } from "./components/CustomToastProvider";
import Clip from "./components/tools/Clip";
import Upload from "./components/tools/Upload";
import Buffer from "./components/tools/Buffer";
import Union from "./components/tools/Union";
import Intersect from "./components/tools/Intersect";
import Difference from "./components/tools/Difference";
import AreaFilter from "./components/tools/AreaFilter";
import FeatureExtractor from "./components/tools/FeatureExtractor";
import { LayersProvider } from "./context/LayersContext";
import Welcome from "./components/tasks/Welcome";
import Task1 from "./components/tasks/Task1";
import Task2 from "./components/tasks/Task2";
import Task3 from "./components/tasks/Task3";
import Task4 from "./components/tasks/Task4";
import Task5 from "./components/tasks/Task5";
import Task6 from "./components/tasks/Task6";
import Task7 from "./components/tasks/Task7";
import Task8 from "./components/tasks/Task8";
import Task9 from "./components/tasks/Task9";
import Task10 from "./components/tasks/Task10";
import Task11 from "./components/tasks/Task11";
import Done from "./components/tasks/Done";
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
  | "task11"
  | "done"
  | null;

const taskOrder: TaskKey[] = [
  "task1",
  "task2",
  "task3",
  "task4",
  "task5",
  "task6",
  "task7",
  "task8",
  "task9",
  "task10",
  "task11",
];

export default function App() {
  const [resetKey, setResetKey] = useState(0);
  // Show welcome, tour, tasks and done
  const [showWelcome, setShowWelcome] = useState(true);
  const [, setShowTour] = useState(false);
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
  const [showTask11Intro, setShowTask11Intro] = useState(false);
  const [lastTask, setLastTask] = useState<TaskKey>(null);
  const [showDone, setShowDone] = useState(false);

  // Show tools
  const [showUpload, setShowUpload] = useState(false);
  const [showClip, setShowClip] = useState(false);
  const [showBuffer, setShowBuffer] = useState(false);
  const [showUnion, setShowUnion] = useState(false);
  const [showIntersect, setShowIntersect] = useState(false);
  const [showDifference, setShowDifference] = useState(false);
  const [showAreaFilter, setShowAreaFilter] = useState(false);
  const [showFeatureExtractor, setShowFeatureExtractor] = useState(false);

  // forrige oppgave
  const goBack = () => {
    if (!lastTask) return;

    const index = taskOrder.indexOf(lastTask);
    if (index <= 0) return; // task1 har ingen forrige

    const prev = taskOrder[index - 1];

    // Lukk nåværende oppgave
    switch (lastTask) {
      case "task1":
        setShowTask1Intro(false);
        break;
      case "task2":
        setShowTask2Intro(false);
        break;
      case "task3":
        setShowTask3Intro(false);
        break;
      case "task4":
        setShowTask4Intro(false);
        break;
      case "task5":
        setShowTask5Intro(false);
        break;
      case "task6":
        setShowTask6Intro(false);
        break;
      case "task7":
        setShowTask7Intro(false);
        break;
      case "task8":
        setShowTask8Intro(false);
        break;
      case "task9":
        setShowTask9Intro(false);
        break;
      case "task10":
        setShowTask10Intro(false);
        break;
      case "task11":
        setShowTask11Intro(false);
        break;
    }

    // Åpne forrige oppgave
    switch (prev) {
      case "task1":
        setShowTask1Intro(true);
        break;
      case "task2":
        setShowTask2Intro(true);
        break;
      case "task3":
        setShowTask3Intro(true);
        break;
      case "task4":
        setShowTask4Intro(true);
        break;
      case "task5":
        setShowTask5Intro(true);
        break;
      case "task6":
        setShowTask6Intro(true);
        break;
      case "task7":
        setShowTask7Intro(true);
        break;
      case "task8":
        setShowTask8Intro(true);
        break;
      case "task9":
        setShowTask9Intro(true);
        break;
      case "task10":
        setShowTask10Intro(true);
        break;
      case "task11":
        setShowTask11Intro(true);
        break;
    }

    setLastTask(prev);
  };

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
  const openTask11 = () => {
    setShowTask10Intro(true);
    setLastTask("task11");
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
  const closeTask11 = () => setShowTask11Intro(false);

  // Videre til neste oppgave
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
    openTask11();
  };
  const advanceFromTask11 = () => {
    setShowTask11Intro(false);
    setShowDone(true);
    setLastTask("done");
  };

  const advanceFromDone = () => {
    setShowDone(false);
    setLastTask(null);
    setShowWelcome(true);
    setResetKey((k) => k + 1);
  };

  // Pågånde oppgave knapp øverst til høyre
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
      case "task11":
        return openTask11();
      case "done":
        return setShowDone(true);
      default:
        return setShowWelcome(true);
    }
  };

  return (
    <Toast>
      <LayersProvider key={resetKey}>
        <div className="app-root">
          <header className="app-header">
            <div className="brand">
              <span className="logo-dot" aria-hidden /> MyGIS
            </div>

            {/* Navbar */}
            <Navbar
              onUploadClick={() => setShowUpload(true)}
              onCurrentTaskClick={handleCurrentTaskClick}
              onOpenClipTool={() => setShowClip(true)}
              onOpenBufferTool={() => {
                setShowBuffer(true);
              }}
              onOpenDiffTool={() => setShowDifference(true)}
              onOpenIntersectTool={() => setShowIntersect(true)}
              onOpenUnionTool={() => setShowUnion(true)}
              onOpenAreaFilterTool={() => setShowAreaFilter(true)}
              onOpenFeatureExtractorTool={() => setShowFeatureExtractor(true)}
            />
          </header>

          {/* Sidebar */}
          <aside className="app-sidebar">
            <Sidebar />
          </aside>

          {/* Kart */}
          <main className="app-main">
            <Map />
          </main>

          {/* Popups for verktøy*/}
          <Upload isOpen={showUpload} onClose={() => setShowUpload(false)} />
          <Clip isOpen={showClip} onClose={() => setShowClip(false)} />
          <Buffer isOpen={showBuffer} onClose={() => setShowBuffer(false)} />
          <Union isOpen={showUnion} onClose={() => setShowUnion(false)} />
          <Intersect isOpen={showIntersect} onClose={() => setShowIntersect(false)} />
          <Difference isOpen={showDifference} onClose={() => setShowDifference(false)} />
          <AreaFilter isOpen={showAreaFilter} onClose={() => setShowAreaFilter(false)} />
          <FeatureExtractor
            isOpen={showFeatureExtractor}
            onClose={() => setShowFeatureExtractor(false)}
          />

          {/* Velkomst popup og gjennomgang av verktøy*/}
          <Welcome
            isOpen={showWelcome}
            onClose={() => setShowWelcome(false)}
            onAfterTour={() => {
              setShowTour(false);
              setShowWelcome(false);
              openTask1();
            }}
            onStartTasks={() => {
              setShowWelcome(false);
              openTask1();
            }}
            onStartTour={() => {
              setShowTour(true);
              setShowWelcome(false);
            }}
          />

          {/* Tasks */}
          <Task1 isOpen={showTask1Intro} onClose={closeTask1} onAdvance={advanceFromTask1} />
          <Task2
            isOpen={showTask2Intro}
            onClose={closeTask2}
            onBack={goBack}
            onAdvance={advanceFromTask2}
          />
          <Task3
            isOpen={showTask3Intro}
            onClose={closeTask3}
            onBack={goBack}
            onAdvance={advanceFromTask3}
          />
          <Task4
            isOpen={showTask4Intro}
            onClose={closeTask4}
            onBack={goBack}
            onAdvance={advanceFromTask4}
          />
          <Task5
            isOpen={showTask5Intro}
            onClose={closeTask5}
            onBack={goBack}
            onAdvance={advanceFromTask5}
          />
          <Task6
            isOpen={showTask6Intro}
            onClose={closeTask6}
            onBack={goBack}
            onAdvance={advanceFromTask6}
          />
          <Task7
            isOpen={showTask7Intro}
            onClose={closeTask7}
            onBack={goBack}
            onAdvance={advanceFromTask7}
          />
          <Task8
            isOpen={showTask8Intro}
            onClose={closeTask8}
            onBack={goBack}
            onAdvance={advanceFromTask8}
          />
          <Task9
            isOpen={showTask9Intro}
            onClose={closeTask9}
            onBack={goBack}
            onAdvance={advanceFromTask9}
          />
          <Task10
            isOpen={showTask10Intro}
            onClose={closeTask10}
            onBack={goBack}
            onAdvance={advanceFromTask10}
          />
          <Task11
            isOpen={showTask11Intro}
            onClose={closeTask11}
            onBack={goBack}
            onAdvance={advanceFromTask11}
          />

          <Done isOpen={showDone} onClose={() => setShowDone(false)} onAdvance={advanceFromDone} />
        </div>
      </LayersProvider>
    </Toast>
  );
}
