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
        for å lage et nytt campus. I tillegg kan det være greit å ikke bygge direkte ved siden av en
        bygning eller vei.
      </p>

      <p>
        Last opp datasettene <strong>Vei</strong> og <strong>Bygninger</strong>. Klipp dem til{" "}
        <strong> Area of Interest</strong>, og navngi dem godt.
      </p>

      <p>
        Lag deretter en buffer på <strong>30 meter</strong> rundt veiene, og en buffer på{" "}
        <strong>20 meter</strong> fra bygninger.
      </p>

      <p>Bruk Difference-verktøyet for å fjerne bufferene fra AOI_Trondheim.</p>
    </Popup>
  );
}
