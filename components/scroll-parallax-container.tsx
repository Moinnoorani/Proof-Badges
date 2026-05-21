"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ScrollParallaxContainerProps {
  children: ReactNode;
  className?: string;
  /** Intensity multiplier for 3D rotation. Defaults to 0.0 */
  rotationIntensity?: number;
  /** Intensity multiplier for translation. Defaults to 1.0 */
  translationIntensity?: number;
  /** Whether to apply scale modifications. Defaults to true. */
  scaleEffect?: boolean;
  /** Whether to fade at the viewport boundaries. Defaults to true. */
  fadeEffect?: boolean;
}

export function ScrollParallaxContainer({
  children,
  className,
  rotationIntensity = 0.0,
  translationIntensity = 1.0,
  scaleEffect = true,
  fadeEffect = true,
}: ScrollParallaxContainerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Animation values
  const currentProgress = useRef(0.5); // Starts neutral
  const targetProgress = useRef(0.5);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let animId: number;
    let elementTop = 0;
    let elementHeight = 0;
    let isVisible = false;

    // Cache metrics relative to document to avoid getBoundingClientRect inside scroll loop
    const updateMetrics = () => {
      const rect = el.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset;
      elementTop = rect.top + scrollY;
      elementHeight = rect.height;
    };

    updateMetrics();

    const handleScroll = () => {
      if (!isVisible) return;

      const scrollY = window.scrollY || window.pageYOffset;
      const viewHeight = window.innerHeight;

      // Mathematically calculate top/bottom relative to viewport
      const rectTop = elementTop - scrollY;
      const rectBottom = rectTop + elementHeight;

      // Element is outside viewport bounds
      if (rectBottom < 0 || rectTop > viewHeight) return;

      // Calculate how far the element is through the viewport (0 = bottom entrance, 1 = top exit)
      const totalDist = viewHeight + elementHeight;
      const currentPos = viewHeight - rectTop;
      
      const rawProgress = currentPos / totalDist; // 0..1
      targetProgress.current = Math.max(0, Math.min(1, rawProgress));
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", () => {
      updateMetrics();
      handleScroll();
    });

    // Use IntersectionObserver to pause processing when element is out of view
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          updateMetrics();
          handleScroll();
        }
      },
      { rootMargin: "100px" } // trigger slightly before entering view
    );
    observer.observe(el);

    // Dynamic animation loop for smooth physical transition (lerp)
    const animate = () => {
      if (isVisible) {
        // Lerp transition
        currentProgress.current += (targetProgress.current - currentProgress.current) * 0.085;

        const p = currentProgress.current;
        // Normalised value relative to the center of the viewport (-0.5 to 0.5)
        const centerOffset = p - 0.5;

        const rotX = centerOffset * -18 * rotationIntensity;
        const transY = centerOffset * -40 * translationIntensity;
        const scale = scaleEffect ? 1 - Math.abs(centerOffset) * 0.05 : 1;
        const opacity = fadeEffect ? 1 - Math.abs(centerOffset) * 0.5 : 1;

        if (el) {
          el.style.transform = `
            perspective(1200px)
            rotateX(${rotX.toFixed(2)}deg)
            translateY(${transY.toFixed(2)}px)
            scale(${scale.toFixed(3)})
          `;
          if (fadeEffect) {
            el.style.opacity = opacity.toFixed(3);
          }
        }
      }

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateMetrics);
    };
  }, [rotationIntensity, translationIntensity, scaleEffect, fadeEffect]);

  return (
    <div
      ref={containerRef}
      className={cn("will-change-transform", className)}
      style={{
        transformStyle: "preserve-3d",
        transition: "opacity 0.2s ease-out", // smooth transition helper
      }}
    >
      {children}
    </div>
  );
}
