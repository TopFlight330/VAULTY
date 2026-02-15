import Link from "next/link";

interface VaultyLogoProps {
  href?: string;
}

export function VaultyLogo({ href = "/" }: VaultyLogoProps) {
  const logo = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "2.5rem",
        textDecoration: "none",
        color: "var(--text)",
      }}
    >
      <div
        style={{
          width: "42px",
          height: "42px",
          background:
            "linear-gradient(135deg, rgba(244,63,142,0.1), rgba(139,92,246,0.06))",
          border: "1px solid rgba(244,63,142,0.2)",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "24px",
            height: "24px",
            border: "2px solid var(--pink)",
            borderRadius: "50%",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "4px",
              height: "4px",
              background: "var(--pink)",
              borderRadius: "50%",
              position: "absolute",
            }}
          />
          {[0, 90, 45, 135].map((deg) => (
            <span
              key={deg}
              style={{
                position: "absolute",
                width: "1.5px",
                height: "7px",
                background: "var(--pink)",
                borderRadius: "1px",
                transform: `rotate(${deg}deg)`,
              }}
            />
          ))}
        </div>
      </div>
      <span
        style={{
          fontFamily: "var(--font-unbounded), 'Unbounded', sans-serif",
          fontSize: "1.3rem",
          fontWeight: 900,
          color: "#fff",
          letterSpacing: "1px",
        }}
      >
        Vaulty
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none" }}>
        {logo}
      </Link>
    );
  }

  return logo;
}
