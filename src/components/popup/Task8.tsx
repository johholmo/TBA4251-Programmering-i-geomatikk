import Popup from "./Popup";

export default function Task8({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Oppgave 8 – Unngå for bratte områder"
      step={8}
      totalSteps={10}
      highlightColor="var(--brand)"
      actions={[{ label: "Lukk", variant: "primary", onClick: onClose }]}
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
