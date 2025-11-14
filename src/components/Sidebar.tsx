import { useEffect, useRef, useState } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useLayers, LAYER_PALETTE } from "../context/LayersContext";

// SVG-ikoner med styling
const IconEye = ({ stroke = "#111" }: { stroke?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
      stroke={stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" stroke={stroke} strokeWidth="2" />
  </svg>
);

const IconEyeOff = ({ stroke = "#555" }: { stroke?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M3 3l18 18" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    <path
      d="M9.9 4.24A10.94 10.94 0 0 1 12 4c6.5 0 10 8 10 8a17.6 17.6 0 0 1-3.07 4.51M6.47 6.47C3.87 8.12 2 12 2 12a17.63 17.63 0 0 0 3.54 4.71"
      stroke={stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconTrash = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M3 6h18" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
      stroke="#dc2626"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
      stroke="#dc2626"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path d="M10 11v6M14 11v6" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Sorterbart element
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

  const dragHandle = (
    <div
      {...attributes}
      {...listeners}
      style={{
        width: 14,
        height: 26,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 3,
        cursor: "grab",
      }}
      aria-label="Flytt lag"
      title="Dra for å endre rekkefølge"
    >
      <span style={{ width: "100%", height: 2, background: "#cbd5e1", borderRadius: 999 }} />
      <span style={{ width: "100%", height: 2, background: "#cbd5e1", borderRadius: 999 }} />
      <span style={{ width: "100%", height: 2, background: "#cbd5e1", borderRadius: 999 }} />
    </div>
  );

  return (
    <li ref={setNodeRef} style={style} className="layer-item">
      {children(dragHandle)}
    </li>
  );
}

// Hoved-komponenten til sidebaren
export default function Sidebar() {
  const { layers, setVisibility, removeLayer, reorderLayers, setColor, setName } = useLayers(); // Henter fra layercontext

  // dnd-kit stuff
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

  // tekst over lagene
  const tipText =
    layers.length === 0
      ? "Ingen lag lastet."
      : "Dra og slipp lagene for å endre rekkefølgen. Nederst i listen = øverst i kartet. Du kan også endre navn og farge, eller gjøre lagene synlige/usynlige.";

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      const oldIndex = layers.findIndex((l) => l.id === active.id);
      const newIndex = layers.findIndex((l) => l.id === over.id);
      reorderLayers(oldIndex, newIndex);
    }
  };

  const startEdit = (id: string, current: string) => {
    setEditingId(id);
    setDraftName(current);
    setOpenPaletteFor(null);
  };

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
        <div className="sidebar sidebar-wide" ref={sidebarRef}>
          <h4>Lag</h4>
          <p className="muted">{tipText}</p>

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
                        className="icon-btn danger"
                        onClick={() => removeLayer(l.id)}
                        aria-label="Slett lag"
                        title="Slett lag"
                      >
                        <IconTrash />
                      </button>
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
