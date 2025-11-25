import Popup from "../popup/Popup";

type Props10 = {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onAdvance: () => void;
};

export default function Task10({ isOpen, onClose, onBack, onAdvance }: Props10) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Oppgave 10 – Slå sammen trygge og ønskede områder"
      actions={[
        { label: "Forrige oppgave", variant: "secondary", onClick: onBack },
        { label: "Neste oppgave", variant: "primary", onClick: onAdvance },
      ]}
    >
      <p>
        Nå har du ett datalag med områder det er <em>mulig</em> å bygge i, og ett datalag det er{" "}
        <em>ønskelig</em> å bygge i. Du skal nå finne de områdene som er innenfor begge disse
        kategoriene.{" "}
      </p>

      <p>
        Bruk <strong>Intersect</strong>-verktøyet til å finne de områdene som overlapper i datalaget{" "}
        <em>Mulige byggeområder</em> og datalaget <em>Ønskede bygningsområder</em>.
      </p>

      <p>
        Det nye datalaget du nå har laget vil være de områdene som det både er trygt å bygge på, og
        ligger sentralt i forhold til campus. Navngi laget for eksempel{" "}
        <em>Trygge og ønskede områder</em>.
      </p>
    </Popup>
  );
}
