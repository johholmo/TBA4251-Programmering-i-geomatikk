import Popup from "./Popup";

export default function Task9({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Oppgave 9 – Minimum arealkrav"
      step={9}
      totalSteps={10}
      highlightColor="var(--brand)"
      actions={[{ label: "Lukk", variant: "primary", onClick: onClose }]}
    >
      <p>
        Nå må vi sikre at områdene du har funnet faktisk er store nok for studentboliger. Bruk{" "}
        <b>Måleverktøyet</b> til å måle arealet av de egnede områdene.
      </p>

      <p>
        SiT krever minst <b>5000 m²</b> for et boligkompleks. Marker hvilke områder som oppfyller
        dette kravet, og merk dem som “Aktuelle byggefelt”.
      </p>
    </Popup>
  );
}
