import { useEffect, useRef, useState } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useLayers, LAYER_PALETTE } from "../context/LayersContext";
import { IconEye, IconEyeOff, IconTrash } from "../utils/icons";

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
  const { layers, setVisibility, removeLayer, reorderLayers, setColor, setName } = useLayers(); // Henter fra layercontext
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
