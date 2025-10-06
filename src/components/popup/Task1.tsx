import Popup from "./Popup";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Task1IntroPopup({ isOpen, onClose }: Props) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Oppgave 1 – Last opp nødvendig data"
      step={1}
      totalSteps={5}
      highlightColor="var(--brand)"
      actions={[
        { label: "Lukk", variant: "secondary", onClick: onClose },
      ]}
    >
      <p>Først og fremst må du laste opp datalag.</p>
      <p>På GitHub, i mappen "data" finner du datalag hentet fra GeoNorge. Last disse ned fra GitHub og last dem opp her. </p>
      
    </Popup>
  );
}
