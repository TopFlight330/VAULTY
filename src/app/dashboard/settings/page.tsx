"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  updateProfile,
  updateSetting,
  uploadAndSetAvatar,
  deactivatePage,
  deleteAccount,
} from "@/lib/actions/profile";
import { AvatarCropModal } from "@/components/dashboard/shared/AvatarCropModal";
import s from "../dashboard.module.css";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* ── Toggle Row with DB persistence ── */
function ToggleRow({
  label,
  desc,
  settingKey,
  checked,
  onChange,
  isLast = false,
}: {
  label: string;
  desc: string;
  settingKey: string;
  checked: boolean;
  onChange: (key: string, value: boolean) => Promise<void>;
  isLast?: boolean;
}) {
  const [saving, setSaving] = useState(false);

  const handleToggle = async () => {
    setSaving(true);
    await onChange(settingKey, !checked);
    setSaving(false);
  };

  return (
    <div className={`${s.toggleRow} ${!isLast ? s.toggleRowBorder : ""}`}>
      <div>
        <div className={s.toggleLabel}>{label}</div>
        <div className={s.toggleDesc}>{desc}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {saving && (
          <div className={s.toggleSpinner}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
        )}
        <label
          className={`${s.toggleSwitch} ${checked ? s.toggleSwitchChecked : ""}`}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={handleToggle}
            disabled={saving}
          />
          <span className={s.toggleSlider} />
        </label>
      </div>
    </div>
  );
}

/* ── Deactivate Modal ── */
function DeactivateModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [selected, setSelected] = useState("");
  const [otherText, setOtherText] = useState("");
  const [saving, setSaving] = useState(false);

  const reasons = [
    "Taking a break",
    "Not enough subscribers",
    "Privacy concerns",
    "Switching to another platform",
  ];

  if (!open) return null;

  const handleConfirm = async () => {
    const reason = selected === "other" ? otherText : selected;
    if (!reason.trim()) return;
    setSaving(true);
    await onConfirm(reason);
    setSaving(false);
  };

  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <div className={s.modalIcon} style={{ background: "var(--warning-dim)", color: "var(--warning)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
        </div>
        <h3 className={s.modalTitle}>Deactivate Your Page</h3>
        <p className={s.modalDesc}>
          Your page will be hidden from visitors. You can reactivate it anytime from settings.
        </p>

        <div className={s.modalReasons}>
          {reasons.map((r) => (
            <label
              key={r}
              className={`${s.modalReasonOption} ${selected === r ? s.modalReasonOptionActive : ""}`}
            >
              <input
                type="radio"
                name="reason"
                value={r}
                checked={selected === r}
                onChange={() => { setSelected(r); setOtherText(""); }}
              />
              <span className={s.modalRadio} />
              {r}
            </label>
          ))}
          <label
            className={`${s.modalReasonOption} ${selected === "other" ? s.modalReasonOptionActive : ""}`}
          >
            <input
              type="radio"
              name="reason"
              value="other"
              checked={selected === "other"}
              onChange={() => setSelected("other")}
            />
            <span className={s.modalRadio} />
            Other
          </label>
        </div>

        {selected === "other" && (
          <textarea
            className={s.modalTextarea}
            placeholder="Tell us why you're leaving..."
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            rows={3}
          />
        )}

        <div className={s.modalActions}>
          <button className={s.btnSecondary} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className={s.btnDanger}
            onClick={handleConfirm}
            disabled={saving || (!selected || (selected === "other" && !otherText.trim()))}
            style={{ opacity: saving ? 0.5 : 1 }}
          >
            {saving ? "Deactivating..." : "Deactivate Page"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete Account Modal ── */
function DeleteModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    if (!password) return;
    setSaving(true);
    await onConfirm(password);
    setSaving(false);
  };

  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <div className={s.modalIcon} style={{ background: "var(--danger-dim)", color: "var(--danger)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
        </div>
        <h3 className={s.modalTitle} style={{ color: "var(--danger)" }}>Delete Account</h3>
        <p className={s.modalDesc}>
          This action is <strong>permanent and irreversible</strong>. All your posts, subscribers, earnings data, and profile will be permanently deleted.
        </p>

        <div className={s.modalWarningBox}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          <span>You will lose all your content, subscribers, and credit balance.</span>
        </div>

        <div className={s.formGroup} style={{ marginBottom: 0, marginTop: "1rem" }}>
          <label>Enter your password to confirm</label>
          <input
            type="password"
            className={s.formInput}
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          />
        </div>

        <div className={s.modalActions}>
          <button className={s.btnSecondary} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className={s.btnDangerSolid}
            onClick={handleConfirm}
            disabled={saving || !password}
            style={{ opacity: saving ? 0.5 : 1 }}
          >
            {saving ? "Deleting..." : "Delete My Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Settings Page ── */
export default function SettingsPage() {
  const { profile, user, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [category, setCategory] = useState(profile?.category ?? "general");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Toggle states from profile
  const [settings, setSettings] = useState({
    setting_watermark: profile?.setting_watermark ?? true,
    setting_2fa: profile?.setting_2fa ?? false,
    setting_notif_subs: profile?.setting_notif_subs ?? true,
    setting_notif_tips: profile?.setting_notif_tips ?? true,
    setting_notif_payouts: profile?.setting_notif_payouts ?? true,
    setting_marketing: profile?.setting_marketing ?? false,
  });

  // Avatar crop modal
  const [cropFile, setCropFile] = useState<File | null>(null);

  // Modals
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // Sync state when profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name);
      setUsername(profile.username);
      setBio(profile.bio);
      setCategory(profile.category);
      setSettings({
        setting_watermark: profile.setting_watermark,
        setting_2fa: profile.setting_2fa,
        setting_notif_subs: profile.setting_notif_subs,
        setting_notif_tips: profile.setting_notif_tips,
        setting_notif_payouts: profile.setting_notif_payouts,
        setting_marketing: profile.setting_marketing,
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    setSaving(true);
    const result = await updateProfile({
      display_name: displayName,
      username,
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

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("File too large. Max 5MB.", "error");
      return;
    }

    setCropFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCroppedAvatar = async (blob: Blob) => {
    if (!user) return;
    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("file", new File([blob], "avatar.jpg", { type: "image/jpeg" }));

      const result = await uploadAndSetAvatar(formData);
      if (result.success) {
        showToast("Avatar updated!", "success");
        await refreshProfile();
        setCropFile(null);
      } else {
        showToast(result.message, "error");
      }
    } catch {
      showToast("Failed to upload avatar.", "error");
    }

    setUploadingAvatar(false);
  };

  const handleToggle = async (key: string, value: boolean) => {
    // Optimistic update
    setSettings((prev) => ({ ...prev, [key]: value }));

    const result = await updateSetting(key, value);
    if (result.success) {
      await refreshProfile();
    } else {
      // Revert on failure
      setSettings((prev) => ({ ...prev, [key]: !value }));
      showToast(result.message, "error");
    }
  };

  const handleDeactivate = async (reason: string) => {
    const result = await deactivatePage(reason);
    if (result.success) {
      showToast("Page deactivated", "success");
      setShowDeactivate(false);
      await refreshProfile();
    } else {
      showToast(result.message, "error");
    }
  };

  const handleDelete = async (password: string) => {
    const result = await deleteAccount(password);
    if (result.success) {
      showToast("Account deleted", "success");
      setShowDelete(false);
      router.push("/login");
    } else {
      showToast(result.message, "error");
    }
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
                onChange={handleAvatarSelect}
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
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="your_username"
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
            settingKey="setting_watermark"
            checked={settings.setting_watermark}
            onChange={handleToggle}
          />
          <ToggleRow
            label="Two-factor authentication"
            desc="Add an extra layer of security to your account."
            settingKey="setting_2fa"
            checked={settings.setting_2fa}
            onChange={handleToggle}
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
            settingKey="setting_notif_subs"
            checked={settings.setting_notif_subs}
            onChange={handleToggle}
          />
          <ToggleRow
            label="Tip notifications"
            desc="Get notified when you receive a tip."
            settingKey="setting_notif_tips"
            checked={settings.setting_notif_tips}
            onChange={handleToggle}
          />
          <ToggleRow
            label="Payout notifications"
            desc="Get notified when a payout is processed."
            settingKey="setting_notif_payouts"
            checked={settings.setting_notif_payouts}
            onChange={handleToggle}
          />
          <ToggleRow
            label="Marketing emails"
            desc="Receive promotional content and feature announcements."
            settingKey="setting_marketing"
            checked={settings.setting_marketing}
            onChange={handleToggle}
            isLast
          />
        </div>

        {/* Danger Zone */}
        <div className={`${s.settingsSection} ${s.dangerZone}`}>
          <h3 className={s.settingsSectionTitle}>Danger Zone</h3>
          <p className={s.settingsSectionDesc}>
            Irreversible account actions. Proceed with extreme caution.
          </p>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              className={s.btnDanger}
              onClick={() => setShowDeactivate(true)}
            >
              Deactivate Page
            </button>
            <button
              className={s.btnDanger}
              onClick={() => setShowDelete(true)}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      <DeactivateModal
        open={showDeactivate}
        onClose={() => setShowDeactivate(false)}
        onConfirm={handleDeactivate}
      />
      <DeleteModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />

      {cropFile && (
        <AvatarCropModal
          imageFile={cropFile}
          onCropComplete={handleCroppedAvatar}
          onClose={() => setCropFile(null)}
        />
      )}
    </div>
  );
}
