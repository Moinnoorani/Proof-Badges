"use client";

import { useCallback, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  /** Maximum tilt in degrees on each axis. Defaults to 12. */
  intensity?: number;
  /** Render a soft glare layer that follows the cursor. Defaults to true. */
  glare?: boolean;
};

/**
 * TiltCard tracks the cursor over its surface and writes
 * --rx / --ry / --mx / --my CSS variables onto itself, which the
 * global `[data-tilt]` rule consumes for a 3D perspective tilt.
 *
 * Mouse moves are throttled with requestAnimationFrame and reset
 * smoothly on leave (transition is defined globally on [data-tilt]).
 */
export function TiltCard({
  children,
  className,
  intensity = 12,
  glare = true,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const frame = useRef<number | null>(null);
  const pending = useRef<{ x: number; y: number } | null>(null);

  const apply = useCallback(() => {
    frame.current = null;
    const el = ref.current;
    const pt = pending.current;
    if (!el || !pt) return;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const px = (pt.x - rect.left) / rect.width; // 0..1
    const py = (pt.y - rect.top) / rect.height; // 0..1
    const cx = px - 0.5;
    const cy = py - 0.5;

    // ry tilts left/right based on x; rx tilts up/down based on y (inverted).
    const ry = cx * intensity * 2;
    const rx = -cy * intensity * 2;

    el.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
    el.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
    el.style.setProperty("--mx", `${(px * 100).toFixed(2)}%`);
    el.style.setProperty("--my", `${(py * 100).toFixed(2)}%`);
  }, [intensity]);

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      pending.current = { x: e.clientX, y: e.clientY };
      if (frame.current == null) {
        frame.current = requestAnimationFrame(apply);
      }
    },
    [apply],
  );

  const handleLeave = useCallback(() => {
    if (frame.current != null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    pending.current = null;
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--mx", "50%");
    el.style.setProperty("--my", "50%");
  }, []);

  return (
    <div
      ref={ref}
      data-tilt
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={cn("group/tilt relative", className)}
    >
      {children}
      {glare && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100"
          style={{
            background:
              "radial-gradient(circle at var(--mx) var(--my), hsla(0 0% 100% / 0.18), transparent 45%)",
            mixBlendMode: "screen",
          }}
        />
      )}
    </div>
  );
}
