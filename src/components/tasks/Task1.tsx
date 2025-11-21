import Popup from "../popup/Popup";

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
      actions={[{ label: "Neste oppgave", variant: "primary", onClick: onAdvance }]}
    >
      <p>
        Først og fremst skal vi få inn noen data i prosjektet vårt. Du finner alle datasett i
        GitHub-repoet, i mappen{" "}
        <a
          href="https://github.com/johholmo/TBA4251-Programmering-i-geomatikk/tree/main/data"
          target="_blank"
          rel="noopener noreferrer"
        >
          <strong>data</strong>
        </a>
        .
      </p>

      <p>
        Bruk verktøyet «Last opp data» i verktøylinjen, og last opp filen{" "}
        <strong>Trondheim_Kommune.geojson</strong>.
      </p>

      <p>
        💡 Etter hvert som du løser oppgavene vil du ha behov for å laste opp flere datasett. Det
        kan være lurt å ikke laste opp alt på en gang, så kartet holder seg ryddig og raskt.
      </p>
    </Popup>
  );
}
