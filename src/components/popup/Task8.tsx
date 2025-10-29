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
      title="Oppgave 8 – Unngå for bratte områder"
      step={8}
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
        Terreng med høy helning er uegnet for store bygg. Importer et høydelag (DEM) og bruk{" "}
        <b>Helning-verktøyet</b> for å beregne skråningsgrad.
      </p>

      <p>
        Filtrer bort områder med helning over <b>15°</b> slik at du kun sitter igjen med flate og
        lett skrånende områder som egner seg for bygging.
      </p>
    </Popup>
  );
}
