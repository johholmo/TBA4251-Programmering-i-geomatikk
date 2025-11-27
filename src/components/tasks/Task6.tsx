import Popup from "../popup/Popup";

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
        Du har nå laget en sone rundt vannområdene som det ikke skal bygges i. Derfor kan du fjerne
        disse områdene fra <strong>AOI_Trondheim</strong>-laget.
      </p>

      <p>
        Bruk <strong>Difference</strong>-verktøyet, og trekk datalaget fra forrige oppgave
        (vannområder med buffer) fra <strong>AOI_Trondheim</strong>.
      </p>

      <p>
        Det nye laget som dukker opp i oversikten til venstre er da et lag som viser områder som
        fortsatt kan være aktuelle å bygge i. Du kan da slette det opprinnelige{" "}
        <strong>AOI_Trondheim</strong>-laget, og navngi det nye passende for å holde oversikt (for
        eksempel <em>"Mulige byggeområder"</em>).
      </p>

      <p>
        Gjerne bruk knappene i oversikten til venstre for å gjøre vannområder og vannområdene med
        buffer usynlig. Da ser du tydelig at disse områdene er fjernet fra det nye laget med mulige
        byggeområder.
      </p>
    </Popup>
  );
}
