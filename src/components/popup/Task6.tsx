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
      title="Oppgave 6 – Kombiner trygge og sentrale områder"
      step={6}
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
        Nå skal vi finne områdene som både er trygge og ligger nær campus. Bruk{" "}
        <b>Intersect-verktøyet</b> mellom de trygge sonene og NTNU-bufferen fra forrige oppgave.
      </p>

      <p>Resultatet viser “trygge og sentrale områder” – gode kandidater for studentboliger.</p>
    </Popup>
  );
}
