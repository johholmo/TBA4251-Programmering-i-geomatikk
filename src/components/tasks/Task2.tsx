import Popup from "../popup/Popup";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onAdvance: () => void;
};

export default function Task2({ isOpen, onClose, onBack, onAdvance }: Props) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Oppgave 2 – Lag et Area of Interest (AOI)"
      actions={[
        { label: "Forrige oppgave", variant: "secondary", onClick: onBack },
        { label: "Neste oppgave", variant: "primary", onClick: onAdvance },
      ]}
    >
      <p>
        I kartet ser du nå et polygon som dekker hele Trondheim Kommune. For å gjøre det enklere for
        oss skal vi begrense analysen til et mindre område som er mer aktuelt for studentboliger.
      </p>

      <p>
        I kartet (rett under zoom-knappene) har du en knapp som lar deg tegne et polygon. Bruk denne
        til å lage et <strong>Area of Interest (AOI)</strong>. Pass på å lage et stort nok område
        slik at vi kan finne aktuelle plasseringer for studentboligene.
      </p>

      <p>
        Klikk deg rundt området for å lage polygonet, og avslutt ved å klikke på første punkt igjen.
        Når du lagrer polygonet vil det dukke opp som et eget lag i oversikten til venstre.
      </p>
    </Popup>
  );
}
