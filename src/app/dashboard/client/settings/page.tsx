"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { updateProfile, updateAvatar } from "@/lib/actions/profile";
import { uploadFile } from "@/lib/helpers/storage";
import cs from "../client-dashboard.module.css";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ClientSettingsPage() {
  const { profile, user, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(
    profile?.display_name ?? ""
  );
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    const result = await updateProfile({
      display_name: displayName,
      bio,
    });

    if (result.success) {
      showToast("Profile saved successfully", "success");
      await refreshProfile();
    } else {
      showToast(result.message, "error");
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-sora)", fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.3rem" }}>
          Settings
        </h1>
        <p style={{ color: "var(--dim)", fontSize: "0.9rem" }}>
          Manage your account and preferences.
        </p>
      </div>

      <div className={cs.settingsSections}>
        {/* Profile Info */}
        <div className={cs.settingsSection}>
          <h3 className={cs.settingsSectionTitle}>Profile Information</h3>
          <p className={cs.settingsSectionDesc}>
            Update your profile details.
          </p>

          <div className={cs.settingsAvatarRow}>
            <div className={cs.settingsAvatar}>
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
            <div className={cs.settingsAvatarActions}>
              <button
                className={cs.settingsAvatarUpload}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? "Uploading..." : "Upload Photo"}
              </button>
              <span className={cs.settingsAvatarHint}>
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

          <div className={cs.formRow}>
            <div className={cs.formGroupNoMargin}>
              <label className={cs.formLabel}>Display Name</label>
              <input
                type="text"
                className={cs.formInput}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className={cs.formGroupNoMargin}>
              <label className={cs.formLabel}>Username</label>
              <input
                type="text"
                className={cs.formInput}
                value={profile?.username ?? ""}
                disabled
              />
            </div>
          </div>
          <div className={cs.formGroupBio}>
            <label className={cs.formLabel}>Bio</label>
            <textarea
              className={cs.formInput}
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell creators about yourself..."
              style={{ resize: "vertical", minHeight: 80 }}
            />
          </div>

          <button
            className={cs.btnSave}
            onClick={handleSaveProfile}
            disabled={saving}
            style={{ opacity: saving ? 0.5 : 1 }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Notifications */}
        <div className={cs.settingsSection}>
          <h3 className={cs.settingsSectionTitle}>
            Notification Preferences
          </h3>
          <p className={cs.settingsSectionDesc}>
            Choose which notifications you receive.
          </p>

          <ToggleRow
            label="Subscription reminders"
            desc="Get notified before subscriptions renew."
            defaultChecked
          />
          <ToggleRow
            label="New content alerts"
            desc="Get notified when creators you follow post new content."
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
        <div className={cs.dangerZone}>
          <h3 className={cs.dangerZoneTitle}>Danger Zone</h3>
          <p className={cs.settingsSectionDesc}>
            Irreversible account actions.
          </p>
          <button className={cs.btnDanger}>Delete Account</button>
        </div>
      </div>
    </div>
  );
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
    <div className={`${isLast ? "" : cs.toggleRowBorder}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0" }}>
      <div>
        <div className={cs.toggleLabel}>{label}</div>
        <div className={cs.toggleDesc}>{desc}</div>
      </div>
      <label className={cs.toggleSwitch}>
        <input
          type="checkbox"
          className={cs.toggleSwitchInput}
          checked={checked}
          onChange={() => setChecked((c) => !c)}
        />
        <span className={cs.toggleSlider} />
      </label>
    </div>
  );
}
