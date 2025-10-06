import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Step = {
  anchorId: string;     // element id to point at
  text: string;         // info only (no title)
};

type Props = {
  open: boolean;
  steps: Step[];
  onClose: () => void;
  onComplete: () => void;
};

export default function Tour({ open, steps, onClose, onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const coachRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; placement: "below" | "above"; caretOffsetX: number }>({
    top: 0, left: 0, placement: "below", caretOffsetX: 24,
  });

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const step = steps[index];

  const anchorRect = useMemo(() => {
    if (!open || !step) return null;
    const el = document.getElementById(step.anchorId);
    return el ? el.getBoundingClientRect() : null;
  }, [open, step]);

  // Recompute on resize/scroll for responsive placement
  useEffect(() => {
    if (!open) return;
    const onWin = () => positionCoach();
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);
    return () => {
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step]);

  useLayoutEffect(() => {
    if (!open) return;
    positionCoach();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step]);

  function positionCoach() {
    if (!anchorRect) return;
    const coachEl = coachRef.current;
    const margin = 8; // gap from button
    const pageX = window.scrollX;
    const pageY = window.scrollY;

    // Desired: popup under the toolbar button
    const desiredTopBelow = anchorRect.bottom + pageY + margin;

    // Fallback: above if not enough space below
    const viewportH = window.innerHeight;
    const viewportW = window.innerWidth;
    const coachW = coachEl?.offsetWidth ?? 320;
    const coachH = coachEl?.offsetHeight ?? 120;

    const enoughSpaceBelow = viewportH - anchorRect.bottom >= coachH + margin + 16;
    const placement: "below" | "above" = enoughSpaceBelow ? "below" : "above";

    let top = placement === "below"
      ? desiredTopBelow
      : Math.max(12, anchorRect.top + pageY - coachH - margin);

    // Center horizontally to anchor; clamp inside viewport
    const anchorCenterX = anchorRect.left + pageX + anchorRect.width / 2;
    let left = Math.round(anchorCenterX - coachW / 2);

    const minLeft = 12;
    const maxLeft = viewportW + pageX - coachW - 12;
    left = Math.min(Math.max(left, minLeft), maxLeft);

    // caret offset from coach left edge to point toward anchor center
    const caretOffsetX = Math.max(16, Math.min(coachW - 16, anchorCenterX - left));

    setPos({ top, left, placement, caretOffsetX });
  }

  if (!open || !step || !anchorRect) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="tour-backdrop" onClick={onClose} aria-hidden />

      {/* Highlight ring around the tool button */}
      <div
        className="tour-highlight"
        style={{
          top: anchorRect.top + window.scrollY - 8,
          left: anchorRect.left + window.scrollX - 8,
          width: anchorRect.width + 16,
          height: anchorRect.height + 16
        }}
      />

      {/* Coach (popup) */}
      <div
        className={`tour-coach ${pos.placement === "above" ? "is-above" : "is-below"}`}
        style={{ top: pos.top, left: pos.left }}
        ref={coachRef}
        role="dialog"
        aria-live="polite"
      >
        <div className="tour-content">
            <span className="tour-text">{step.text}</span>
            {index < steps.length - 1 ? (
            <button className="tour-next-btn" onClick={() => setIndex(i => i + 1)}>→</button>
          ) : (
            <button className="tour-next-btn" onClick={onComplete}>→</button>
          )}
            </div>

        {/* Caret that points to the tool */}
        <div
          className={`tour-caret ${pos.placement === "above" ? "down" : "up"}`}
          style={{ left: pos.caretOffsetX }}
        />
      </div>
    </>,
    document.body
  );
}
