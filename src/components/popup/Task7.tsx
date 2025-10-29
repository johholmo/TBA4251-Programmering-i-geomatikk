import Popup from "./Popup";

export default function Task7({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Oppgave 7 – Tilgjengelighet til vei"
      step={7}
      totalSteps={10}
      highlightColor="var(--brand)"
      actions={[{ label: "Lukk", variant: "primary", onClick: onClose }]}
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
