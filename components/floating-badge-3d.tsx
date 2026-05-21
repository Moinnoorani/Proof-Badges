import { Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * FloatingBadge3D — a pure CSS/SVG decorative ornament for the hero.
 *
 * Layers (back to front, in 3D space via preserve-3d):
 *   1. Back glow halo
 *   2. Slow-spinning conic gradient ring
 *   3. Reverse-spinning edge ring (dashed)
 *   4. Front face with gradient + hexagon icon
 *
 * Wraps in a perspective container and floats with animate-float-rotate.
 * Decorative only — aria-hidden.
 */
export function FloatingBadge3D({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "perspective-1500 pointer-events-none relative size-[280px] sm:size-[340px]",
        className,
      )}
    >
      <div className="preserve-3d relative size-full animate-float-rotate">
        {/* Back glow */}
        <div
          className="absolute inset-0 rounded-full blur-2xl"
          style={{
            transform: "translateZ(-80px)",
            background:
              "radial-gradient(closest-side, hsla(268 95% 65% / 0.65), hsla(192 95% 60% / 0.25) 50%, transparent 80%)",
          }}
        />

        {/* Conic gradient outer ring (slow forward spin) */}
        <div
          className="absolute inset-2 rounded-full bg-gradient-conic animate-spin-slow opacity-90"
          style={{ transform: "translateZ(-20px)" }}
        />

        {/* Mask the conic into a thin ring */}
        <div
          className="absolute inset-2 rounded-full bg-background"
          style={{
            transform: "translateZ(-19px)",
            clipPath:
              "polygon(50% 50%, 50% 50%, 50% 50%)" /* unused */,
            WebkitMask:
              "radial-gradient(circle, transparent 56%, #000 57%, #000 100%)",
            mask: "radial-gradient(circle, transparent 56%, #000 57%, #000 100%)",
          }}
        />

        {/* Reverse-spinning dashed edge ring */}
        <div
          className="absolute inset-6 rounded-full border border-dashed border-white/15 animate-spin-reverse"
          style={{ transform: "translateZ(10px)" }}
        />

        {/* Inner glass disc */}
        <div
          className="glass-strong absolute inset-10 flex items-center justify-center rounded-full overflow-hidden"
          style={{
            transform: "translateZ(40px)",
            boxShadow:
              "0 30px 80px -20px hsla(268 95% 50% / 0.55), inset 0 1px 0 hsla(0 0% 100% / 0.15)",
          }}
        >
          {/* gradient sheen */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(140deg, hsla(252 95% 70% / 0.55), hsla(280 95% 60% / 0.25) 45%, hsla(192 95% 60% / 0.45))",
            }}
          />
          {/* shimmer streak */}
          <div className="shimmer absolute inset-0" />
          {/* Icon */}
          <Hexagon
            className="relative z-10 size-20 text-white drop-shadow-[0_4px_24px_rgba(168,85,247,0.6)]"
            strokeWidth={1.25}
          />
          {/* center spark */}
          <div
            className="absolute size-6 rounded-full bg-white/80 blur-md"
            style={{ transform: "translate(35%, -35%)" }}
          />
        </div>

        {/* Front glossy highlight */}
        <div
          className="absolute inset-10 rounded-full"
          style={{
            transform: "translateZ(50px)",
            background:
              "radial-gradient(circle at 30% 25%, hsla(0 0% 100% / 0.35), transparent 40%)",
            mixBlendMode: "screen",
          }}
        />

        {/* Floating orbit dot 1 */}
        <div
          className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan glow-cyan animate-spin-slow"
          style={{ transform: "translate3d(-50%, -50%, 60px) translateX(150px)" }}
        />
        {/* Floating orbit dot 2 */}
        <div
          className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink animate-spin-reverse"
          style={{ transform: "translate3d(-50%, -50%, 80px) translateX(-130px)" }}
        />
      </div>
    </div>
  );
}
