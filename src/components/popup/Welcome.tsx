import { useState } from "react";
import Popup from "./Popup";
import Tour from "../ToolTour";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAfterTour?: () => void;
  onStartTasks?: () => void;
  onStartTour: () => void;
};

const steps = [
  { anchorId: "tool-upload", text: "Last opp datalag i GeoJSON format" },
  { anchorId: "tool-buffer", text: "Lag en buffer rundt objekter (f.eks. 200 m fra vann)." },
  { anchorId: "tool-intersect", text: "Behold kun overlappen mellom to datalag." },
  { anchorId: "tool-union", text: "Slå sammen flere datalag til ett." },
  { anchorId: "tool-diff", text: "Fjern et datalag fra et annet for å finne differansen" },
  { anchorId: "tool-clip", text: "Klipp datalag til å passe et annet datalag" },
  {
    anchorId: "tool-current-task",
    text: "Her finner du igjen oppgaven du holder på med om du skulle lure på noe. ",
  },
];

export default function Welcome({ isOpen, onClose, onAfterTour, onStartTasks }: Props) {
  const [showTour, setShowTour] = useState(false);

  return (
    <>
      <Popup
        isOpen={isOpen && !showTour} // skjul velkomstpopup mens tour vises
        onClose={onClose}
        title="Velkommen til Klimarisiko GIS"
        highlightColor="var(--brand)"
        actions={[
          {
            label: "Lær om verktøyene",
            variant: "secondary",
            onClick: () => setShowTour(true),
          },
          {
            label: "Start på første oppgave",
            variant: "primary",
            onClick: () => {
              onClose();
              onStartTasks?.();
            },
          },
        ]}
      >
        <p>
          I Klimarisiko GIS skal du finne hvilke områder i Trondheim som er trygge for nye
          konstruksjoner.
        </p>
        <p>
          Er du klar for å gå i gang allerede, eller vil du ha en kort gjennomgang av verktøyene du
          kan bruke i dette GISet.
        </p>
      </Popup>

      <Tour
        open={showTour}
        steps={steps}
        onClose={() => setShowTour(false)}
        onComplete={() => {
          setShowTour(false);
          onAfterTour?.();
        }}
      />
    </>
  );
}
