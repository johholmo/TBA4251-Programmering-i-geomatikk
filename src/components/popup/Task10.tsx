import Popup from "./Popup";

export default function Task10({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Oppgave 10 – Samle og navngi resultatet"
      step={10}
      totalSteps={10}
      highlightColor="var(--brand)"
      actions={[{ label: "Lukk", variant: "primary", onClick: onClose }]}
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
