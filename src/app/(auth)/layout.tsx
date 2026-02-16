"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "../landing.module.css";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lang, setLang] = useState<"en" | "fr">("en");

  // Star field
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w: number, h: number;
    let stars: {
      x: number; y: number; r: number; color: string;
      pulse: number; speed: number; vx: number; vy: number;
    }[] = [];
    let animId: number;

    function resize() {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;
    }

    function init() {
      stars = [];
      const count = Math.floor((w * h) / 10000);
      for (let i = 0; i < count; i++) {
        const isPink = Math.random() > 0.8;
        const isPurple = !isPink && Math.random() > 0.75;
        let color: string;
        if (isPink) color = `rgba(244,63,142,${0.3 + Math.random() * 0.5})`;
        else if (isPurple) color = `rgba(139,92,246,${0.2 + Math.random() * 0.5})`;
        else color = `rgba(255,255,255,${0.15 + Math.random() * 0.35})`;
        stars.push({
          x: Math.random() * w, y: Math.random() * h,
          r: 0.8 + Math.random() * 2.2, color,
          pulse: Math.random() * Math.PI * 2,
          speed: 0.003 + Math.random() * 0.008,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
        });
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.pulse += s.speed;
        s.x += s.vx; s.y += s.vy;
        if (s.x < -10) s.x = w + 10;
        if (s.x > w + 10) s.x = -10;
        if (s.y < -10) s.y = h + 10;
        if (s.y > h + 10) s.y = -10;
        ctx!.globalAlpha = 0.5 + Math.sin(s.pulse) * 0.35;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fillStyle = s.color;
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    }

    resize(); init(); draw();
    const onResize = () => { resize(); init(); };
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); cancelAnimationFrame(animId); };
  }, []);

  return (
    <>
      {/* NAV */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.navLogo}>
          <div className={styles.navLogoIcon}>
            <div className={styles.navLogoVault}>
              <div className={styles.sp} style={{ transform: "rotate(0deg)" }} />
              <div className={styles.sp} style={{ transform: "rotate(90deg)" }} />
              <div className={styles.sp} style={{ transform: "rotate(45deg)" }} />
              <div className={styles.sp} style={{ transform: "rotate(135deg)" }} />
            </div>
          </div>
          <span className={styles.navLogoText}>Vaulty</span>
        </Link>
        <div className={styles.navEnd}>
          <button className={styles.langToggle} onClick={() => setLang(lang === "en" ? "fr" : "en")}>
            {lang === "en" ? "FR" : "EN"}
          </button>
          <Link href="/login" className={styles.navUser}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
        </div>
      </nav>

      {/* STAR FIELD */}
      <div className={styles.starField}><canvas ref={canvasRef} /></div>

      {/* CONTENT */}
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "6rem 2rem 2rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ width: "100%", maxWidth: "420px" }}>
          {children}
        </div>
      </div>
    </>
  );
}
