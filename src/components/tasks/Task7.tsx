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
        Det er klart man må rive litt for å bygge noe nytt, men SiT ønsker gjerne å ikke rive
        bygninger som er universitetsbygg, idrettshaller eller andre offentlige bygg som har med
        barn og unge å gjøre.
      </p>

      <p>
        GeoNorge har en egen filtrering for sånne bygg, og du skal nå finne disse bygningene og
        sørge for at vi ikke bygger nye studentboliger der.{" "}
      </p>

      <p>
        Last opp datasettet <strong>Bygninger</strong> fra GitHub, og klipp det til AOI. Bruk
        Feature Extractor til å hente ut alle bygninger der <em>bygningstype</em> har en verdi
        mellom 600 og 699. Dette er klassifiseringer for offentlige bygg som har med barn og unge å
        gjøre.
      </p>

      <p>
        Lag så en buffer på 20 meter rundt disse bygningene, og fjern dem fra{" "}
        <em>Mulige byggeområder</em>
      </p>
    </Popup>
  );
}
