import Popup from "./Popup";

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
      highlightColor="var(--brand)"
      actions={[
        { label: "Lukk", variant: "secondary", onClick: onClose },
        { label: "Start på nytt", variant: "primary", onClick: onAdvance },
      ]}
    >
      <p>
        🎉 Gratulerer! Du har fullført hele analysen og funnet de mest egnede områdene for nye
        studentboliger i Trondheim.
      </p>

      <p>
        Du har kombinert <b>miljødata</b>, <b>risikoanalyser</b>, <b>terrengdata</b> og{" "}
        <b>tilgjengelighet</b> for å utføre en komplett GIS-basert beslutningsanalyse.
      </p>

      <p>Vil du starte på nytt eller utforske kartet videre?</p>
    </Popup>
  );
}
