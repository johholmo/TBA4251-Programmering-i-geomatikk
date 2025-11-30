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
        For å være på den sikre siden vil ikke SiT bygge så nærme vannområder heller. Du skal derfor
        lage en buffersone rundt vannområdene det ikke skal bygges i.
      </p>

      <p>
        Bruk <strong>Buffer</strong>-verktøyet og lag en buffer på <strong>200 meter</strong> rundt
        vannområdene.
      </p>
    </Popup>
  );
}
