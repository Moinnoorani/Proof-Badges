"use client";

import { useEffect, useRef } from "react";
import { Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";

interface InteractiveBadge3DProps {
  className?: string;
}

export function InteractiveBadge3D({ className }: InteractiveBadge3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Spring physics variables
  const tiltX = useRef(0);
  const tiltY = useRef(0);
  const scrollZ = useRef(0);
  const scrollRotate = useRef(0);
  const hoverScale = useRef(1);

  const targetTiltX = useRef(0);
  const targetTiltY = useRef(0);
  const targetScrollZ = useRef(0);
  const targetScrollRotate = useRef(0);
  const targetHoverScale = useRef(1);

  useEffect(() => {
    let animId: number;
    const el = containerRef.current;
    if (!el) return;

    let elementPageTop = 0;
    let elementPageLeft = 0;
    let halfWidth = 0;
    let halfHeight = 0;

    const updateMetrics = () => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset;
      const scrollX = window.scrollX || window.pageXOffset;
      elementPageTop = rect.top + scrollY;
      elementPageLeft = rect.left + scrollX;
      halfWidth = rect.width / 2;
      halfHeight = rect.height / 2;
    };

    updateMetrics();

    const handleMouseMove = (e: MouseEvent) => {
      const scrollY = window.scrollY || window.pageYOffset;
      const scrollX = window.scrollX || window.pageXOffset;

      const badgeX = elementPageLeft - scrollX + halfWidth;
      const badgeY = elementPageTop - scrollY + halfHeight;

      // Distance to cursor using cached values
      const dx = e.clientX - badgeX;
      const dy = e.clientY - badgeY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // We tilt if mouse is within 450px of the badge
      const activeRadius = 450;
      if (dist < activeRadius) {
        // Linear scale strength: close is stronger, max 22 degrees
        const strength = (1 - dist / activeRadius) * 22;
        
        // Target tilt angles (X tilt depends on Y displacement, Y tilt depends on X displacement)
        targetTiltX.current = -(dy / dist) * strength;
        targetTiltY.current = (dx / dist) * strength;
        targetHoverScale.current = 1.05 + (1 - dist / activeRadius) * 0.05;
      } else {
        // Return to neutral float
        targetTiltX.current = 0;
        targetTiltY.current = 0;
        targetHoverScale.current = 1;
      }
    };

    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      // Rotate badge based on scroll depth
      targetScrollRotate.current = scrollY * 0.28; // 0.28 degrees per pixel
      
      // Sink badge in Z space as we scroll down (gives physical depth parallax)
      targetScrollZ.current = Math.max(-120, scrollY * -0.15);
    };

    // Listeners
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateMetrics);

    // Custom animation loop for physics springs
    const tick = () => {
      // Lerp (Linear Interpolation) for buttery smooth spring animation
      tiltX.current += (targetTiltX.current - tiltX.current) * 0.08;
      tiltY.current += (targetTiltY.current - tiltY.current) * 0.08;
      scrollZ.current += (targetScrollZ.current - scrollZ.current) * 0.08;
      scrollRotate.current += (targetScrollRotate.current - scrollRotate.current) * 0.08;
      hoverScale.current += (targetHoverScale.current - hoverScale.current) * 0.08;

      if (el) {
        // Floating micro-sway effect overlayed on top of interaction
        const time = Date.now() * 0.0015;
        const swayX = Math.sin(time) * 1.5;
        const swayY = Math.cos(time * 0.8) * 1.5;
        const swayZ = Math.sin(time * 1.2) * 5;

        // Apply 3D matrix transform to the preserve-3d wrapper
        const rotX = tiltX.current + swayX;
        const rotY = tiltY.current + swayY;
        const rotZ = scrollRotate.current;
        const zTrans = scrollZ.current + swayZ;

        el.style.transform = `
          perspective(1500px)
          rotateX(${rotX.toFixed(2)}deg)
          rotateY(${rotY.toFixed(2)}deg)
          rotateZ(${rotZ.toFixed(2)}deg)
          translateZ(${zTrans.toFixed(2)}px)
          scale(${hoverScale.current.toFixed(3)})
        `;
      }

      animId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateMetrics);
    };
  }, []);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none relative size-[280px] sm:size-[340px] select-none",
        className
      )}
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Physics dynamic 3D elements wrapper */}
      <div
        ref={containerRef}
        className="relative size-full transition-transform duration-100 ease-out"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Layer 1: Back glow halo */}
        <div
          className="absolute inset-0 rounded-full blur-3xl opacity-80"
          style={{
            transform: "translateZ(-100px)",
            background:
              "radial-gradient(closest-side, hsla(268 95% 65% / 0.65), hsla(192 95% 60% / 0.25) 50%, transparent 80%)",
          }}
        />

        {/* Layer 2: Conic gradient outer ring (slow forward spin) */}
        <div
          className="absolute inset-2 rounded-full bg-gradient-conic animate-spin-slow opacity-95"
          style={{ 
            transform: "translateZ(-40px)",
            boxShadow: "0 0 40px hsla(268 95% 70% / 0.3)"
          }}
        />

        {/* Layer 3: Conic ring inner mask */}
        <div
          className="absolute inset-2 rounded-full bg-background"
          style={{
            transform: "translateZ(-38px)",
            WebkitMask: "radial-gradient(circle, transparent 58%, #000 59%, #000 100%)",
            mask: "radial-gradient(circle, transparent 58%, #000 59%, #000 100%)",
          }}
        />

        {/* Layer 4: Reverse-spinning dashed edge ring */}
        <div
          className="absolute inset-6 rounded-full border border-dashed border-white/20 animate-spin-reverse"
          style={{ transform: "translateZ(10px)" }}
        />

        {/* Layer 5: Inner glass disc */}
        <div
          className="glass-strong absolute inset-10 flex items-center justify-center rounded-full overflow-hidden"
          style={{
            transform: "translateZ(60px)",
            boxShadow:
              "0 30px 80px -20px hsla(268 95% 50% / 0.6), inset 0 1px 0 hsla(0 0% 100% / 0.2)",
          }}
        >
          {/* gradient sheen */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(140deg, hsla(252 95% 70% / 0.65), hsla(280 95% 60% / 0.3) 45%, hsla(192 95% 60% / 0.55))",
            }}
          />
          
          {/* shimmer streak */}
          <div className="shimmer absolute inset-0 opacity-80" />
          
          {/* Icon */}
          <Hexagon
            className="relative z-10 size-20 text-white drop-shadow-[0_8px_32px_rgba(168,85,247,0.75)] transition-transform duration-300"
            style={{ transform: "translateZ(20px)" }}
            strokeWidth={1.25}
          />
          
          {/* center spark */}
          <div
            className="absolute size-6 rounded-full bg-white/95 blur-md"
            style={{ transform: "translate(35%, -35%)" }}
          />
        </div>

        {/* Layer 6: Front glossy highlight */}
        <div
          className="absolute inset-10 rounded-full pointer-events-none"
          style={{
            transform: "translateZ(85px)",
            background:
              "radial-gradient(circle at 30% 25%, hsla(0 0% 100% / 0.4), transparent 45%)",
            mixBlendMode: "screen",
          }}
        />

        {/* Layer 7: Floating orbit dot 1 */}
        <div
          className="absolute left-1/2 top-1/2 size-4.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan glow-cyan animate-spin-slow"
          style={{ transform: "translate3d(-50%, -50%, 100px) translateX(155px)" }}
        />
        
        {/* Layer 8: Floating orbit dot 2 */}
        <div
          className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink animate-spin-reverse"
          style={{ transform: "translate3d(-50%, -50%, 120px) translateX(-135px)" }}
        />
      </div>
    </div>
  );
}
