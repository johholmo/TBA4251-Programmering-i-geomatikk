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
      title="Oppgave 9 – Slå sammen trygge og ønskede områder"
      actions={[
        { label: "Forrige oppgave", variant: "secondary", onClick: onBack },
        { label: "Neste oppgave", variant: "primary", onClick: onAdvance },
      ]}
    >
      <p>Nå skal du finne de områdene som både er trygge og ønsket av SiT.</p>

      <p>
        Bruk <strong>Intersect</strong>-verktøyet til å finne de områdene som overlapper i lagene{" "}
        <strong>AOI_Trondheim</strong> (etter at du har fjernet risiko i oppgave 7) og bufferen
        rundt campusene (oppgave 8).
      </p>

      <p>Resultatet er de områdene som er både trygge og ligger sentralt i forhold til campus.</p>
    </Popup>
  );
}
