import Popup from "./Popup";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAdvance: () => void;
};

export default function Task3({ isOpen, onClose, onAdvance }: Props) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Oppgave 5 – Nærhet til NTNU-campuser"
      step={5}
      totalSteps={10}
      highlightColor="var(--brand)"
      actions={[
        { label: "Lukk", variant: "secondary", onClick: onClose },
        {
          label: "Neste oppgave",
          variant: "primary",
          onClick: onAdvance,
        },
      ]}
    >
      <p>
        Studentene bør ha kort vei til campus. Bruk <b>Buffer-verktøyet</b> på{" "}
        <code>NTNU Campuser</code> for å lage en buffersone på <b>1000 meter</b>.
      </p>

      <p>Dette laget viser områder som ligger innenfor gang- eller sykkelavstand fra campus.</p>
    </Popup>
  );
}
