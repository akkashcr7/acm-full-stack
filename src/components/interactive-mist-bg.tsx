"use client";

import React, { useEffect, useRef } from "react";

interface MistParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  originVx: number;
  originVy: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  color: string;
  pulseSpeed: number;
  pulsePhase: number;
}

export function InteractiveMistBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Track mouse with smoothing
    const mouse = {
      x: -1000,
      y: -1000,
      radius: 160, // repel interaction radius
      isActive: false,
    };

    // Color palette matching the cyber-robotics theme (Cyan, Violet, Electric Blue)
    const colors = [
      "0, 240, 255",   // Neon Cyan
      "139, 92, 246",  // Violet
      "56, 189, 248",  // Light Sky
      "99, 102, 241",  // Indigo
    ];

    const particleCount = Math.min(85, Math.floor((width * height) / 14000));
    const particles: MistParticle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const radius = Math.random() * 65 + 35; // soft large mist circles
      const vx = (Math.random() - 0.5) * 0.45;
      const vy = (Math.random() - 0.5) * 0.45;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const baseAlpha = Math.random() * 0.12 + 0.05; // delicate ambient glow

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx,
        vy,
        originVx: vx,
        originVy: vy,
        radius,
        baseAlpha,
        alpha: baseAlpha,
        color,
        pulseSpeed: Math.random() * 0.015 + 0.005,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.isActive = true;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      mouse.isActive = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        mouse.isActive = true;
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 1. Ambient gentle floating motion
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around screen boundaries with margin
        const pad = p.radius * 1.5;
        if (p.x < -pad) p.x = width + pad;
        if (p.x > width + pad) p.x = -pad;
        if (p.y < -pad) p.y = height + pad;
        if (p.y > height + pad) p.y = -pad;

        // 2. Interactive Cursor Repulsion (Mist parting physics)
        if (mouse.isActive) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            // Repel force: stronger when closer
            const force = (1 - dist / mouse.radius) * 4.5;
            const angle = Math.atan2(dy, dx);
            const repelX = Math.cos(angle) * force;
            const repelY = Math.sin(angle) * force;

            // Apply push with smooth acceleration
            p.vx += repelX * 0.12;
            p.vy += repelY * 0.12;

            // Brighten slightly upon interaction
            p.alpha = Math.min(0.28, p.baseAlpha * 2.2);
          }
        }

        // Return velocity gradually to natural ambient drift
        p.vx += (p.originVx - p.vx) * 0.04;
        p.vy += (p.originVy - p.vy) * 0.04;

        // Pulse breathing effect
        p.pulsePhase += p.pulseSpeed;
        const breath = Math.sin(p.pulsePhase) * 0.03;
        const currentAlpha = Math.max(0.03, p.alpha + breath);
        p.alpha += (p.baseAlpha - p.alpha) * 0.02;

        // 3. Draw soft feathered radial glow
        const gradient = ctx.createRadialGradient(
          p.x,
          p.y,
          0,
          p.x,
          p.y,
          p.radius
        );
        gradient.addColorStop(0, `rgba(${p.color}, ${currentAlpha})`);
        gradient.addColorStop(0.4, `rgba(${p.color}, ${currentAlpha * 0.6})`);
        gradient.addColorStop(1, `rgba(${p.color}, 0)`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.85 }}
    />
  );
}
