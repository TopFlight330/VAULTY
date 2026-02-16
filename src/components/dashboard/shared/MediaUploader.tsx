"use client";

import { useState, useRef, useCallback } from "react";

interface MediaUploaderProps {
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
}

export function MediaUploader({
  accept = "image/*,video/*",
  maxSize = 50 * 1024 * 1024,
  multiple = true,
  onFiles,
}: MediaUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const valid = Array.from(fileList).filter((f) => f.size <= maxSize);
      if (valid.length > 0) onFiles(valid);
    },
    [maxSize, onFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? "var(--pink)" : "var(--border)"}`,
        borderRadius: 14,
        padding: "2.5rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
        background: dragging ? "var(--pink-dim)" : "var(--card)",
        transition: "all 0.2s",
        textAlign: "center",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: 36, height: 36, color: "var(--muted)" }}
      >
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
      <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
        {dragging ? "Drop files here" : "Drag & drop files or click to upload"}
      </span>
      <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
        Images and videos up to {Math.round(maxSize / 1024 / 1024)}MB
      </span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
        style={{ display: "none" }}
      />
    </div>
  );
}
