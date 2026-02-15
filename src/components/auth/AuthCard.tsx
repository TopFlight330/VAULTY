interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-10">
      <h1
        className="text-[1.5rem] font-extrabold mb-[0.4rem]"
        style={{ fontFamily: "var(--font-sora), sans-serif" }}
      >
        {title}
      </h1>
      <p className="text-[0.88rem] text-[var(--dim)] mb-8 leading-relaxed">
        {subtitle}
      </p>
      {children}
    </div>
  );
}
