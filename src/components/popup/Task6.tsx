import Popup from "./Popup";

type Props6 = {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onAdvance: () => void;
};

export default function Task6({ isOpen, onClose, onBack, onAdvance }: Props6) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Oppgave 6 – Fjern uaktuelle områder"
      actions={[
        { label: "Forrige oppgave", variant: "secondary", onClick: onBack },
        { label: "Neste oppgave", variant: "primary", onClick: onAdvance },
      ]}
    >
      <p>
        Ettersom vi ikke ønsker å bygge i vannområder eller innenfor bufferen, skal vi nå fjerne
        disse områdene fra <strong>AOI_Trondheim</strong>-laget vårt.
      </p>

      <p>
        Bruk <strong>Difference</strong>-verktøyet, og trekk datalaget fra forrige oppgave
        (vannområder med buffer) fra <strong>AOI_Trondheim</strong>.
      </p>

      <p>Da sitter du igjen med et lag som viser områder som fortsatt kan være aktuelle.</p>
    </Popup>
  );
}
