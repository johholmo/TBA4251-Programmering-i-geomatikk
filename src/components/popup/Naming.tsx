import { useState, useEffect } from "react";
import Popup from "./Popup";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  title?: string;
  label?: string;
  defaultValue?: string;
};

export default function Naming({
  isOpen,
  onClose,
  onConfirm,
  title = "Navngi polygonlaget",
  label = "Skriv inn navn:",
  defaultValue = "",
}: Props) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      width="narrow"
      actions={[
        { label: "Avbryt", variant: "secondary", onClick: onClose },
        {
          label: "OK",
          variant: "primary",
          onClick: () => {
            const trimmed = value.trim();
            if (!trimmed) return;
            onConfirm(trimmed);
            onClose();
          },
        },
      ]}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={{ fontWeight: 500 }}>{label}</label>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Eks: Area of Interest"
          style={{
            padding: 8,
            borderRadius: 6,
            border: "1px solid var(--border)",
            fontSize: "1rem",
          }}
        />
      </div>
    </Popup>
  );
}
