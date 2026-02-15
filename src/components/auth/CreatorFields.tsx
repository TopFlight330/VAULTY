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
      <label className="block text-[0.78rem] font-bold text-[var(--dim)] mb-[0.4rem] uppercase tracking-[0.06em]">
        Content category
      </label>
      <div className="flex gap-3 mb-[1.2rem]">
        {CREATOR_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => onCategoryChange(cat.value as CreatorCategory)}
            className={`flex-1 p-3 rounded-xl border-2 text-center transition-all duration-200 cursor-pointer ${
              category === cat.value
                ? "border-[var(--pink)] bg-[var(--pink-dim)]"
                : "border-[var(--border)] bg-[var(--input-bg)] hover:border-[var(--muted)]"
            }`}
          >
            <span className="text-lg block mb-1">{cat.icon}</span>
            <span
              className={`text-[0.82rem] font-bold ${
                category === cat.value
                  ? "text-[var(--pink)]"
                  : "text-[var(--text)]"
              }`}
            >
              {cat.label}
            </span>
          </button>
        ))}
      </div>

      {/* Social reach */}
      <label className="block text-[0.78rem] font-bold text-[var(--dim)] mb-[0.4rem] uppercase tracking-[0.06em]">
        Social reach
      </label>
      <div className="grid grid-cols-2 gap-3 mb-[1.2rem]">
        {SOCIAL_REACH_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSocialReachChange(opt.value as SocialReach)}
            className={`p-[0.8rem] rounded-[10px] text-center transition-all duration-200 cursor-pointer border ${
              socialReach === opt.value
                ? "border-[var(--pink)] bg-[var(--pink-dim)]"
                : "border-[var(--border)] bg-[var(--input-bg)] hover:border-[var(--muted)]"
            }`}
          >
            <span
              className={`text-[0.82rem] font-bold block ${
                socialReach === opt.value
                  ? "text-[var(--pink)]"
                  : "text-[var(--text)]"
              }`}
            >
              {opt.label}
            </span>
            <span className="text-[0.68rem] text-[var(--dim)] mt-[2px] block">
              {opt.sub}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
