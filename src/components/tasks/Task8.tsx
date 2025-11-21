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
      title="Oppgave 8 – Unngå vei"
      actions={[
        { label: "Forrige oppgave", variant: "secondary", onClick: onBack },
        { label: "Neste oppgave", variant: "primary", onClick: onAdvance },
      ]}
    >
      <p>
        Veier skaper støy og utrygghet tett inntil boliger. Derfor ønsker vi å legge inn en
        sikkerhetssone rundt veiene for å unngå bygging i nærheten av trafikkerte områder.
      </p>

      <p>
        Last opp datasettet <strong>FKB-Vei</strong> og klipp det til{" "}
        <strong> AOI_Trondheim</strong>.
      </p>

      <p>
        Lag deretter en buffer på <strong>30 meter</strong> rundt veiene. Gi laget et tydelig navn,
        for eksempel <em>Vei_buffer_30m</em>.
      </p>

      <p>
        Bruk <strong>Difference</strong>-verktøyet for å fjerne veisonen fra{" "}
        <strong> det aktuelle analyseområdet</strong>.
      </p>
    </Popup>
  );
}
