import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

// et step i en tour
type Step = { anchorId: string; text: string };

type Props = {
  open: boolean;
  steps: Step[];
  onClose: () => void;
  onComplete: () => void;
};

export default function Tour({ open, steps, onComplete }: Props) {
  const [index, setIndex] = useState(0); // current step
  const coachRef = useRef<HTMLDivElement>(null); // ref til boksen som viser teksten som beskriver steget
  const [pos, setPos] = useState<{
    // posisjonen til boksen
    top: number;
    left: number;
    placement: "below" | "above";
    caretOffsetX: number;
  }>({
    top: 0,
    left: 0,
    placement: "below",
    caretOffsetX: 24,
  });

  // Starter på steg 0 når tour åpnes
  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const step = steps[index];
  const anchorRect = useMemo(() => {
    // posisjonen til elementet vi skal feste boksen på
    if (!open || !step) return null;
    const el = document.getElementById(step.anchorId);
    return el ? el.getBoundingClientRect() : null;
  }, [open, step]);

  useEffect(() => {
    // legger til eller fjerner css-klasse for styling på aktivt element i navbaren
    if (!open || !step) return;
    const el = document.getElementById(step.anchorId);
    if (!el) return;
    el.classList.add("tour-active");
    return () => el.classList.remove("tour-active");
  }, [open, step]);

  function advance() {
    if (index < steps.length - 1) setIndex((i) => i + 1);
    else onComplete();
  }

  // Posisjonerer boksen på nytt ved endring av vindusstørrelse eller scroll
  useEffect(() => {
    if (!open) return;
    const onWin = () => positionCoach();
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);
    return () => {
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
    };
  }, [open, step]);

  // Plasserer boksen når den åpnes eller steget endres
  useLayoutEffect(() => {
    if (open) positionCoach();
  }, [open, step]);

  function positionCoach() {
    if (!anchorRect) return;
    const coachEl = coachRef.current;
    const margin = 8;
    const pageX = window.scrollX;
    const pageY = window.scrollY;

    const viewportH = window.innerHeight;
    const viewportW = window.innerWidth;
    const coachW = coachEl?.offsetWidth ?? 320;
    const coachH = coachEl?.offsetHeight ?? 120;

    // Sjekk om det er nok plass under eller over
    const enoughSpaceBelow = viewportH - anchorRect.bottom >= coachH + margin + 16;
    const placement: "below" | "above" = enoughSpaceBelow ? "below" : "above";

    const desiredTopBelow = anchorRect.bottom + pageY + margin;
    let top =
      placement === "below"
        ? desiredTopBelow
        : Math.max(12, anchorRect.top + pageY - coachH - margin);

    const anchorCenterX = anchorRect.left + pageX + anchorRect.width / 2;
    let left = Math.round(anchorCenterX - coachW / 2);
    const minLeft = 12;
    const maxLeft = viewportW + pageX - coachW - 12;
    left = Math.min(Math.max(left, minLeft), maxLeft);

    const caretOffsetX = Math.max(16, Math.min(coachW - 16, anchorCenterX - left));
    setPos({ top, left, placement, caretOffsetX });
  }

  if (!open || !step || !anchorRect) return null;

  return createPortal(
    <>
      <div className="tour-backdrop" onClick={advance} aria-hidden />

      <div
        className={`tour-coach ${pos.placement === "above" ? "is-above" : "is-below"}`}
        style={{ top: pos.top, left: pos.left }}
        ref={coachRef}
        role="popup"
        aria-live="polite"
        onClick={advance}
      >
        <div className="tour-content">
          <span className="tour-text">{step.text}</span>
        </div>

        <div
          className={`tour-caret ${pos.placement === "above" ? "down" : "up"}`}
          style={{ left: pos.caretOffsetX }}
        />
      </div>
    </>,
    document.body
  );
}
