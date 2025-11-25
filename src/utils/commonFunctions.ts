// Funksjon for å gjøre en farge mer gjennomsiktig
export function toTransparent(color: string, alpha: number) {
  if (color.startsWith("rgb")) return color;
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function randomPastel() {
  // Fine lyse farger som passer paletten
  const colors = ["#5D866C", "#C2A68C", "#8AA78F", "#B8A089", "#7DA48F"];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Farger for lag i kartet
export const LAYER_PALETTE = [
  "#e11d48",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#f43f5e",
  "#84cc16",
  "#0f766e",
];

// Hent en tilfeldig farge fra paletten
export function randomColor() {
  return LAYER_PALETTE[Math.floor(Math.random() * LAYER_PALETTE.length)];
}
