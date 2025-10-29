import Popup from "./Popup";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Task2({ isOpen, onClose }: Props) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Oppgave 2 – Klipp til Trondheim sentrum"
      step={2}
      totalSteps={10}
      highlightColor="var(--brand)"
      actions={[{ label: "Lukk", variant: "primary", onClick: onClose }]}
    >
      <p>
        Datasettene du lastet opp dekker store områder. Vi skal nå avgrense analysen til{" "}
        <b>Trondheim sentrum</b>.
      </p>

      <p>
        Bruk polygonverktøyet i kartet til å tegne et område rundt sentrum (for eksempel mellom Ila
        og Gløshaugen). Deretter bruker du <b>Clip-verktøyet</b> for å klippe alle lagene til dette
        området.
      </p>

      <p>
        Når du har laget de klippede lagene, kan du slette de gamle for å holde prosjektet ryddig.
      </p>
    </Popup>
  );
}
