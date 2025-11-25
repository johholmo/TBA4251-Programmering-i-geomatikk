import Popup from "../popup/Popup";

type Props9 = {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onAdvance: () => void;
};

export default function Task9({ isOpen, onClose, onBack, onAdvance }: Props9) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Oppgave 9 – I nærheten av NTNU"
      actions={[
        { label: "Forrige oppgave", variant: "secondary", onClick: onBack },
        { label: "Neste oppgave", variant: "primary", onClick: onAdvance },
      ]}
    >
      <p>
        Nå har du fjernet alle de områdene det ikke er aktuelt å bygge på, men hva med områder det
        er ønskelig å bygge på?
      </p>

      <p>
        SiT ønsker at studentboligene skal ligge innenfor <strong>1 kilometer</strong> fra et
        NTNU-campus. La oss først finne disse områdene!
      </p>

      <p>
        Last opp datalaget <strong>NTNU_campuser</strong>. Bruk <strong>Buffer</strong> til å lage
        en buffer på <strong>1000 meter</strong> rundt NTNU-campusene. Navngi laget for eksempel{" "}
        <em>Ønskede bygningsområder</em>.
      </p>
    </Popup>
  );
}
