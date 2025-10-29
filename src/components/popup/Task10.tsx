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
      title="Oppgave 10 – Samle og navngi resultatet"
      step={10}
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
        Du har nå identifisert områder som oppfyller alle kriterier: trygghet, tilgjengelighet og
        egnet terreng.
      </p>

      <p>
        Bruk <b>Union-verktøyet</b> for å slå sammen disse områdene til ett samlet lag. Gi laget et
        tydelig navn, for eksempel <code>Trygge_studentområder_samlet</code>.
      </p>
    </Popup>
  );
}
