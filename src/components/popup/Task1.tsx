import Popup from "./Popup";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Task1({ isOpen, onClose }: Props) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Oppgave 1 – Last opp nødvendige data"
      step={1}
      totalSteps={10}
      highlightColor="var(--brand)"
      actions={[{ label: "Lukk", variant: "secondary", onClick: onClose }]}
    >
      <p>
        Først må vi samle grunnlagsdataene som skal brukes i analysen. Du finner datasettene på{" "}
        <b>GitHub</b> i mappen <code>data</code>. Disse er hentet fra GeoNorge.
      </p>

      <p>Last opp følgende lag for å komme i gang:</p>
      <ul>
        <li>FKB-Bygning</li>
        <li>FKB-Vann</li>
        <li>FKB-Veg</li>
        <li>Flomsoner</li>
        <li>Skredfaresoner</li>
        <li>NTNU Campuser (punktdata)</li>
      </ul>

      <p>Når alle lagene er lastet opp, kan du lukke dette vinduet for å gå videre.</p>
    </Popup>
  );
}
