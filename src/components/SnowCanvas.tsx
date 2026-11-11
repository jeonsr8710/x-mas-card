"use client";

import { useEffect, useRef } from "react";

interface SnowCanvasProps {
  color?: string;
  density?: number;
}

interface Flake {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  speedX: number;
  opacity: number;
}

export function SnowCanvas({
  color = "rgba(255, 255, 255, 0.8)",
  density = 65,
}: SnowCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId = 0;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const flakes: Flake[] = Array.from({ length: density }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.6 + 1.0,
      speedY: Math.random() * 0.9 + 0.4,
      speedX: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.6 + 0.3,
    }));

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener("resize", handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      for (const flake of flakes) {
        flake.y += flake.speedY;
        flake.x += flake.speedX + Math.sin(flake.y * 0.015) * 0.25;

        if (flake.y > height + 5) {
          flake.y = -5;
          flake.x = Math.random() * width;
        }
        if (flake.x > width + 5) flake.x = -5;
        if (flake.x < -5) flake.x = width + 5;

        ctx.globalAlpha = flake.opacity;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      animationId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, [color, density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
