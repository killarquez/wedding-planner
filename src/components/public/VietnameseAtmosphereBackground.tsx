'use client';

import React, { useEffect, useRef } from 'react';

interface Petal {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  opacity: number;
  swingProgress: number;
  swingSpeed: number;
}

interface Sparkle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  pulseSpeed: number;
}

export const VietnameseAtmosphereBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Color palette for petals: Peach Blossom (Hoa Đào), Golden Apricot (Hoa Mai), Lotus Pink (Hoa Sen)
    const petalColors = [
      '#fda4af', // soft rose
      '#f43f5e', // vivid blossom
      '#fb7185', // lotus pink
      '#fde047', // golden apricot blossom
      '#f59e0b', // imperial amber gold
    ];

    const petalCount = width < 768 ? 14 : 24;
    const sparkleCount = width < 768 ? 16 : 28;

    // Initialize Petals
    const petals: Petal[] = Array.from({ length: petalCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 6 + 5,
      speedY: Math.random() * 0.7 + 0.4,
      speedX: Math.random() * 0.4 - 0.2,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      color: petalColors[Math.floor(Math.random() * petalColors.length)],
      opacity: Math.random() * 0.5 + 0.35,
      swingProgress: Math.random() * Math.PI * 2,
      swingSpeed: Math.random() * 0.015 + 0.01,
    }));

    // Initialize Sparkles
    const sparkles: Sparkle[] = Array.from({ length: sparkleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      speedY: Math.random() * 0.3 + 0.15,
      speedX: (Math.random() - 0.5) * 0.2,
      opacity: Math.random() * 0.7 + 0.2,
      pulseSpeed: Math.random() * 0.03 + 0.01,
    }));

    let isVisible = true;
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Render Floating Petals
      petals.forEach((p) => {
        p.swingProgress += p.swingSpeed;
        p.y += p.speedY;
        p.x += Math.sin(p.swingProgress) * 0.6 + p.speedX;
        p.rotation += p.rotationSpeed;

        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }
        if (p.x > width + 20) p.x = -20;
        if (p.x < -20) p.x = width + 20;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        // Draw organic curved petal shape
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.7, p.size * 1.3, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // Render Floating Golden Sparkles
      sparkles.forEach((s) => {
        s.y += s.speedY;
        s.x += s.speedX;
        s.opacity = Math.abs(Math.sin(Date.now() * s.pulseSpeed * 0.001)) * 0.6 + 0.2;

        if (s.y > height + 10) {
          s.y = -10;
          s.x = Math.random() * width;
        }

        ctx.save();
        ctx.globalAlpha = s.opacity;
        ctx.fillStyle = '#fef08a'; // gold glow
        ctx.shadowColor = '#d97706';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
      {/* 1. Multi-Tone Vietnamese Silk Lantern Ambient Glow Meshes */}
      {/* Auspicious Imperial Crimson Light (Top Left) */}
      <div className="absolute -top-32 -left-32 w-96 sm:w-[32rem] h-96 sm:h-[32rem] rounded-full bg-gradient-to-br from-crimson-600/18 via-rose-500/12 to-transparent blur-3xl animate-float-slow" />

      {/* Imperial Jade & Emerald Light (Top Right) */}
      <div className="absolute top-10 -right-28 w-80 sm:w-[28rem] h-80 sm:h-[28rem] rounded-full bg-gradient-to-bl from-jade-500/16 via-emerald-400/10 to-transparent blur-3xl animate-float-slow" style={{ animationDelay: '2s' }} />

      {/* Lotus Blossom Pink Glow (Center / Mid Section) */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 sm:w-[40rem] h-96 sm:h-[40rem] rounded-full bg-gradient-to-r from-lotus-400/12 via-rose-300/10 to-amber-200/12 blur-3xl animate-glow-pulse" />

      {/* Warm Cognac & Royal Amber Gold (Bottom Section) */}
      <div className="absolute bottom-10 -left-20 w-80 sm:w-[30rem] h-80 sm:h-[30rem] rounded-full bg-gradient-to-tr from-amber-400/16 via-gold-400/12 to-transparent blur-3xl animate-float-slow" style={{ animationDelay: '4s' }} />

      {/* Royal Indigo Sapphire Glow (Bottom Right) */}
      <div className="absolute -bottom-20 -right-20 w-96 sm:w-[32rem] h-96 sm:h-[32rem] rounded-full bg-gradient-to-tl from-royal-600/12 via-jade-500/10 to-transparent blur-3xl animate-float-slow" style={{ animationDelay: '6s' }} />

      {/* 2. Traditional Vietnamese Watermark Background Silhouettes */}
      {/* Traditional Dong Son Sunburst & Lotus Silhouette */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[42rem] h-[42rem] opacity-[0.035] pointer-events-none select-none">
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-crimson-900">
          <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
          <circle cx="200" cy="200" r="140" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="200" cy="200" r="90" stroke="currentColor" strokeWidth="2" />
          <circle cx="200" cy="200" r="40" fill="currentColor" fillOpacity="0.3" />
          {/* Star Rays */}
          {Array.from({ length: 14 }).map((_, i) => {
            const angle = (i * 360) / 14;
            return (
              <line
                key={i}
                x1="200"
                y1="200"
                x2={200 + 130 * Math.cos((angle * Math.PI) / 180)}
                y2={200 + 130 * Math.sin((angle * Math.PI) / 180)}
                stroke="currentColor"
                strokeWidth="2.5"
              />
            );
          })}
        </svg>
      </div>

      {/* 3. Floating Petals and Golden Light Motes Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
