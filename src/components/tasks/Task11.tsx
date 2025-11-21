import Popup from "../popup/Popup";

type Props11 = {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onAdvance: () => void;
};

export default function Task11({ isOpen, onClose, onBack, onAdvance }: Props11) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Oppgave 11 – Store nok områder"
      actions={[
        { label: "Forrige oppgave", variant: "secondary", onClick: onBack },
        { label: "Neste oppgave", variant: "primary", onClick: onAdvance },
      ]}
    >
      <p>
        Nå har du funnet alle trygge og ønskede områder, men området må jo også være stort nok til å
        få plass til en studentbolig. SiT ønsker et sammenhengende område på minst 300 kvadratmeter
        for å få plass til sin nye studentblokk.
      </p>

      <p>
        Bruk verktøyet <strong>Area Filter</strong> til å finne de sammenhengende polygonene i
        datalaget fra oppgave 10 som er minst 300 kvadratmeter.
      </p>
    </Popup>
  );
}
