import { useState } from "react";
import Popup from "../popup/Popup";
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
  { anchorId: "tool-area", text: "Filtrer etter områder på en viss størrelse. " },
  { anchorId: "tool-current-task", text: "Oppgaven du arbeider med for øyeblikket. " },
];

export default function Welcome({ isOpen, onClose, onAfterTour, onStartTasks }: Props) {
  const [showTour, setShowTour] = useState(false);

  return (
    <>
      <Popup
        isOpen={isOpen && !showTour} // skjul velkomstpopup mens tour vises
        onClose={onClose}
        title="Velkommen til studentbolig-analysen!"
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
          Du skal nå jobbe som <strong>GIS-analytiker</strong> og har fått i oppgave å finne egnede
          områder der Studentsamskipnaden i Trondheim (SiT) kan bygge nye studentboliger. Gjennom
          denne gjennomgangen vil du bruke flere GIS-verktøy og løse oppgaver som steg for steg
          fører deg frem til de optimale områdene for en slik utbygging.
        </p>

        <p>
          Ønsker du en introduksjon til verktøyene du skal bruke, kan du ta en rask omvisning.
          Dersom du allerede er klar for å starte analysen, er det bare å hoppe rett inn i
          oppgavene.
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
