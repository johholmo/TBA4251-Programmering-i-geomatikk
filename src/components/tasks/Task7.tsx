import Popup from "../popup/Popup";

type Props7 = {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onAdvance: () => void;
};

export default function Task7({ isOpen, onClose, onBack, onAdvance }: Props7) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Oppgave 7 – Flomfaresoner"
      actions={[
        { label: "Forrige oppgave", variant: "secondary", onClick: onBack },
        { label: "Neste oppgave", variant: "primary", onClick: onAdvance },
      ]}
    >
      <p>Det er selvsagt heller ikke så lurt å bygge i eller rundt en flomfaresone.</p>

      <p>
        Last opp datasett <strong>Flomsoner</strong>, klipp det AOI, og lag en buffer på 100 meter
        rundt flomsonene. Navngi bufferlaget for eksempel <em>Flomfaresoner</em>.
      </p>

      <p>
        Fjern flomfaresonene fra <strong>AOI_Trondheim</strong> ved hjelp av{" "}
        <strong>Difference</strong>
        -verktøyet slik at det ikke bygges i disse områdene.
      </p>
    </Popup>
  );
}
