import { cn } from "@/lib/utils";

/**
 * Aurora background — fixed, full-viewport ambient layer.
 * Three radial-gradient blobs drift via animate-aurora-1/2/3,
 * with a faded grid + noise overlay for depth.
 *
 * Render once near the root of the layout. Pointer-events disabled.
 */
export function AuroraBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        className,
      )}
    >
      {/* Aurora blob 1 — violet */}
      <div
        className="absolute -top-1/3 -left-1/4 size-[60rem] animate-aurora-1 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, hsla(252 95% 65% / 0.55), hsla(268 95% 60% / 0.25) 45%, transparent 75%)",
        }}
      />
      {/* Aurora blob 2 — pink/violet */}
      <div
        className="absolute top-1/4 -right-1/4 size-[55rem] animate-aurora-2 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, hsla(330 95% 65% / 0.45), hsla(280 95% 60% / 0.22) 45%, transparent 75%)",
        }}
      />
      {/* Aurora blob 3 — cyan */}
      <div
        className="absolute -bottom-1/3 left-1/4 size-[60rem] animate-aurora-3 rounded-full opacity-45 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, hsla(192 95% 60% / 0.45), hsla(220 95% 60% / 0.18) 45%, transparent 75%)",
        }}
      />

      {/* Grid overlay with radial fade */}
      <div className="absolute inset-0 grid-bg grid-bg-fade opacity-70" />

      {/* Top vignette to deepen the header area */}
      <div
        className="absolute inset-x-0 top-0 h-64"
        style={{
          background:
            "linear-gradient(to bottom, hsla(240 12% 3% / 0.7), transparent)",
        }}
      />

      {/* Subtle noise */}
      <div className="absolute inset-0 noise" />
    </div>
  );
}
