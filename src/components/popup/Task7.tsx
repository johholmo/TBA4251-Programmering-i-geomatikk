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
      title="Oppgave 7 – Flom- og skredfaresoner"
      actions={[
        { label: "Forrige oppgave", variant: "secondary", onClick: onBack },
        { label: "Neste oppgave", variant: "primary", onClick: onAdvance },
      ]}
    >
      <p>
        Vi vil heller ikke bygge i eller rundt flom- eller skredfaresoner. For å være på den sikre
        siden legger vi til en avstand på <strong>100 meter</strong> rundt disse sonene.
      </p>

      <p>
        Last opp datasettene <strong>Flomsoner</strong> og <strong>Skredfaresoner</strong>, og lag
        en buffer rundt hver av dem. Slå dem deretter sammen og klipp dem til AOI. Dette kan du for
        eksempel kalle <em>Faresoner</em>.
      </p>

      <p>
        Fjern faresonene fra <strong>AOI_Trondheim</strong> ved hjelp av <strong>Difference</strong>
        -verktøyet slik at vi ikke bygger i disse områdene.
      </p>
    </Popup>
  );
}
