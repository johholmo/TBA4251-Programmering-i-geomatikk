import Popup from "./Popup";

export default function Task5({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Oppgave 5 – Nærhet til NTNU-campuser"
      step={5}
      totalSteps={10}
      highlightColor="var(--brand)"
      actions={[{ label: "Lukk", variant: "primary", onClick: onClose }]}
    >
      <p>
        Studentene bør ha kort vei til campus. Bruk <b>Buffer-verktøyet</b> på{" "}
        <code>NTNU Campuser</code> for å lage en buffersone på <b>1000 meter</b>.
      </p>

      <p>Dette laget viser områder som ligger innenfor gang- eller sykkelavstand fra campus.</p>
    </Popup>
  );
}
