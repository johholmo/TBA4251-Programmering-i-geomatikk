import Popup from "./Popup";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAdvance: () => void;
};

export default function Task3({ isOpen, onClose, onAdvance }: Props) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Oppgave 4 – Fjern risikoområder (flom og skred)"
      step={4}
      totalSteps={10}
      highlightColor="var(--brand)"
      actions={[
        { label: "Lukk", variant: "secondary", onClick: onClose },
        {
          label: "Neste oppgave",
          variant: "primary",
          onClick: onAdvance,
        },
      ]}
    >
      <p>
        Nå skal vi fjerne områder som er utsatt for flom eller skred. Bruk{" "}
        <b>Difference-verktøyet</b> for å trekke fra lagene <code>Flomsoner</code> og{" "}
        <code>Skredfaresoner</code> fra studieområdet ditt.
      </p>

      <p>Resultatet vil være et nytt lag som viser de tryggeste områdene.</p>
    </Popup>
  );
}
