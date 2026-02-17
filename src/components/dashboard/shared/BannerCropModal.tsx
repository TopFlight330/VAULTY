"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getCroppedImageBlob } from "@/lib/utils/cropImage";
import s from "@/app/dashboard/dashboard.module.css";

interface BannerCropModalProps {
  imageFile: File;
  onCropComplete: (blob: Blob) => Promise<void>;
  onClose: () => void;
}

const BANNER_ASPECT = 800 / 220;
const CONTAINER_H = 350;

export function BannerCropModal({ imageFile, onCropComplete, onClose }: BannerCropModalProps) {
  const [imageSrc, setImageSrc] = useState("");
  const [natW, setNatW] = useState(0);
  const [natH, setNatH] = useState(0);
  const [containerW, setContainerW] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startDragY = useRef(0);

  // Load image blob URL
  useEffect(() => {
    const url = URL.createObjectURL(imageFile);
    setImageSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // Measure container width (after modal animation + on resize)
  const measure = useCallback(() => {
    if (containerRef.current) {
      setContainerW(containerRef.current.clientWidth);
    }
  }, []);

  useEffect(() => {
    // Delayed measure to ensure modal animation is done
    const timer = setTimeout(measure, 300);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const onImgLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    setNatW(e.currentTarget.naturalWidth);
    setNatH(e.currentTarget.naturalHeight);
  }, []);

  // ── Computed layout ──
  const baseH = natW > 0 ? (containerW * natH) / natW : 0;
  const cropH = containerW > 0 ? containerW / BANNER_ASPECT : 0;
  const minZoom = baseH > 0 ? Math.max(1, cropH / baseH) : 1;
  const effectiveZoom = Math.max(zoom, minZoom);

  const dispW = containerW * effectiveZoom;
  const dispH = baseH * effectiveZoom;
  const cropTop = (CONTAINER_H - cropH) / 2;

  // Clamp drag so image always covers the selection
  const maxDragY = Math.max(0, (dispH - cropH) / 2);
  const cDragY = Math.max(-maxDragY, Math.min(maxDragY, dragY));

  // Image position (centered + drag offset)
  const imgLeft = (containerW - dispW) / 2;
  const imgTop = CONTAINER_H / 2 - dispH / 2 + cDragY;

  // ── Pointer handlers ──
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startDragY.current = cDragY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [cDragY]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    setDragY(startDragY.current + (e.clientY - startY.current));
  }, []);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // ── Save ──
  const handleSave = async () => {
    if (!imageSrc || natW === 0 || containerW === 0) return;
    setSaving(true);
    try {
      const scale = natW / dispW;
      const pixelArea = {
        x: Math.round(Math.max(0, (0 - imgLeft) * scale)),
        y: Math.round(Math.max(0, (cropTop - imgTop) * scale)),
        width: Math.round(containerW * scale),
        height: Math.round(cropH * scale),
      };
      // Clamp to image bounds
      if (pixelArea.x + pixelArea.width > natW) pixelArea.width = natW - pixelArea.x;
      if (pixelArea.y + pixelArea.height > natH) pixelArea.height = natH - pixelArea.y;

      const blob = await getCroppedImageBlob(imageSrc, pixelArea, 800, 220);
      await onCropComplete(blob);
    } catch (err) {
      console.error("Banner crop error:", err);
    }
    setSaving(false);
  };

  const ready = containerW > 0 && natW > 0;

  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div
        className={s.modal}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 600 }}
        onAnimationEnd={measure}
      >
        <h3 className={s.modalTitle}>Crop Banner</h3>

        <div
          ref={containerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{
            position: "relative",
            width: "100%",
            height: CONTAINER_H,
            background: "#000",
            overflow: "hidden",
            marginBottom: "1rem",
            cursor: isDragging.current ? "grabbing" : "grab",
            touchAction: "none",
            userSelect: "none",
          }}
        >
          {imageSrc && (
            <img
              src={imageSrc}
              onLoad={onImgLoad}
              draggable={false}
              alt=""
              style={{
                position: "absolute",
                left: imgLeft,
                top: imgTop,
                width: dispW || "100%",
                height: dispH || "auto",
                pointerEvents: "none",
                display: "block",
              }}
            />
          )}

          {ready && (
            <>
              {/* Dark overlay above selection */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: cropTop,
                  background: "rgba(0,0,0,0.5)",
                  pointerEvents: "none",
                }}
              />
              {/* Selection border */}
              <div
                style={{
                  position: "absolute",
                  top: cropTop,
                  left: 0,
                  right: 0,
                  height: cropH,
                  border: "1px solid rgba(255,255,255,0.5)",
                  boxSizing: "border-box",
                  pointerEvents: "none",
                }}
              />
              {/* Dark overlay below selection */}
              <div
                style={{
                  position: "absolute",
                  top: cropTop + cropH,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(0,0,0,0.5)",
                  pointerEvents: "none",
                }}
              />
            </>
          )}
        </div>

        {/* Zoom slider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.25rem" }}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: 18, height: 18, color: "var(--muted)", flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
          <input
            type="range"
            min={minZoom}
            max={3}
            step={0.05}
            value={effectiveZoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: "var(--pink)" }}
          />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: 18, height: 18, color: "var(--muted)", flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
            <line x1="11" y1="8" x2="11" y2="14" />
          </svg>
        </div>

        <div className={s.modalActions}>
          <button className={s.btnSecondary} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className={s.btnSave}
            onClick={handleSave}
            disabled={saving || !ready}
            style={{ opacity: saving ? 0.5 : 1 }}
          >
            {saving ? "Saving..." : "Save Banner"}
          </button>
        </div>
      </div>
    </div>
  );
}
