interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        padding: "2.5rem",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-sora), 'Sora', sans-serif",
          fontSize: "1.5rem",
          fontWeight: 800,
          marginBottom: "0.4rem",
        }}
      >
        {title}
      </h1>
      <p
        style={{
          fontSize: "0.88rem",
          color: "var(--dim)",
          marginBottom: "2rem",
          lineHeight: 1.5,
        }}
      >
        {subtitle}
      </p>
      {children}
    </div>
  );
}
