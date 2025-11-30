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
        Du har nå funnet trygge og ønskede områder å bygge studentboliger på, men området må også
        være stort nok til å få plass til studentboliger. SiT ønsker et sammenhengende område på
        minst 800 kvadratmeter for å få plass til bygningene.
      </p>

      <p>
        Bruk <strong>Area Filter</strong>-verktøyet til å finne områdene i datalaget fra forrige
        oppgave som er minst 800 kvadratmeter.
      </p>
    </Popup>
  );
}
