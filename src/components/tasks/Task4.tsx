import Popup from "../popup/Popup";

type Props4 = {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onAdvance: () => void;
};

export default function Task4({ isOpen, onClose, onBack, onAdvance }: Props4) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Oppgave 4 – Vannområder"
      actions={[
        { label: "Forrige oppgave", variant: "secondary", onClick: onBack },
        { label: "Neste oppgave", variant: "primary", onClick: onAdvance },
      ]}
    >
      <p>
        Nå skal du sørge for at det ikke bygges på noen vannområder. Last opp datasettene{" "}
        <strong>Innsjø</strong>, <strong>Kanal</strong>, <strong>Elv</strong> og{" "}
        <strong>Havflate</strong> fra GitHub, og klipp dem til AOI. Da kan du slette de originale
        lagene.
      </p>

      <p>
        Siden alle disse representerer vann, kan du slå dem sammen til ett lag. Bruk{" "}
        <strong>Union</strong>-verktøyet for å samle dem i ett lag. Navngi og fargelegg laget
        passende, for eksempel <em>Vannområder</em> i blå farge. Da kan du slette de individuelle
        lagene.
      </p>
    </Popup>
  );
}
