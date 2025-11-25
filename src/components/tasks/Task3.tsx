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
        Du skal nå klippe Trondheim_Kommune til polygonlaget du lagde i forrige oppgave (Area of
        Interest), slik at det kun er data innenfor det aktuelle området i kartet.
      </p>

      <p>
        Åpne Clip-verktøyet i verktøylinjen. Laget som skal klippes er datalaget du lastet opp i
        oppgave 1 (Trondheim_Kommune), og det klippes mot polygonet du tegnet i oppgave 2 (AOI).
      </p>

      <p>
        Når du har utført klippingen vil du se et nytt datalag i sidebaren. Dette er delen av
        Trondheim Kommune som ligger innenfor AOI. Gi dette laget et tydelig navn, for eksempel{" "}
        <strong>AOI_Trondheim</strong>, og gjerne endre fargen. Du kan da slette det opprinnelige
        Trondheim_Kommune-laget, men behold polygonlaget ditt for AOI.
      </p>
    </Popup>
  );
}
