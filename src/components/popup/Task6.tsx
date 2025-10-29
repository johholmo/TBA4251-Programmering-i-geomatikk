import Popup from "./Popup";

export default function Task6({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Oppgave 6 – Kombiner trygge og sentrale områder"
      step={6}
      totalSteps={10}
      highlightColor="var(--brand)"
      actions={[{ label: "Lukk", variant: "primary", onClick: onClose }]}
    >
      <p>
        Nå skal vi finne områdene som både er trygge og ligger nær campus. Bruk{" "}
        <b>Intersect-verktøyet</b> mellom de trygge sonene og NTNU-bufferen fra forrige oppgave.
      </p>

      <p>Resultatet viser “trygge og sentrale områder” – gode kandidater for studentboliger.</p>
    </Popup>
  );
}
