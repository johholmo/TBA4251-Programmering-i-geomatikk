import Popup from "./Popup";

type Props8 = {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onAdvance: () => void;
};

export default function Task8({ isOpen, onClose, onBack, onAdvance }: Props8) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Oppgave 8 – I nærheten av NTNU"
      actions={[
        { label: "Forrige oppgave", variant: "secondary", onClick: onBack },
        { label: "Neste oppgave", variant: "primary", onClick: onAdvance },
      ]}
    >
      <p>
        Nå har vi fjernet de områdene det ikke er aktuelt å bygge på, men hva med områder vi ønsker
        å bygge i?
      </p>

      <p>
        SiT ønsker at studentboligene skal ligge innenfor <strong>1 kilometer</strong> fra et
        NTNU-campus. La oss finne disse områdene!
      </p>

      <p>
        Last opp datalaget <strong>NTNU_campuser</strong>. Bruk <strong>Buffer</strong> til å lage
        en buffer på <strong>1000 meter</strong> rundt NTNU-campusene.
      </p>
    </Popup>
  );
}
