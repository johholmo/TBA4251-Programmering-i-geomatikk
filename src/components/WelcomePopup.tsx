import { useState } from "react";
import Popup from "./Popup";
import Tour from "./ToolTour";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAfterTour?: () => void; // valgfritt: hva skjer etter tour?
};

const steps = [
  { anchorId: "tool-upload",    text: "Importer GeoJSON (eller bruk demo) for å begynne." },
  { anchorId: "tool-buffer",    text: "Lag buffer i meter rundt objekter (f.eks. 200 m fra vann)." },
  { anchorId: "tool-intersect", text: "Behold kun overlapp mellom to lag." },
  { anchorId: "tool-union",     text: "Slå sammen geometrier fra flere lag." },
  { anchorId: "tool-diff",      text: "A minus B for å fjerne uønskede områder." },
  { anchorId: "tool-clip",      text: "Klipp et lag til et studieområde." },
];


export default function WelcomePopup({ isOpen, onClose, onAfterTour }: Props) {
  const [showTour, setShowTour] = useState(false);

  return (
    <>
      <Popup
        isOpen={isOpen && !showTour}  // skjul velkomst mens tour vises
        onClose={onClose}
        title="Velkommen til walkthrough"
        step={1}
        totalSteps={9}
        highlightColor="var(--brand)"
        actions={[
          {
            label: "Vis verktøy-intro",
            variant: "secondary",
            onClick: () => setShowTour(true),
          },
          {
            label: "Start oppgave",
            variant: "primary",
            onClick: onClose,
          },
        ]}
      >
        <p>I denne guiden finner du trygge områder for ny bebyggelse i Trondheim.</p>
        <p>Klikk <b>Start oppgave</b> for å begynne, eller <b>Vis verktøy-intro</b> for en kort omvisning.</p>
      </Popup>

      <Tour
        open={showTour}
        steps={steps}
        onClose={() => setShowTour(false)}
        onComplete={() => {
          setShowTour(false);
          onAfterTour?.();  // f.eks. åpne “StartTasksPopup” fra App
        }}
      />
    </>
  );
}
