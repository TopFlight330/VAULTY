"use client";

import { useState, useEffect, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { getCroppedImageBlob } from "@/lib/utils/cropImage";
import s from "@/app/dashboard/dashboard.module.css";

interface BannerCropModalProps {
  imageFile: File;
  onCropComplete: (blob: Blob) => Promise<void>;
  onClose: () => void;
}

export function BannerCropModal({ imageFile, onCropComplete, onClose }: BannerCropModalProps) {
  const [imageSrc, setImageSrc] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(imageFile);
    setImageSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const handleCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    setSaving(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels, 1080, 360);
      await onCropComplete(blob);
    } catch {
      // Error handling delegated to parent
    }
    setSaving(false);
  };

  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <h3 className={s.modalTitle}>Crop Banner</h3>

        <div style={{
          position: "relative",
          width: "100%",
          height: 250,
          background: "#000",
          borderRadius: 12,
          overflow: "hidden",
          marginBottom: "1rem",
        }}>
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={3}
              cropShape="rect"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          )}
        </div>

        {/* Zoom slider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.25rem" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ width: 18, height: 18, color: "var(--muted)", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: "var(--pink)" }}
          />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ width: 18, height: 18, color: "var(--muted)", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="11" y1="8" x2="11" y2="14"/>
          </svg>
        </div>

        <div className={s.modalActions}>
          <button className={s.btnSecondary} onClick={onClose} disabled={saving}>Cancel</button>
          <button className={s.btnSave} onClick={handleSave} disabled={saving || !croppedAreaPixels}
            style={{ opacity: saving ? 0.5 : 1 }}>
            {saving ? "Saving..." : "Save Banner"}
          </button>
        </div>
      </div>
    </div>
  );
}
