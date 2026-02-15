import Link from "next/link";

interface VaultyLogoProps {
  href?: string;
}

export function VaultyLogo({ href = "/" }: VaultyLogoProps) {
  const logo = (
    <div className="flex items-center gap-3 mb-10">
      <div className="w-[42px] h-[42px] bg-gradient-to-br from-[var(--pink-dim)] to-[var(--purple-dim)] border border-[rgba(244,63,142,0.2)] rounded-xl flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--pink)] rounded-full relative flex items-center justify-center">
          <div className="w-1 h-1 bg-[var(--pink)] rounded-full" />
          <span className="absolute w-[1.5px] h-[7px] bg-[var(--pink)] rounded-sm -top-[2px]" />
        </div>
      </div>
      <span
        className="text-[1.3rem] font-black text-white tracking-[1px]"
        style={{ fontFamily: "var(--font-unbounded), sans-serif" }}
      >
        Vaulty
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="no-underline">
        {logo}
      </Link>
    );
  }

  return logo;
}
