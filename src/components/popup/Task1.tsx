import Popup from "./Popup";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAdvance: () => void;
};

export default function Task1({ isOpen, onClose, onAdvance }: Props) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Oppgave 1 – Last opp første datasett"
      actions={[
        { label: "Lukk", variant: "secondary", onClick: onClose },
        { label: "Neste oppgave", variant: "primary", onClick: onAdvance },
      ]}
    >
      <p>
        Først og fremst skal vi få inn noen data i prosjektet vårt. På GitHub, i mappen <b>data</b>,
        finner du alle filene du trenger til alle disse oppgavene.{" "}
      </p>
      <p>
        Bruk verktøyet «Last opp data» i verktøylinjen, og last opp filen <b>FKB-Vann</b>.
        <br />
        Når du har lastet opp filen kan du gå videre til neste oppgave.
      </p>
      <p>
        Etterhvert som du løser oppgavene vil du ha behov for å laste opp mer data, men det kan være
        en god ide å ikke laste opp alt på en gang slik at ting ikke går for tregt.
      </p>
    </Popup>
  );
}
