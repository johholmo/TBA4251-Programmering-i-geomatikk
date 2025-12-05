# TBA4251 Programmering i Geomatikk

Dette prosjektet er en interaktiv webapplikasjon for geomatikkfaget TBA4251 ved NTNU. Applikasjonen lar brukere utføre ulike GIS-operasjoner på geografiske datasett, med fokus på analyse av byggeområder, veier, vannflater og andre relevante lag for Trondheim kommune og NTNU-campuser.

Applikasjonen kan finnes på https://johholmo.github.io/TBA4251-Programmering-i-geomatikk/.

## Hovedfunksjoner

- **Kartvisning** med Mapbox GL og Leaflet
- **Laster opp og visualiserer GeoJSON-lag**
- **Verktøy for GIS-analyse:**
  - Klipp (Clip)
  - Buffer
  - Union
  - Intersect
  - Difference
  - AreaFilter (filter på areal)
  - FeatureExtractor (filter på attributter)
- **Oppgavesystem** med veiledning for stegvis GIS-analyse
- **Sidebar for laghåndtering** (synlighet, rekkefølge, sletting, zoom)
- **Popup-dialoger** for verktøy og oppgaver

## Teknologi

- React + TypeScript
- Vite
- Mapbox GL, Leaflet, Turf.js
- Zustand for state management
- Eslint og Prettier for kodekvalitet

## Datasett

GeoJSON-filer ligger i `data/`-mappen:

- Bygning.geojson
- Elv.geojson
- Havflate.geojson
- Innsjø.geojson
- Kanal.geojson
- NTNU_campuser.geojson
- Trondheim_kommune.geojson
- Vei.geojson

## Mappestruktur

- `src/` – Kildekode
  - `components/` – UI-komponenter og GIS-verktøy
  - `context/` – Zustand context for lag
  - `stores/` – Zustand store for lag
  - `types/` – Type-definisjoner
  - `utils/` – Fellesfunksjoner og ikoner
  - `workers/` – Web workers for tunge GIS-operasjoner
- `data/` – GeoJSON datasett
- `public/` – Offentlige filer

## Oppgaver

Applikasjonen inneholder 11 oppgaver som guider brukeren gjennom GIS-analyse, fra opplasting av lag til avanserte operasjoner som buffer, klipp og attributtfiltrering.
