import Popup from "../popup/Popup";

export default function Done({
  isOpen,
  onClose,
  onAdvance,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdvance: () => void;
}) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Fullført!"
      actions={[
        { label: "Lukk", variant: "secondary", onClick: onClose },
        { label: "Start på nytt", variant: "primary", onClick: onAdvance }, // Clear alle lag når det starter på nytt håndteres i App.tsx
      ]}
    >
      <p>
        🎉 Gratulerer! Du har fullført hele analysen og funnet de områdene i Trondheim som egner seg
        til utbygging av nye studentboliger. Dette blir nok SiT veldig glad for!
      </p>

      <p>Vil du starte på nytt eller utforske kartet videre?</p>
    </Popup>
  );
}
