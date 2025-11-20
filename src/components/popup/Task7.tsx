import Popup from "./Popup";

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
      <p>
        Vi vil heller ikke bygge i eller rundt en flomfaresone. For å være på den sikre siden legger
        vi til en avstand på <strong>100 meter</strong> rundt disse sonene.
      </p>

      <p>
        Last opp datasett <strong>Flomsoner</strong>, klipp til AOI, og lag en buffer rundt. Navngi
        bufferlaget for eksempel <em>Faresoner</em>.
      </p>

      <p>
        Fjern faresonene fra <strong>AOI_Trondheim</strong> ved hjelp av <strong>Difference</strong>
        -verktøyet slik at vi ikke bygger i disse områdene.
      </p>
    </Popup>
  );
}
