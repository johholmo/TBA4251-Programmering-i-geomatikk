import Popup from "../popup/Popup";

type Props8 = {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onAdvance: () => void;
};

export default function Task8({ isOpen, onClose, onBack, onAdvance }: Props8) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Oppgave 8 – Unngå vei og bygninger"
      actions={[
        { label: "Forrige oppgave", variant: "secondary", onClick: onBack },
        { label: "Neste oppgave", variant: "primary", onClick: onAdvance },
      ]}
    >
      <p>
        SiT må spare på midlene sine, og ønsker derfor å ikke måtte rive hverken vei eller bygninger
        for å lage et nytt boligområde. I tillegg kan det være greit å ikke bygge direkte ved siden
        av en bygning eller vei.
      </p>

      <p>
        Last opp datasettene <strong>Vei</strong> og <strong>Bygninger</strong>. Klipp dem til AOI,
        og navngi dem godt.
      </p>

      <p>
        Lag deretter en buffer på <strong>30 meter</strong> rundt veiene, og en buffer på{" "}
        <strong>20 meter</strong> rundt bygninger.
      </p>

      <p>
        Bruk Difference-verktøyet for å fjerne de to bufferlagene fra datalaget som representerer de
        mulige byggeområdene. Navngi dette datalaget <em>Mulige byggeområder</em>. For ordenens
        skyld kan du også slette de opprinnelige veiene og bygningene, samt bufferlagene nå.
      </p>
    </Popup>
  );
}
