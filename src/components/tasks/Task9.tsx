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
      title="Oppgave 9 – Unngå bygninger"
      actions={[
        { label: "Forrige oppgave", variant: "secondary", onClick: onBack },
        { label: "Neste oppgave", variant: "primary", onClick: onAdvance },
      ]}
    >
      <p>
        For å unngå konflikt med eksisterende bebyggelse, må vi fjerne både selve bygningene og en
        sone rundt dem. Dette sikrer at områdene vi velger faktisk er tilgjengelige for ny
        utvikling.
      </p>

      <p>
        Last opp datasettet <strong>FKB-Bygning</strong> og klipp det til{" "}
        <strong> AOI_Trondheim</strong>.
      </p>

      <p>
        Lag en buffer på <strong>10 meter</strong> rundt bygningene. Gi laget et passende navn, for
        eksempel <em>Bygning_buffer_10m</em>.
      </p>

      <p>
        Bruk <strong>Difference</strong>-verktøyet for å fjerne bygninger og bufferen deres fra{" "}
        <strong> det aktuelle analyseområdet</strong>.
      </p>
    </Popup>
  );
}
