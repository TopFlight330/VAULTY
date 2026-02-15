"use client";

import type { CreatorCategory, SocialReach } from "@/types/auth";
import { CREATOR_CATEGORIES, SOCIAL_REACH_OPTIONS } from "@/lib/constants/auth";

interface CreatorFieldsProps {
  category: CreatorCategory;
  onCategoryChange: (cat: CreatorCategory) => void;
  socialReach: SocialReach;
  onSocialReachChange: (reach: SocialReach) => void;
}

export function CreatorFields({
  category,
  onCategoryChange,
  socialReach,
  onSocialReachChange,
}: CreatorFieldsProps) {
  return (
    <div>
      {/* Category selector */}
      <label
        style={{
          display: "block",
          fontSize: "0.78rem",
          fontWeight: 700,
          color: "var(--dim)",
          marginBottom: "0.4rem",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        Content category
      </label>
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.2rem" }}>
        {CREATOR_CATEGORIES.map((cat) => {
          const isSelected = category === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => onCategoryChange(cat.value as CreatorCategory)}
              style={{
                flex: 1,
                padding: "0.75rem",
                borderRadius: "12px",
                border: `2px solid ${isSelected ? "var(--pink)" : "var(--border)"}`,
                background: isSelected ? "var(--pink-dim)" : "var(--input-bg)",
                textAlign: "center",
                transition: "all 0.2s",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <span style={{ fontSize: "1.125rem", display: "block", marginBottom: "0.25rem" }}>
                {cat.icon}
              </span>
              <span
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: isSelected ? "var(--pink)" : "var(--text)",
                }}
              >
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Social reach */}
      <label
        style={{
          display: "block",
          fontSize: "0.78rem",
          fontWeight: 700,
          color: "var(--dim)",
          marginBottom: "0.4rem",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        Social reach
      </label>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem",
          marginBottom: "1.2rem",
        }}
      >
        {SOCIAL_REACH_OPTIONS.map((opt) => {
          const isSelected = socialReach === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSocialReachChange(opt.value as SocialReach)}
              style={{
                padding: "0.8rem",
                borderRadius: "10px",
                textAlign: "center",
                transition: "all 0.2s",
                cursor: "pointer",
                border: `1px solid ${isSelected ? "var(--pink)" : "var(--border)"}`,
                background: isSelected ? "var(--pink-dim)" : "var(--input-bg)",
                fontFamily: "inherit",
              }}
            >
              <span
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  display: "block",
                  color: isSelected ? "var(--pink)" : "var(--text)",
                }}
              >
                {opt.label}
              </span>
              <span
                style={{
                  fontSize: "0.68rem",
                  color: "var(--dim)",
                  marginTop: "2px",
                  display: "block",
                }}
              >
                {opt.sub}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
