import Popup from "../popup/Popup";

type Props5 = {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onAdvance: () => void;
};

export default function Task5({ isOpen, onClose, onBack, onAdvance }: Props5) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Oppgave 5 – Buffer"
      actions={[
        { label: "Forrige oppgave", variant: "secondary", onClick: onBack },
        { label: "Neste oppgave", variant: "primary", onClick: onAdvance },
      ]}
    >
      <p>
        For å være på den sikre siden er det ikke ønskelig å bygge helt inntil vannområder. Du skal
        derfor lage en sone rundt vannområdene hvor det ikke skal bygges.
      </p>

      <p>
        Bruk <strong>Buffer</strong>-verktøyet og lag en buffer på <strong>100 meter</strong> rundt
        vannområdene.
      </p>
    </Popup>
  );
}
