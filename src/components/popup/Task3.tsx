import Popup from "./Popup";

type Props3 = {
  isOpen: boolean;
  onClose: () => void;
  onAdvance: () => void;
};

export default function Task3({ isOpen, onClose, onAdvance }: Props3) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Oppgave 3 – Vann og flomsoner"
      actions={[
        { label: "Lukk", variant: "secondary", onClick: onClose },
        { label: "Neste oppgave", variant: "primary", onClick: onAdvance },
      ]}
    >
      <p>
        Nå skal vi finne de områdene som <b>ikke</b> egner seg til bygging på grunn av vann. Vi
        bruker både vann- og flomsone-data, og lager én samlet “ikke bygg her”-flate.
      </p>

      <p>
        1. Last opp <b>FKB-Vann</b> og <b>Flomsoner</b>. Klipp dem gjerne først til området du
        tegnet i oppgave 2 slik at det blir mer oversiktlig og ikke for mye data å holde styr på.
      </p>

      <p>
        2. Bruk <b>Buffer</b>-verktøyet på det klippede vannlaget og lag en buffer på f.eks.{" "}
        <b>200 meter</b>. Dette gir deg et datalag med områder innenfor 200 meter fra vannet.
      </p>

      <p>
        3. Bruk <b>Union</b>-verktøyet til å slå sammen <b> vann-bufferen</b> og <b>flomsonene</b>{" "}
        til ett lag. Dette blir flaten som sier “her bygger vi ikke”.
      </p>

      <p>
        Når du har laget datalaget for områder det ikke skal bygges på pga vann, kan du gå videre
        til neste oppgave.
      </p>
    </Popup>
  );
}
