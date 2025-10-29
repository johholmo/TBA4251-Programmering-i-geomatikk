import Popup from "./Popup";

export default function Done({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Oppgave 11 – Ferdig!"
      highlightColor="var(--brand)"
      actions={[
        { label: "Start på nytt", variant: "secondary", onClick: onClose },
        { label: "Lukk", variant: "primary", onClick: onClose },
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
