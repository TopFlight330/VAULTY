"use client";

import type { AccountType } from "@/types/auth";

interface AccountTypeSelectorProps {
  value: AccountType;
  onChange: (type: AccountType) => void;
}

const types = [
  {
    value: "subscriber" as const,
    icon: "👤",
    label: "Subscriber",
    desc: "Support creators",
  },
  {
    value: "creator" as const,
    icon: "⭐",
    label: "Creator",
    desc: "Sell your content",
  },
];

export function AccountTypeSelector({
  value,
  onChange,
}: AccountTypeSelectorProps) {
  return (
    <div className="flex gap-3 mb-[1.8rem]">
      {types.map((type) => (
        <button
          key={type.value}
          type="button"
          onClick={() => onChange(type.value)}
          className={`flex-1 p-4 rounded-xl border-2 text-center transition-all duration-200 cursor-pointer ${
            value === type.value
              ? "border-[var(--pink)] bg-[var(--pink-dim)]"
              : "border-[var(--border)] bg-[var(--input-bg)] hover:border-[var(--muted)]"
          }`}
        >
          <span className="text-[1.5rem] block mb-[0.4rem]">
            {type.icon}
          </span>
          <span
            className={`text-[0.82rem] font-bold block ${
              value === type.value
                ? "text-[var(--pink)]"
                : "text-[var(--text)]"
            }`}
          >
            {type.label}
          </span>
          <span className="text-[0.68rem] text-[var(--dim)] mt-[2px] block">
            {type.desc}
          </span>
        </button>
      ))}
    </div>
  );
}
