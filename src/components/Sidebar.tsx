import { useEffect, useRef, useState } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useLayers } from "../context/LayersContext";
import { IconEye, IconEyeOff, IconTrash, IconZoom } from "../utils/icons";
import { LAYER_PALETTE } from "../utils/commonFunctions";

// Sorterbart element - gjør det mulig å dra elementene i sidebaren
function SortableItem({
  id,
  children,
}: {
  id: string;
  children: (dragHandle: React.ReactNode) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // De tre strekene vi drar laget i
  const dragHandle = (
    <div
      {...attributes}
      {...listeners}
      className="layer-drag-handle"
      aria-label="Flytt lag"
      title="Dra for å endre rekkefølge"
    >
      <span className="drag-span" />
      <span className="drag-span" />
      <span className="drag-span" />
    </div>
  );

  return (
    <li ref={setNodeRef} style={style} className="layer-item">
      {children(dragHandle)}
    </li>
  );
}

export default function Sidebar() {
  // henter lagene fra layercontext
  const { layers, setVisibility, removeLayer, reorderLayers, setColor, setName } = useLayers();
  // For zoom-to-layer
  const [mapInstance, setMapInstance] = useState<any>(null);
  // Hent mapbox-gl map instance fra window
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).mapboxglMap) {
      setMapInstance((window as any).mapboxglMap);
    } else if (typeof window !== "undefined") {
      const tryGetMap = () => {
        if ((window as any).mapboxglMap) {
          setMapInstance((window as any).mapboxglMap);
        } else {
          setTimeout(tryGetMap, 500);
        }
      };
      tryGetMap();
    }
  }, []);

  // Zoom to layer handler
  function zoomToLayer(geojson: any) {
    if (!mapInstance || !geojson || !geojson.features || geojson.features.length === 0) return;
    // Finn bbox
    const coords = geojson.features.flatMap((f: any) => {
      if (!f.geometry) return [];
      if (f.geometry.type === "Point") return [f.geometry.coordinates];
      if (f.geometry.type === "MultiPoint" || f.geometry.type === "LineString")
        return f.geometry.coordinates;
      if (f.geometry.type === "MultiLineString" || f.geometry.type === "Polygon")
        return f.geometry.coordinates.flat();
      if (f.geometry.type === "MultiPolygon") return f.geometry.coordinates.flat(2);
      return [];
    });
    if (!coords.length) return;
    let minX = coords[0][0],
      minY = coords[0][1],
      maxX = coords[0][0],
      maxY = coords[0][1];
    coords.forEach(([x, y]: [number, number]) => {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    });
    mapInstance.fitBounds(
      [
        [minX, minY],
        [maxX, maxY],
      ],
      { padding: 60, duration: 800 }
    );
  }
  const sensors = useSensors(useSensor(PointerSensor));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [openPaletteFor, setOpenPaletteFor] = useState<string | null>(null);

  // legg ref rundt hele sidebar
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      // lukk farge-popup ved klikk utenfor
      if (!sidebarRef.current) return;
      if (openPaletteFor && !sidebarRef.current.contains(e.target as Node)) {
        setOpenPaletteFor(null);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [openPaletteFor]);

  // info-tekst over lagene
  const tipText =
    layers.length === 0
      ? "Ingen lag lastet."
      : "Dra og slipp lagene for å endre rekkefølgen. Nederst i listen = øverst i kartet. Du kan også endre navn og farge, eller gjøre lagene synlige/usynlige.";

  // drag and drop lagene
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      const oldIndex = layers.findIndex((l) => l.id === active.id);
      const newIndex = layers.findIndex((l) => l.id === over.id);
      reorderLayers(oldIndex, newIndex);
    }
  };
  // endre navn
  const startEdit = (id: string, current: string) => {
    setEditingId(id);
    setDraftName(current);
    setOpenPaletteFor(null);
  };
  // lagre endring av navn
  const commitEdit = () => {
    if (editingId) {
      const trimmed = draftName.trim();
      if (trimmed) setName(editingId, trimmed);
      setEditingId(null);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={layers.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div className="sidebar" ref={sidebarRef}>
          <h4>Lag</h4>
          <p className="info-text">{tipText}</p>

          <ul className="layer-list">
            {layers.map((l) => {
              const paletteOpen = openPaletteFor === l.id;

              return (
                <SortableItem key={l.id} id={l.id}>
                  {(dragHandle) => (
                    <>
                      {dragHandle}

                      <button
                        className="icon-btn"
                        onClick={() => setVisibility(l.id, !l.visible)}
                        aria-label={l.visible ? "Skjul lag" : "Vis lag"}
                        title={l.visible ? "Skjul lag" : "Vis lag"}
                      >
                        {l.visible ? <IconEye /> : <IconEyeOff />}
                      </button>

                      <div
                        className="layer-name"
                        title={l.name}
                        onDoubleClick={() => startEdit(l.id, l.name)}
                      >
                        {editingId === l.id ? (
                          <input
                            autoFocus
                            className="rename-input"
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitEdit();
                              if (e.key === "Escape") setEditingId(null);
                            }}
                          />
                        ) : (
                          <span>{l.name}</span>
                        )}
                      </div>

                      <div className="layer-actions">
                        <div className="color-wrapper">
                          <button
                            className="color-chip"
                            style={{ backgroundColor: l.color }}
                            onClick={() => setOpenPaletteFor(paletteOpen ? null : l.id)}
                            aria-label="Endre farge"
                          />
                          {paletteOpen && (
                            <div className="color-popover" role="menu" style={{ zIndex: 9999 }}>
                              {LAYER_PALETTE.map((c) => (
                                <button
                                  key={c}
                                  className="color-option"
                                  style={{
                                    backgroundColor: c,
                                    outline: l.color === c ? "2px solid #111" : "none",
                                  }}
                                  onClick={() => {
                                    setColor(l.id, c);
                                    setOpenPaletteFor(null);
                                  }}
                                  aria-label={`Velg farge ${c}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          className="icon-btn"
                          onClick={() => zoomToLayer(l.geojson4326)}
                          aria-label="Zoom til lag"
                          title="Zoom til lag"
                        >
                          <IconZoom />
                        </button>

                        <button
                          className="icon-btn danger"
                          onClick={() => removeLayer(l.id)}
                          aria-label="Slett lag"
                          title="Slett lag"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </>
                  )}
                </SortableItem>
              );
            })}
          </ul>
        </div>
      </SortableContext>
    </DndContext>
  );
}
