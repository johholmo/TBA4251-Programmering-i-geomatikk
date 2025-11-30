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
        Først og fremst skal du sørge for at SiT ikke bygger nye studentboliger i vannområder. Last
        opp datasettene <strong>Innsjø</strong>, <strong>Kanal</strong>, <strong>Elv</strong> og{" "}
        <strong>Havflate</strong> fra GitHub, og klipp dem til AOI (slik som i forrige oppgave).
        Slett de originale lagene for å holde oversikten ryddig.
      </p>

      <p>
        Alle disse datalagene representerer vann, så hvorfor ikke slå dem sammen til ett lag? Bruk{" "}
        <strong>Union</strong>-verktøyet for å slå sammen de klippede datalagene for vann til ett
        lag. Navngi og fargelegg laget passende, for eksempel <em>Vannområder</em> i blå farge.
        Slette de individuelle lagene.
      </p>
    </Popup>
  );
}
