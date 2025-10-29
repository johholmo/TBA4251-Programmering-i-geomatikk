import Popup from "./Popup";

export default function Task4({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Oppgave 4 – Fjern risikoområder (flom og skred)"
      step={4}
      totalSteps={10}
      highlightColor="var(--brand)"
      actions={[{ label: "Lukk", variant: "primary", onClick: onClose }]}
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
