import Popup from "./Popup";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAdvance: () => void;
};

export default function Task2({ isOpen, onClose, onAdvance }: Props) {
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title="Oppgave 2 – Tegn avgrensning og klipp data"
      actions={[
        { label: "Lukk", variant: "secondary", onClick: onClose },
        { label: "Neste oppgave", variant: "primary", onClick: onAdvance },
      ]}
    >
      <p>
        Nå skal vi begrense analysen til et mindre område i Trondheim. I kartet har du en{" "}
        <b>polygon-knapp</b> (tegneverktøyet rett under zoom-knappene). Bruk den til å tegne et
        polygon rundt området du vil jobbe videre med.
      </p>
      <p>
        Klikk deg rundt området for å lage polygonet, og avslutt ved å klikke på første punkt igjen.
        Når du lagrer polygonet blir det dukker det opp som et eget lag i oversikten til venstre.
      </p>
      <p>
        Deretter åpner du <b>Clip</b>-verktøyet i verktøylinjen, velger datasettet du lastet opp i
        oppgave 1 som <i>lag som skal klippes</i>, og polygonet du nettopp tegnet som{" "}
        <i>klipp mot</i>. Da får du et nytt, klippet lag som bare dekker området du tegnet.
      </p>
      <p>
        Når du ser at klippet laget er på plass i sidebaren kan du gjerne slette det opprinnelige,
        uklippede laget for å holde prosjektet ryddig.
      </p>
      <p>
        Når du har: <b>1)</b> tegnet polygonet, <b>2)</b> klippet datasettet mot det, og <b>3)</b>{" "}
        ryddet opp i lagene – da kan du gå videre til neste oppgave.
      </p>
    </Popup>
  );
}
