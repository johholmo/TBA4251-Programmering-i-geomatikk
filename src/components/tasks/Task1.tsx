import Popup from "../popup/Popup";

type Props1 = {
  isOpen: boolean;
  onClose: () => void;
  onAdvance: () => void;
};

export default function Task1({ isOpen, onClose, onAdvance }: Props1) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Oppgave 1 – Last opp første datasett"
      actions={[{ label: "Neste oppgave", variant: "primary", onClick: onAdvance }]}
    >
      <p>
        Først og fremst skal du laste opp data. Du finner alle datasettene i GitHub-repoet, i mappen{" "}
        <a
          href="https://github.com/johholmo/TBA4251-Programmering-i-geomatikk/tree/main/public/data"
          target="_blank"
          rel="noopener noreferrer"
        >
          <strong>data</strong>
        </a>
        .
      </p>

      <p>
        Bruk <strong>Last opp data</strong>-verktøyet i verktøylinjen, og last opp filen{" "}
        <strong>Trondheim_Kommune.geojson</strong>.
      </p>

      <p>
        💡 Etter hvert som du løser oppgavene vil du ha behov for å laste opp flere datasett. Det
        kan være lurt å ikke laste opp alt på en gang, slik at kartet holder seg ryddig og raskt.
      </p>
      <p>
        Lukk dette vinduet for å løse oppgaven. Hvis du lurer på noe finner du oppgaven igjen oppe i
        høyre hjørne, og det er også her du går videre til neste oppgave når du er ferdig.
      </p>
    </Popup>
  );
}
