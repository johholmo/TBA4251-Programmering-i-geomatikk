export default function Sidebar() {
    // Tomt skjelett – her kommer lagliste (øyeknapp, opasitet, rekkefølge osv.)
    return (
      <div className="sidebar">
        <div className="sidebar-header">
          <h3>Lag</h3>
          <button className="mini-btn" type="button" title="Legg til demo-data" onClick={() => alert("Legg inn demo-data…")}>
            + Demo
          </button>
        </div>
  
        <div className="sidebar-empty">
          <p>Ingen lag enda.</p>
          <p>
            Bruk <b>Last opp data</b> i verktøylinjen, eller <b>+ Demo</b> for å komme i gang.
          </p>
        </div>
      </div>
    );
  }
  