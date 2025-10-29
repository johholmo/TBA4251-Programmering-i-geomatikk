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
      title="Oppgave 7 – Tilgjengelighet til vei"
      step={7}
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
        For å sikre god tilgjengelighet må studentboligen ligge nær vei. Bruk{" "}
        <b>Buffer-verktøyet</b> på <code>FKB-Veg</code> med radius <b>300 meter</b>.
      </p>

      <p>
        Deretter bruker du <b>Intersect</b> mellom dette bufferlaget og laget fra forrige oppgave
        for å finne områder som både er trygge, sentrale og lett tilgjengelige.
      </p>
    </Popup>
  );
}
