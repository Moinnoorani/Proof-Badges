"use client";

import { useEffect, useRef } from "react";

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  baseSize: number;
  color: RGB;
  speed: number;
}

interface Spark {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  color: RGB;
  alpha: number;
  decay: number;
  gravity: number;
}

export function InteractiveCanvas3D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const sparks: Spark[] = [];
    
    // Canvas sizing
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let centerX = width / 2;
    let centerY = height / 2;

    // Viewport-based settings
    const particleCount = Math.min(30, Math.floor((width * height) / 45000));
    const fov = 400; // camera focal length
    const maxDepth = 1000;

    // Rotation variables (mouse driven)
    let targetRotateX = 0;
    let targetRotateY = 0;
    let currentRotateX = 0;
    let currentRotateY = 0;

    // Scroll variables
    let lastScrollY = window.scrollY;
    let targetScrollSpeed = 0;
    let currentScrollSpeed = 0;

    // RGB color palettes for high performance blending
    const colors: RGB[] = [
      { r: 168, g: 85, b: 247 }, // Violet
      { r: 99, g: 102, b: 241 }, // Indigo
      { r: 6, g: 182, b: 212 },  // Cyan
      { r: 236, g: 72, b: 153 }, // Pink
    ];

    const sparkColors: RGB[] = [
      { r: 192, g: 132, b: 252 }, // violet light
      { r: 129, g: 140, b: 248 }, // indigo light
      { r: 34, g: 211, b: 238 },  // cyan light
      { r: 244, g: 114, b: 182 }, // pink light
      { r: 255, g: 255, b: 255 }, // pure white
    ];

    // Initialize background particles
    const initParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 200 + Math.random() * (width * 0.6);
        
        particles.push({
          x: Math.cos(angle) * radius,
          y: (Math.random() - 0.5) * height * 1.5,
          z: Math.random() * maxDepth,
          baseSize: 1 + Math.random() * 1.8,
          color: colors[Math.floor(Math.random() * colors.length)],
          speed: 0.2 + Math.random() * 0.5,
        });
      }
    };

    initParticles();

    // Event listeners
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      centerX = width / 2;
      centerY = height / 2;
      initParticles();
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetRotateX = ((e.clientY - centerY) / height) * 0.22;
      targetRotateY = ((e.clientX - centerX) / width) * 0.22;
    };

    const handleScroll = () => {
      const currentScroll = window.scrollY;
      const diff = currentScroll - lastScrollY;
      lastScrollY = currentScroll;
      targetScrollSpeed = diff * 0.12;
    };

    const spawnSparks = (clientX: number, clientY: number) => {
      const count = 8 + Math.floor(Math.random() * 4); // Reduced from 24-32 to 8-12 for performance
      const clickZ = 150;
      const clickScale = fov / (fov + clickZ);
      
      const virtualX = (clientX - centerX) / clickScale;
      const virtualY = (clientY - centerY) / clickScale;

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.8 + Math.random() * 4.5;
        
        const vx = Math.cos(angle) * speed * (0.8 + Math.random() * 0.4);
        const vy = Math.sin(angle) * speed * (0.8 + Math.random() * 0.4) - (1 + Math.random() * 1.0);
        const vz = (Math.random() - 0.5) * speed * 1.0;

        sparks.push({
          x: virtualX,
          y: virtualY,
          z: clickZ,
          vx,
          vy,
          vz,
          size: 1.2 + Math.random() * 2.0,
          color: sparkColors[Math.floor(Math.random() * sparkColors.length)],
          alpha: 1.0,
          decay: 0.022 + Math.random() * 0.018,
          gravity: 0.07 + Math.random() * 0.05,
        });
      }
    };

    const handleClick = (e: MouseEvent) => {
      // Don't spawn sparks if user clicked a link, button, or input to ensure native click feels instant
      const target = e.target as HTMLElement;
      if (
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.tagName === "INPUT" ||
        target.tagName === "SELECT" ||
        target.tagName === "TEXTAREA" ||
        target.closest("a") ||
        target.closest("button")
      ) {
        return;
      }
      spawnSparks(e.clientX, e.clientY);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("click", handleClick);

    // Dynamic rendering loop
    const animate = () => {
      // Clean canvas with very transparent black for subtle trails
      ctx.fillStyle = "rgba(10, 10, 12, 0.08)";
      ctx.fillRect(0, 0, width, height);

      currentRotateX += (targetRotateX - currentRotateX) * 0.06;
      currentRotateY += (targetRotateY - currentRotateY) * 0.06;

      currentScrollSpeed += (targetScrollSpeed - currentScrollSpeed) * 0.08;
      targetScrollSpeed *= 0.92;

      const baseCruise = 0.4;
      const totalZShift = currentScrollSpeed + baseCruise;

      const cosX = Math.cos(currentRotateX);
      const sinX = Math.sin(currentRotateX);
      const cosY = Math.cos(currentRotateY);
      const sinY = Math.sin(currentRotateY);

      // 1. Draw Background Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.z -= totalZShift * p.speed * 2.5;

        if (p.z <= 0) {
          p.z = maxDepth;
          const angle = Math.random() * Math.PI * 2;
          const radius = 200 + Math.random() * (width * 0.6);
          p.x = Math.cos(angle) * radius;
          p.y = (Math.random() - 0.5) * height * 1.5;
        } else if (p.z > maxDepth) {
          p.z = 0;
        }

        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.z * cosY + p.x * sinY;
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.y * sinX;

        const scale = fov / (fov + z2);
        const projX = centerX + x1 * scale;
        const projY = centerY + y2 * scale;
        const size = p.baseSize * scale;

        if (z2 > 0 && projX >= 0 && projX <= width && projY >= 0 && projY <= height) {
          const opacity = Math.min(1.0, (maxDepth - z2) / 300) * (scale * 0.85);

          // LAYERING GLOW: Draw larger transparent circle for glow, then the solid core
          // This is incredibly performant and does NOT block the compositor like shadowBlur!
          if (size > 1.2) {
            ctx.beginPath();
            ctx.arc(projX, projY, size * 2.8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${(opacity * 0.22).toFixed(3)})`;
            ctx.fill();
          }

          ctx.beginPath();
          ctx.arc(projX, projY, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${opacity.toFixed(3)})`;
          ctx.fill();
        }
      }

      // 2. Draw & Update Sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];

        s.x += s.vx;
        s.y += s.vy;
        s.z += s.vz;

        s.vy += s.gravity;
        s.vx *= 0.97;
        s.vy *= 0.97;
        s.vz *= 0.97;

        s.alpha -= s.decay;

        if (s.alpha <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        const x1 = s.x * cosY - s.z * sinY;
        const z1 = s.z * cosY + s.x * sinY;
        const y2 = s.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + s.y * sinX;

        const scale = fov / (fov + z2);
        const projX = centerX + x1 * scale;
        const projY = centerY + y2 * scale;
        const size = s.size * scale;

        if (z2 > 0 && projX >= 0 && projX <= width && projY >= 0 && projY <= height) {
          // Layered vector glow for sparks
          ctx.beginPath();
          ctx.arc(projX, projY, size * 2.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${s.color.r}, ${s.color.g}, ${s.color.b}, ${(s.alpha * 0.28).toFixed(3)})`;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(projX, projY, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${s.color.r}, ${s.color.g}, ${s.color.b}, ${s.alpha.toFixed(3)})`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
      } else {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("click", handleClick);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-20 block h-full w-full outline-none"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
