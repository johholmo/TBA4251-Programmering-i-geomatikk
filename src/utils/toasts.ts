import { useToast } from "./CustomToastProvider";

// React hook versjon til å bruke inne i komponenter
export function useNoOverlapToast() {
  const { showToast } = useToast();
  return (layers: string[]) => {
    if (!layers.length) return;
    showToast(
      layers.length === 1
        ? `Datalaget ${layers[0]} overlapper ikke med området du prøver å klippe mot, og det ble derfor ikke klippet.`
        : `Datalagene ${layers.join(", ")} overlapper ikke med området du prøver å klippe mot, og det ble derfor ikke klippet.`,
      3500
    );
  };
}
