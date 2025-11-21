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
        Nå skal vi finne alle vannområder, ettersom det ikke er aktuelt å bygge studentboliger der.
        Last opp datasettene <strong>Innsjø</strong>, <strong>Kanal</strong>, <strong>Elv</strong>{" "}
        og <strong>Havflate</strong> fra GitHub, og klipp dem til AOI.
      </p>

      <p>
        Siden alle disse representerer vann, kan vi slå dem sammen til ett lag. Bruk{" "}
        <strong>Union</strong>-verktøyet for å samle dem i ett lag. Navngi og fargelegg laget
        passende, for eksempel <em>Vannområder</em> i blå farge. Husk å også klippe datalaget til
        AOI.
      </p>
    </Popup>
  );
}
