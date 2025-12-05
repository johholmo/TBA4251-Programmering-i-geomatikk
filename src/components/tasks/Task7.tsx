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
      title="Oppgave 7 – Unngå spesifikke bygninger"
      actions={[
        { label: "Forrige oppgave", variant: "secondary", onClick: onBack },
        { label: "Neste oppgave", variant: "primary", onClick: onAdvance },
      ]}
    >
      <p>
        Det er klart man må rive litt for å bygge noe nytt, men SiT vil gjerne unngå å rive
        bygninger som universitetsbygg, idrettshaller eller andre offentlige bygg for barn og unge.
        Heldigvis har GeoNorge, som all data til denne analysen er hentet fra, en egen filtrering
        for slike bygninger.
      </p>

      <p>
        Last opp datasettet <strong>Bygninger</strong> fra GitHub, og klipp det til AOI. Bruk{" "}
        <strong>Feature Extractor</strong>-verktøyet til å hente ut alle bygninger der{" "}
        <em>bygningstype</em> har en verdi mellom 600 og 699. Dette er bygningstypene som
        representerer offentlige bygg for barn og unge.
      </p>

      <p>
        Lag så en buffer på 150 meter rundt disse bygningene, og fjern dem fra{" "}
        <em>Mulige byggeområder</em>.
      </p>
    </Popup>
  );
}
