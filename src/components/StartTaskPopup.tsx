import Popup from "./Popup";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
};

export default function StartTasksPopup({ isOpen, onClose, onStart }: Props) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Klar til oppgavene?"
      step={null as any}
      totalSteps={null as any}
      highlightColor="var(--brand)"
      actions={[
        { label: "Ikke nå", variant: "secondary", onClick: onClose },
        { label: "Start første oppgave", variant: "primary", onClick: onStart },
      ]}
    >
      <p>Du har nå gått gjennom verktøyene i verktøylinjen 🙌</p>
      <p>Vil du sette i gang med oppgaveserien nå?</p>
    </Popup>
  );
}
