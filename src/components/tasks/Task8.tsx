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
        SiT ønsker også å bygge studentboligene vekke fra store bilveier, og helst ikke midt på en
        vei heller. Derfor skal du fjerne veier fra de mulige byggeområdene, og i tillegg fjerne et
        buffersone rundt Europa- og Riksveier.
      </p>

      <p>
        Last opp datasettet <strong>Vei</strong>, og klipp det til AOI. Bruk{" "}
        <strong>Difference</strong>-verktøyet og fjern veiene fra datalaget med mulige byggeområder,
        slik som du har gjort i tidligere oppgaver. Dette er trolig mange veier som skal fjernes, så
        ikke bli overrasket om det tar litt tid.
      </p>

      <p>
        Bruk deretter <strong>Feature Extractor</strong>-verktøyet for å finne de veiene hvor
        "vegkategori" er lik "E" <em>eller</em> "R" (for europa- og riksvei). Lag en buffer på{" "}
        <strong>100 meter</strong> rundt disse veiene, og trekk laget med buffer fra de mulige
        byggeområdene.
      </p>

      <p>
        Navngi dette datalaget <em>Mulige byggeområder</em>. For ordenens skyld kan du også slette
        de datalagene du ikke lenger bruker.
      </p>
    </Popup>
  );
}
