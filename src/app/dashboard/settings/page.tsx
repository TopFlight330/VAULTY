"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { updateProfile, updateAvatar } from "@/lib/actions/profile";
import { uploadFile } from "@/lib/helpers/storage";
import s from "../dashboard.module.css";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ToggleRow({
  label,
  desc,
  defaultChecked = false,
  isLast = false,
}: {
  label: string;
  desc: string;
  defaultChecked?: boolean;
  isLast?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className={`${s.toggleRow} ${!isLast ? s.toggleRowBorder : ""}`}>
      <div>
        <div className={s.toggleLabel}>{label}</div>
        <div className={s.toggleDesc}>{desc}</div>
      </div>
      <label
        className={`${s.toggleSwitch} ${checked ? s.toggleSwitchChecked : ""}`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => setChecked((c) => !c)}
        />
        <span className={s.toggleSlider} />
      </label>
    </div>
  );
}

export default function SettingsPage() {
  const { profile, user, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(
    profile?.display_name ?? ""
  );
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [category, setCategory] = useState(profile?.category ?? "general");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    const result = await updateProfile({
      display_name: displayName,
      bio,
      category,
    });

    if (result.success) {
      showToast("Profile saved successfully", "success");
      await refreshProfile();
    } else {
      showToast(result.message, "error");
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("File too large. Max 5MB.", "error");
      return;
    }

    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const url = await uploadFile("avatars", path, file);

    if (url) {
      const result = await updateAvatar(url);
      if (result.success) {
        showToast("Avatar updated!", "success");
        await refreshProfile();
      } else {
        showToast(result.message, "error");
      }
    } else {
      showToast("Failed to upload avatar.", "error");
    }

    setUploadingAvatar(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const initials = getInitials(profile?.display_name ?? "U");

  return (
    <div>
      <div className={s.viewHeader}>
        <h1>Settings</h1>
        <p>Manage your account and preferences.</p>
      </div>

      <div className={s.settingsSections}>
        {/* Profile Info */}
        <div className={s.settingsSection}>
          <h3 className={s.settingsSectionTitle}>Profile Information</h3>
          <p className={s.settingsSectionDesc}>
            Update your creator profile details.
          </p>

          <div className={s.settingsAvatarRow}>
            <div className={s.settingsAvatar}>
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              ) : (
                initials
              )}
            </div>
            <div className={s.settingsAvatarActions}>
              <button
                className={s.settingsAvatarUpload}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? "Uploading..." : "Upload Photo"}
              </button>
              <span className={s.settingsAvatarHint}>
                JPG, PNG or GIF. Max 5MB.
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleAvatarUpload}
                style={{ display: "none" }}
              />
            </div>
          </div>

          <div className={s.formRow}>
            <div className={s.formGroup} style={{ marginBottom: 0 }}>
              <label>Display Name</label>
              <input
                type="text"
                className={s.formInput}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className={s.formGroup} style={{ marginBottom: 0 }}>
              <label>Username</label>
              <input
                type="text"
                className={s.formInput}
                value={profile?.username ?? ""}
                disabled
              />
            </div>
          </div>
          <div className={s.formGroup}>
            <label>Bio</label>
            <textarea
              className={`${s.formInput} ${s.formInputTextarea}`}
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell subscribers about yourself..."
            />
          </div>
          <div className={s.formGroup} style={{ marginBottom: "1.5rem" }}>
            <label>Category</label>
            <select
              className={`${s.formInput} ${s.formInputSelect}`}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="general">General</option>
              <option value="art">Art &amp; Photography</option>
              <option value="music">Music</option>
              <option value="fitness">Fitness &amp; Wellness</option>
              <option value="cooking">Cooking &amp; Recipes</option>
              <option value="education">Education</option>
              <option value="entertainment">Entertainment</option>
              <option value="gaming">Gaming</option>
              <option value="lifestyle">Lifestyle</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button
            className={s.btnSave}
            onClick={handleSaveProfile}
            disabled={saving}
            style={{ opacity: saving ? 0.5 : 1 }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Privacy */}
        <div className={s.settingsSection}>
          <h3 className={s.settingsSectionTitle}>Privacy &amp; Security</h3>
          <p className={s.settingsSectionDesc}>
            Control who can see your content and how it&apos;s protected.
          </p>

          <ToggleRow
            label="Watermark content"
            desc="Automatically add watermark to photos and videos."
            defaultChecked
          />
          <ToggleRow
            label="Two-factor authentication"
            desc="Add an extra layer of security to your account."
            defaultChecked
            isLast
          />
        </div>

        {/* Notifications */}
        <div className={s.settingsSection}>
          <h3 className={s.settingsSectionTitle}>
            Notification Preferences
          </h3>
          <p className={s.settingsSectionDesc}>
            Choose which notifications you receive.
          </p>

          <ToggleRow
            label="New subscriber alerts"
            desc="Get notified when someone subscribes to your page."
            defaultChecked
          />
          <ToggleRow
            label="Tip notifications"
            desc="Get notified when you receive a tip."
            defaultChecked
          />
          <ToggleRow
            label="Payout notifications"
            desc="Get notified when a payout is processed."
            defaultChecked
          />
          <ToggleRow
            label="Marketing emails"
            desc="Receive promotional content and feature announcements."
            defaultChecked={false}
            isLast
          />
        </div>

        {/* Danger Zone */}
        <div className={`${s.settingsSection} ${s.dangerZone}`}>
          <h3 className={s.settingsSectionTitle}>Danger Zone</h3>
          <p className={s.settingsSectionDesc}>
            Irreversible account actions. Proceed with extreme caution.
          </p>

          <div
            style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}
          >
            <button
              className={s.btnDanger}
              onClick={() =>
                showToast("Account deactivation coming soon", "info")
              }
            >
              Deactivate Page
            </button>
            <button
              className={s.btnDanger}
              onClick={() =>
                showToast("Account deletion coming soon", "info")
              }
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
