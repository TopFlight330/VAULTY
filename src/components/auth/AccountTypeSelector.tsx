"use client";

import type { AccountType } from "@/types/auth";

interface AccountTypeSelectorProps {
  value: AccountType;
  onChange: (type: AccountType) => void;
}

const types = [
  {
    value: "subscriber" as const,
    icon: "\u{1F464}",
    label: "Subscriber",
    desc: "Support creators",
  },
  {
    value: "creator" as const,
    icon: "\u2B50",
    label: "Creator",
    desc: "Sell your content",
  },
];

export function AccountTypeSelector({
  value,
  onChange,
}: AccountTypeSelectorProps) {
  return (
    <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.8rem" }}>
      {types.map((type) => {
        const isSelected = value === type.value;
        return (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            style={{
              flex: 1,
              padding: "1rem",
              borderRadius: "12px",
              border: `2px solid ${isSelected ? "var(--pink)" : "var(--border)"}`,
              background: isSelected ? "var(--pink-dim)" : "var(--input-bg)",
              textAlign: "center",
              transition: "all 0.2s",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <span style={{ fontSize: "1.5rem", display: "block", marginBottom: "0.4rem" }}>
              {type.icon}
            </span>
            <span
              style={{
                fontSize: "0.82rem",
                fontWeight: 700,
                display: "block",
                color: isSelected ? "var(--pink)" : "var(--text)",
              }}
            >
              {type.label}
            </span>
            <span
              style={{
                fontSize: "0.68rem",
                color: "var(--dim)",
                marginTop: "2px",
                display: "block",
              }}
            >
              {type.desc}
            </span>
          </button>
        );
      })}
    </div>
  );
}
