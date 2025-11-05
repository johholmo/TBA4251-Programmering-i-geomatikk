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
  { anchorId: "tool-upload", text: "Laste opp data i GeoJSON format." },
  { anchorId: "tool-buffer", text: "Lag en buffer rundt objekter (f.eks. 200 m fra vann)." },
  { anchorId: "tool-intersect", text: "Behold kun overlappen mellom to datalag." },
  { anchorId: "tool-union", text: "Slå sammen flere datalag til ett." },
  { anchorId: "tool-diff", text: "Fjern et datalag fra et annet for å finne differansen." },
  { anchorId: "tool-clip", text: "Klipp et datalag til å passe et annet datalag." },
  {
    anchorId: "tool-current-task",
    text: "Oppgaven du arbeider med for øyeblikket. ",
  },
];

export default function Welcome({ isOpen, onClose, onAfterTour, onStartTasks }: Props) {
  const [showTour, setShowTour] = useState(false);

  return (
    <>
      <Popup
        isOpen={isOpen && !showTour} // skjul velkomstpopup mens tour vises
        onClose={onClose}
        title="Velkommen til studentbolig-analysen!"
        highlightColor="var(--brand)"
        actions={[
          {
            label: "Lær om verktøyene",
            variant: "secondary",
            onClick: () => setShowTour(true),
          },
          {
            label: "Kom i gang!",
            variant: "primary",
            onClick: () => {
              onClose();
              onStartTasks?.();
            },
          },
        ]}
      >
        <p>
          Du skal nå jobbe som <b>GIS-analytiker i Trondheim</b> og finne områder som er egnet til
          for SiT å bygge nye studentboliger. Denne gjennomgangen med oppgaver guider deg i gjennom
          analysen steg for steg.
        </p>
        <p>
          Hvis du vil se hvilke verktøy vi skal bruke, kan du ta en rask gjennomgang. Hvis du
          allerede vet hva du gjør er det bare å sette i gang!
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
