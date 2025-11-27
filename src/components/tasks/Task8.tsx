import Popup from "../popup/Popup";

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
      title="Oppgave 8 – Unngå veier"
      actions={[
        { label: "Forrige oppgave", variant: "secondary", onClick: onBack },
        { label: "Neste oppgave", variant: "primary", onClick: onAdvance },
      ]}
    >
      <p>
        Det er også greit å bygge studentboliger litt unna store bilveier, og helst ikke midt på en
        bilvei heller. Du skal nå fjerne veier fra de mulige byggeområdene, og i tillegg fjerne et
        område rundt Europa- og Riksveier.
      </p>

      <p>
        Last opp datasettet <strong>Vei</strong>, og klipp det til AOI. Trekk deretter dette laget
        fra de mulige byggeområdene ved hjelp av Difference-verktøyet.
      </p>

      <p>
        Deretter bruker du feature-verktøyet for å finne de veiene hvor "vegkategori" er lik "E"
        eller "R" (for europa- og riksvei). Lag en buffer på <strong>100 meter</strong> rundt disse
        veiene, og trekk laget med buffer fra datalaget med de mulige byggeområdene.
      </p>

      <p>
        Navngi dette datalaget <em>Mulige byggeområder</em>. For ordenens skyld kan du også slette
        de datalagene du ikke lenger bruker.
      </p>
    </Popup>
  );
}
