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
      title="Oppgave 3 – Trygg avstand fra vann"
      step={3}
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
        Områder for nær vann og elver kan være utsatt for flom og erosjon. Vi skal derfor holde oss
        minst <b>200 meter</b> unna vann.
      </p>

      <p>
        Bruk <b>Buffer-verktøyet</b> på vannlaget (<code>FKB-Vann</code>) med radius 200 meter for å
        lage en buffersone. Deretter bruker du <b>Difference</b> for å fjerne disse områdene fra
        resten av studieområdet.
      </p>

      <p>Når du er ferdig, vil kartet vise områder som ligger trygt unna vannsoner.</p>
    </Popup>
  );
}
