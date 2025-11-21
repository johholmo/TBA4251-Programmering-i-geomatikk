import Popup from "../popup/Popup";

type Props3 = {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onAdvance: () => void;
};

export default function Task3({ isOpen, onClose, onBack, onAdvance }: Props3) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Oppgave 3 – Klipp data til AOI"
      actions={[
        { label: "Forrige oppgave", variant: "secondary", onClick: onBack },
        { label: "Neste oppgave", variant: "primary", onClick: onAdvance },
      ]}
    >
      <p>
        Vi skal nå klippe Trondheim_Kommune til vårt Area of Interest (AOI) slik at vi kun får det
        aktuelle området i kartet.
      </p>

      <p>
        Åpne Clip-verktøyet i verktøylinjen. Laget som skal klippes er datalaget du lastet opp i
        oppgave 1 (Trondheim_Kommune), og det klippes mot polygonet du tegnet i oppgave 2 (AOI).
      </p>

      <p>
        Når du har klippet får du et nytt datalag i sidebaren. Dette er delen av Trondheim Kommune
        som ligger innenfor AOI. Gi laget et tydelig navn, for eksempel{" "}
        <strong>AOI_Trondheim</strong>, og endre gjerne fargen. Du kan slette det opprinnelige
        Trondheim_Kommune-laget.
      </p>
    </Popup>
  );
}
