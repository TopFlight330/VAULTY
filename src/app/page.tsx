"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./landing.module.css";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lang, setLang] = useState<"en" | "fr">("en");
  const [scrolled, setScrolled] = useState(false);
  const [modal, setModal] = useState<"terms" | "privacy" | null>(null);

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
          <Link href="/login" className={styles.navUser}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
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
            <button
              className={`${styles.btn} ${styles.ghostBtn}`}
              onClick={() => document.getElementById("content")?.scrollIntoView({ behavior: "smooth" })}
            >
              {t("Why Vaulty", "Pourquoi Vaulty")}
            </button>
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

      {/* ADVANTAGES */}
      <section className={styles.advSection} id="content">
        <div className={styles.advInner}>
          <div className={styles.advLabel}>{t("Why Vaulty", "Pourquoi Vaulty")}</div>
          <div className={styles.advSubtitle}>{t("Security and Privacy", "Sécurité et confidentialité")}</div>

          <div className={styles.advGrid}>
            {/* Swiss Privacy */}
            <div className={`${styles.advCard} ${styles.advCardPink}`}>
              <div className={styles.advCardIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <div className={styles.advCardBadge}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                {t("Swiss-Based", "Basé en Suisse")}
              </div>
              <h3>{t("Protected by Swiss privacy law", "Protégé par le droit suisse de la vie privée")}</h3>
              <p>
                {t(
                  "Vaulty is headquartered in Switzerland, home to the world's strictest data protection laws. Your personal information, content, and financial data are shielded by regulations that prioritize your privacy above all else.",
                  "Vaulty a son siège en Suisse, pays ayant les lois de protection des données les plus strictes au monde. Vos informations personnelles, votre contenu et vos données financières sont protégés par des réglementations qui priorisent votre vie privée avant tout."
                )}
              </p>
            </div>

            {/* Crypto */}
            <div className={`${styles.advCard} ${styles.advCardPurple}`}>
              <div className={styles.advCardIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><circle cx="12" cy="17" r="0.5" fill="currentColor" />
                </svg>
              </div>
              <div className={styles.advCardBadge}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
                {t("Crypto-Friendly", "Compatible Crypto")}
              </div>
              <h3>{t("Pay and get paid in crypto", "Payez et soyez payé en crypto")}</h3>
              <p>
                {t(
                  "Subscribers can pay with cryptocurrency for total anonymity. Creators can choose crypto payouts, keeping their income completely private. No bank statements, no paper trail, full financial discretion.",
                  "Les abonnés peuvent payer en cryptomonnaie pour un anonymat total. Les créateurs peuvent choisir des versements en crypto, gardant leurs revenus entièrement privés. Aucun relevé bancaire, aucune trace, discrétion financière complète."
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARE */}
      <section className={styles.sec}>
        <div className={styles.secInner}>
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
        </div>
      </section>

      {/* FEATURES */}
      <section className={styles.sec} id="features">
        <div className={styles.secInner}>
        <div className={styles.secLabel}>{t("Platform features", "Fonctionnalités")}</div>
        <div className={styles.secTitle}>{t("Everything creators need.", "Tout ce dont les créateurs ont besoin.")}</div>
        <div className={styles.featGrid}>
          {[
            {
              ico: "a",
              svg: <><circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8" /><path d="M12 18V6" /></>,
              en: "99% Revenue Split", fr: "99% de revenus",
              enP: "The lowest fee in the entire industry. No hidden charges, no surprise deductions. Just a flat 1% and you keep everything else.",
              frP: "Les frais les plus bas de toute l'industrie. Aucun frais caché, aucune déduction surprise. Juste 1% et vous gardez tout le reste.",
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
              enP: "Get paid within 24 hours. No waiting weeks for your money. Choose between bank transfer, crypto wallet, or other options.",
              frP: "Recevez vos paiements en 24h. Plus besoin d'attendre des semaines. Choisissez entre virement bancaire, portefeuille crypto ou autres options.",
            },
            {
              ico: "a",
              svg: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
              en: "Privacy & Protection", fr: "Confidentialité & Protection",
              enP: "Automatic watermarks, DMCA takedown requests, and geo-blocking built in. Stay completely anonymous if you want. We protect your identity.",
              frP: "Filigranes automatiques, retraits DMCA et géo-blocage intégrés. Restez complètement anonyme si vous le souhaitez. Nous protégeons votre identité.",
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
              <div className={styles.featBody}>
                <h3>{t(f.en, f.fr)}</h3>
                <p>{t(f.enP, f.frP)}</p>
              </div>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.ftInner}>
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
          <button onClick={() => setModal("terms")}>{t("Terms", "Conditions")}</button>
          <button onClick={() => setModal("privacy")}>{t("Privacy", "Confidentialité")}</button>
        </div>
        <div className={styles.ftCopy}>&copy; 2026 Vaulty Inc.</div>
        </div>
      </footer>

      {/* MODAL */}
      {modal && (
        <div className={styles.modalOverlay} onClick={() => setModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setModal(null)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>

            {modal === "terms" && (
              <div className={styles.modalBody}>
                <h2>{t("Terms of Service", "Conditions d'utilisation")}</h2>
                <p className={styles.modalUpdated}>{t("Last updated: February 2026", "Derniere mise a jour : fevrier 2026")}</p>

                <h3>{t("1. Acceptance of Terms", "1. Acceptation des conditions")}</h3>
                <p>{t(
                  "By accessing or using Vaulty, you agree to be bound by these Terms of Service. If you do not agree, you may not use the platform.",
                  "En accedant ou en utilisant Vaulty, vous acceptez d'etre lie par ces conditions d'utilisation. Si vous n'acceptez pas, vous ne pouvez pas utiliser la plateforme."
                )}</p>

                <h3>{t("2. Eligibility", "2. Admissibilite")}</h3>
                <p>{t(
                  "You must be at least 18 years old to create an account or use Vaulty. By registering, you confirm that you meet this age requirement.",
                  "Vous devez avoir au moins 18 ans pour creer un compte ou utiliser Vaulty. En vous inscrivant, vous confirmez que vous remplissez cette condition d'age."
                )}</p>

                <h3>{t("3. Account Responsibilities", "3. Responsabilites du compte")}</h3>
                <p>{t(
                  "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use.",
                  "Vous etes responsable du maintien de la confidentialite de vos identifiants de compte et de toutes les activites qui se produisent sous votre compte. Vous acceptez de nous informer immediatement de toute utilisation non autorisee."
                )}</p>

                <h3>{t("4. Creator Content", "4. Contenu des createurs")}</h3>
                <p>{t(
                  "Creators retain full ownership of the content they upload. By posting content, you grant Vaulty a limited license to host, display, and distribute your content solely for the purpose of operating the platform.",
                  "Les createurs conservent la pleine propriete du contenu qu'ils telechargent. En publiant du contenu, vous accordez a Vaulty une licence limitee pour heberger, afficher et distribuer votre contenu uniquement dans le but d'exploiter la plateforme."
                )}</p>

                <h3>{t("5. Prohibited Content", "5. Contenu interdit")}</h3>
                <p>{t(
                  "You may not upload content that is illegal, involves minors, promotes violence, or infringes on third-party intellectual property rights. Vaulty reserves the right to remove any content that violates these terms.",
                  "Vous ne pouvez pas telecharger de contenu illegal, impliquant des mineurs, faisant la promotion de la violence ou portant atteinte aux droits de propriete intellectuelle de tiers. Vaulty se reserve le droit de supprimer tout contenu enfreignant ces conditions."
                )}</p>

                <h3>{t("6. Fees and Payments", "6. Frais et paiements")}</h3>
                <p>{t(
                  "Vaulty charges a platform fee of 1% on all transactions. Payouts are processed within 24 hours. Payment processing fees from third-party providers may apply separately.",
                  "Vaulty facture des frais de plateforme de 1% sur toutes les transactions. Les paiements sont traites dans les 24 heures. Des frais de traitement des paiements provenant de fournisseurs tiers peuvent s'appliquer separement."
                )}</p>

                <h3>{t("7. Termination", "7. Resiliation")}</h3>
                <p>{t(
                  "Vaulty may suspend or terminate your account at any time if you violate these terms. You may delete your account at any time through your account settings.",
                  "Vaulty peut suspendre ou resilier votre compte a tout moment si vous enfreignez ces conditions. Vous pouvez supprimer votre compte a tout moment via les parametres de votre compte."
                )}</p>

                <h3>{t("8. Limitation of Liability", "8. Limitation de responsabilite")}</h3>
                <p>{t(
                  "Vaulty is provided \"as is\" without warranties of any kind. To the maximum extent permitted by law, Vaulty shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.",
                  "Vaulty est fourni \"tel quel\" sans garantie d'aucune sorte. Dans la mesure maximale permise par la loi, Vaulty ne sera pas responsable des dommages indirects, accessoires ou consecutifs decoulant de votre utilisation de la plateforme."
                )}</p>

                <h3>{t("9. Governing Law", "9. Loi applicable")}</h3>
                <p>{t(
                  "These terms are governed by the laws of Switzerland. Any disputes shall be resolved in the courts of Switzerland.",
                  "Ces conditions sont regies par les lois de la Suisse. Tout litige sera resolu devant les tribunaux suisses."
                )}</p>

                <h3>{t("10. Contact", "10. Contact")}</h3>
                <p>{t(
                  "For questions about these terms, contact us at support@vaulty.com.",
                  "Pour toute question concernant ces conditions, contactez-nous a support@vaulty.com."
                )}</p>
              </div>
            )}

            {modal === "privacy" && (
              <div className={styles.modalBody}>
                <h2>{t("Privacy Policy", "Politique de confidentialite")}</h2>
                <p className={styles.modalUpdated}>{t("Last updated: February 2026", "Derniere mise a jour : fevrier 2026")}</p>

                <h3>{t("1. Information We Collect", "1. Informations que nous collectons")}</h3>
                <p>{t(
                  "We collect information you provide when creating an account (email, display name) and usage data such as login times and feature interactions. We do not sell your personal data to third parties.",
                  "Nous collectons les informations que vous fournissez lors de la creation d'un compte (email, nom d'affichage) et les donnees d'utilisation telles que les heures de connexion et les interactions avec les fonctionnalites. Nous ne vendons pas vos donnees personnelles a des tiers."
                )}</p>

                <h3>{t("2. How We Use Your Data", "2. Comment nous utilisons vos donnees")}</h3>
                <p>{t(
                  "Your data is used to operate the platform, process payments, send transactional emails, and improve our services. We never use your data for targeted advertising.",
                  "Vos donnees sont utilisees pour exploiter la plateforme, traiter les paiements, envoyer des emails transactionnels et ameliorer nos services. Nous n'utilisons jamais vos donnees pour de la publicite ciblee."
                )}</p>

                <h3>{t("3. Data Storage and Security", "3. Stockage et securite des donnees")}</h3>
                <p>{t(
                  "All data is stored on secure servers and encrypted in transit and at rest. Vaulty is headquartered in Switzerland and subject to Swiss data protection laws (FADP), among the strictest in the world.",
                  "Toutes les donnees sont stockees sur des serveurs securises et chiffrees en transit et au repos. Vaulty a son siege en Suisse et est soumis aux lois suisses sur la protection des donnees (LPD), parmi les plus strictes au monde."
                )}</p>

                <h3>{t("4. Cookies", "4. Cookies")}</h3>
                <p>{t(
                  "We use essential cookies to maintain your session and preferences. We do not use tracking cookies or third-party analytics that identify individual users.",
                  "Nous utilisons des cookies essentiels pour maintenir votre session et vos preferences. Nous n'utilisons pas de cookies de suivi ni d'analyses tierces identifiant les utilisateurs individuels."
                )}</p>

                <h3>{t("5. Third-Party Services", "5. Services tiers")}</h3>
                <p>{t(
                  "We use trusted third-party services for payment processing and email delivery. These providers only receive the minimum data necessary to perform their function and are contractually bound to protect your information.",
                  "Nous utilisons des services tiers de confiance pour le traitement des paiements et la livraison des emails. Ces fournisseurs ne recoivent que les donnees minimales necessaires pour remplir leur fonction et sont contractuellement tenus de proteger vos informations."
                )}</p>

                <h3>{t("6. Your Rights", "6. Vos droits")}</h3>
                <p>{t(
                  "You have the right to access, correct, or delete your personal data at any time. You can export your data or request account deletion through your account settings or by contacting support.",
                  "Vous avez le droit d'acceder, de corriger ou de supprimer vos donnees personnelles a tout moment. Vous pouvez exporter vos donnees ou demander la suppression de votre compte via les parametres de votre compte ou en contactant le support."
                )}</p>

                <h3>{t("7. Creator and Subscriber Privacy", "7. Confidentialite des createurs et abonnes")}</h3>
                <p>{t(
                  "Creator identities are protected. Subscriber information is never shared with creators beyond what is necessary for the transaction. Payment details remain confidential and are never exposed to other users.",
                  "L'identite des createurs est protegee. Les informations des abonnes ne sont jamais partagees avec les createurs au-dela de ce qui est necessaire pour la transaction. Les details de paiement restent confidentiels et ne sont jamais exposes aux autres utilisateurs."
                )}</p>

                <h3>{t("8. Data Retention", "8. Conservation des donnees")}</h3>
                <p>{t(
                  "We retain your data only as long as your account is active or as needed to provide services. Upon account deletion, your personal data is permanently removed within 30 days.",
                  "Nous conservons vos donnees uniquement tant que votre compte est actif ou selon les besoins pour fournir des services. Apres la suppression du compte, vos donnees personnelles sont definitivement supprimees dans les 30 jours."
                )}</p>

                <h3>{t("9. Changes to This Policy", "9. Modifications de cette politique")}</h3>
                <p>{t(
                  "We may update this policy from time to time. We will notify you of significant changes via email or through the platform.",
                  "Nous pouvons mettre a jour cette politique de temps a autre. Nous vous informerons des changements importants par email ou via la plateforme."
                )}</p>

                <h3>{t("10. Contact", "10. Contact")}</h3>
                <p>{t(
                  "For privacy-related questions, contact us at privacy@vaulty.com.",
                  "Pour toute question relative a la confidentialite, contactez-nous a privacy@vaulty.com."
                )}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
