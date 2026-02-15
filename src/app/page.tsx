"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./landing.module.css";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lang, setLang] = useState<"en" | "fr">("en");
  const [scrolled, setScrolled] = useState(false);

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

  // Intersection observer for fade-in
  useEffect(() => {
    const els = document.querySelectorAll(`.${styles.feat}, .${styles.cmp}`);
    els.forEach((el, i) => {
      (el as HTMLElement).style.opacity = "0";
      (el as HTMLElement).style.transform = "translateY(16px)";
      (el as HTMLElement).style.transition = `all 0.4s ease ${i * 0.05}s`;
    });
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((x) => {
        if (x.isIntersecting) {
          (x.target as HTMLElement).style.opacity = "1";
          (x.target as HTMLElement).style.transform = "translateY(0)";
        }
      }),
      { threshold: 0.08 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Scroll listener
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const t = (en: string, fr: string) => (lang === "en" ? en : fr);

  return (
    <>
      {/* NAV */}
      <nav className={styles.nav}>
        <a href="#" className={styles.navLogo}>
          <div className={styles.navLogoIcon}>
            <div className={styles.navLogoVault}>
              <div className={styles.sp} style={{ transform: "rotate(0deg)" }} />
              <div className={styles.sp} style={{ transform: "rotate(90deg)" }} />
              <div className={styles.sp} style={{ transform: "rotate(45deg)" }} />
              <div className={styles.sp} style={{ transform: "rotate(135deg)" }} />
            </div>
          </div>
          <span className={styles.navLogoText}>Vaulty</span>
        </a>
        <div className={styles.navEnd}>
          <button className={styles.langToggle} onClick={() => setLang(lang === "en" ? "fr" : "en")}>
            {lang === "en" ? "FR" : "EN"}
          </button>
          <Link href="/login" className={`${styles.btnS} ${styles.ghost}`}>
            {t("Log in", "Connexion")}
          </Link>
          <Link href="/signup" className={`${styles.btnS} ${styles.fill}`}>
            {t("Create an account", "Créer un compte")}
          </Link>
        </div>
      </nav>

      {/* STAR FIELD */}
      <div className={styles.starField}><canvas ref={canvasRef} /></div>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroAward}>{t("★ 2026 Revelation", "★ Révélation 2026")}</div>
          <div className={styles.heroBrand}>{t("Finally!", "Enfin!")}</div>
          <div className={styles.heroSub}>
            {lang === "en" ? (
              <>Share exclusive content and<br /><span className={styles.gr}>keep 99% of your income</span></>
            ) : (
              <>Partagez du contenu exclusif et<br /><span className={styles.gr}>gardez 99% de vos revenus</span></>
            )}
          </div>
          <p className={styles.heroP}>
            {t(
              "Vaulty will never take more than 1% in fees. Ever.",
              "Vaulty ne prendra jamais plus de 1% en frais. À vie."
            )}
          </p>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/signup" className={`${styles.btn} ${styles.primary}`}>
              {t("Create an account", "Créer un compte")}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </Link>
            <a href="#content" className={`${styles.btn} ${styles.ghostBtn}`}>
              {t("Why Vaulty", "Pourquoi Vaulty")}
            </a>
          </div>
        </div>
        <div
          className={styles.scrollHint}
          style={{ opacity: scrolled ? 0 : 1 }}
          onClick={() => document.getElementById("content")?.scrollIntoView({ behavior: "smooth" })}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
        </div>
      </section>

      {/* COMPARE */}
      <section className={styles.sec} id="content">
        <div className={styles.secLabel}>{t("The competition", "La concurrence")}</div>
        <div className={styles.secTitle}>{t("What they charge you.", "Ce qu'ils vous facturent.")}</div>
        <div className={styles.compare}>
          <div className={`${styles.cmp} ${styles.cmpHighlight}`}>
            <div className={styles.cmpName} style={{ background: "linear-gradient(135deg, #f43f8e, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Vaulty</div>
            <div className={styles.cmpLabel}>{t("Platform fees", "Frais plateforme")}</div>
            <div className={`${styles.cmpFee} ${styles.pk}`}>1%</div>
          </div>
          {[
            { name: "Fansly", fee: "10%" },
            { name: "Patreon", fee: "12%" },
            { name: "OnlyFans", fee: "20%" },
          ].map((c) => (
            <div key={c.name} className={styles.cmp}>
              <div className={styles.cmpName}>{c.name}</div>
              <div className={styles.cmpLabel}>{t("Platform fees", "Frais plateforme")}</div>
              <div className={`${styles.cmpFee} ${styles.red}`}>{c.fee}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className={styles.sec} id="features">
        <div className={styles.secLabel}>{t("Platform features", "Fonctionnalités")}</div>
        <div className={styles.secTitle}>{t("Everything creators need.", "Tout ce dont les créateurs ont besoin.")}</div>
        <div className={styles.featGrid}>
          {[
            {
              ico: "a",
              svg: <><circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8" /><path d="M12 18V6" /></>,
              en: "99% Revenue Split", fr: "99% de revenus",
              enP: "The lowest fee in the entire industry. No hidden charges, no surprise deductions — just a flat 1% and you keep everything else.",
              frP: "Les frais les plus bas de toute l'industrie. Aucun frais caché, aucune déduction surprise — juste 1% et vous gardez tout le reste.",
            },
            {
              ico: "b",
              svg: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></>,
              en: "Paywalled Content", fr: "Contenu payant",
              enP: "Offer subscriptions, pay-per-view posts, and tips. Set your own prices and decide exactly what fans get access to.",
              frP: "Proposez des abonnements, du contenu à la vue et des pourboires. Fixez vos propres prix et décidez exactement ce que vos fans peuvent voir.",
            },
            {
              ico: "a",
              svg: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />,
              en: "Paid DMs & Messages", fr: "Messages privés payants",
              enP: "Chat directly with your fans and sell exclusive content through private messages. Monetize every interaction on your terms.",
              frP: "Discutez directement avec vos fans et vendez du contenu exclusif par messages privés. Monétisez chaque interaction selon vos conditions.",
            },
            {
              ico: "b",
              svg: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
              en: "Instant Payouts", fr: "Paiements instantanés",
              enP: "Get paid within 24 hours — no waiting weeks for your money. Choose between bank transfer, crypto wallet, or other options.",
              frP: "Recevez vos paiements en 24h — plus besoin d'attendre des semaines. Choisissez entre virement bancaire, portefeuille crypto ou autres options.",
            },
            {
              ico: "a",
              svg: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
              en: "Privacy & Protection", fr: "Confidentialité & Protection",
              enP: "Automatic watermarks, DMCA takedown requests, and geo-blocking built in. Stay completely anonymous if you want — we protect your identity.",
              frP: "Filigranes automatiques, retraits DMCA et géo-blocage intégrés. Restez complètement anonyme si vous le souhaitez — nous protégeons votre identité.",
            },
            {
              ico: "b",
              svg: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></>,
              en: "Fan Management", fr: "Gestion des fans",
              enP: "Built-in CRM, mass DMs, and detailed analytics to understand your audience. Everything you need to grow and engage your fanbase.",
              frP: "CRM intégré, DMs de masse et analytics détaillés pour comprendre votre audience. Tout ce qu'il faut pour développer et engager vos fans.",
            },
          ].map((f, i) => (
            <div key={i} className={styles.feat}>
              <div className={`${styles.featIco} ${f.ico === "a" ? styles.icoA : styles.icoB}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{f.svg}</svg>
              </div>
              <div>
                <h3>{t(f.en, f.fr)}</h3>
                <p>{t(f.enP, f.frP)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.ftLogo}>
          <div className={styles.ftLogoIcon}>
            <div className={styles.ftLogoVault}>
              <div className={styles.sp} style={{ transform: "rotate(0deg)" }} />
              <div className={styles.sp} style={{ transform: "rotate(90deg)" }} />
              <div className={styles.sp} style={{ transform: "rotate(45deg)" }} />
              <div className={styles.sp} style={{ transform: "rotate(135deg)" }} />
            </div>
          </div>
          <span className={styles.ftLogoText}>Vaulty</span>
        </div>
        <div className={styles.ftLinks}>
          <a href="#">{t("Terms", "Conditions")}</a>
          <a href="#">{t("Privacy", "Confidentialité")}</a>
        </div>
        <div className={styles.ftCopy}>&copy; 2026 Vaulty Inc.</div>
      </footer>
    </>
  );
}
