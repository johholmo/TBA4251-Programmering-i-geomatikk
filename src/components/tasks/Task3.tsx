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
        Du skal nå klippe Trondheim_Kommune til polygonlaget du tegnet i forrige oppgave (Area of
        Interest), slik at du kun forholder deg til data innenfor det aktuelle området i kartet.
        Dette vil du gjøre med alle datalag du laster opp.
      </p>

      <p>
        Åpne <strong>Clip</strong>-verktøyet i verktøylinjen. Laget som skal klippes er
        Trondheim_kommune, og det klippes mot Area of Interest.
      </p>

      <p>
        Når du har utført klippingen vil du se et nytt datalag i oversikten til venstre. Dette er
        delen av Trondheim Kommune som ligger innenfor polygonet du tegnet. Gi dette laget et
        tydelig navn, for eksempel <strong>AOI_Trondheim</strong>, og gjerne endre fargen. Du kan da
        slette det opprinnelige Trondheim_Kommune-laget, men behold polygonlaget du tegnet slik at
        du kan klippe andre datalag mot dette senere.
      </p>
    </Popup>
  );
}
