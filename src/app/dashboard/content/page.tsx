"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { createPost, updatePost, deletePost, addPostMedia, getMyPosts } from "@/lib/actions/posts";
import { uploadFileWithProgress, deleteFile } from "@/lib/helpers/storage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { MediaUploader } from "@/components/dashboard/shared/MediaUploader";
import type { PostWithMedia, Visibility } from "@/types/database";
import s from "../dashboard.module.css";

interface UploadedFile {
  name: string;
  storagePath: string;
  mediaType: "image" | "video";
  progress: number;
  status: "uploading" | "done" | "error";
}

export default function ContentPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<PostWithMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<PostWithMedia | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  // Post editor state
  const [editorTitle, setEditorTitle] = useState("");
  const [editorBody, setEditorBody] = useState("");
  const [editorVisibility, setEditorVisibility] = useState<Visibility>("premium");
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [editorPpvPrice, setEditorPpvPrice] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingPost, setEditingPost] = useState<PostWithMedia | null>(null);

  const fetchPosts = useCallback(async () => {
    const data = await getMyPosts();
    setPosts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Upload files immediately when selected
  const handleFilesSelected = (files: File[]) => {
    if (!user) return;

    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/pending/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const mediaType: "image" | "video" = file.type.startsWith("video/") ? "video" : "image";

      const entry: UploadedFile = {
        name: file.name,
        storagePath: path,
        mediaType,
        progress: 0,
        status: "uploading",
      };

      setUploadedFiles((prev) => [...prev, entry]);

      // Start upload immediately (no await — runs in parallel)
      uploadFileWithProgress("post-media", path, file, (percent) => {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.storagePath === path ? { ...f, progress: percent } : f
          )
        );
      }).then((result) => {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.storagePath === path
              ? { ...f, status: result ? "done" : "error", progress: 100 }
              : f
          )
        );
        if (!result) {
          showToast(`Failed to upload ${file.name}`, "error");
        }
      });
    }
  };

  // Text formatting helpers
  const insertFormat = (prefix: string, suffix: string) => {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = editorBody;
    const selected = text.substring(start, end);
    const newText = text.substring(0, start) + prefix + selected + suffix + text.substring(end);
    setEditorBody(newText);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const popularEmojis = [
    "😀","😂","😍","🥰","😘","🤩","😎","🥳",
    "🔥","❤️","💕","💖","👀","👅","💦","💋",
    "🎉","✨","💎","🚀","👑","🎬","💰","🤑",
    "😈","🍑","🍒","💪","🙈","😏",
  ];

  const insertEmoji = (emoji: string) => {
    const ta = bodyRef.current;
    if (!ta) {
      setEditorBody((prev) => prev + emoji);
      return;
    }
    const pos = ta.selectionStart;
    const text = editorBody;
    setEditorBody(text.substring(0, pos) + emoji + text.substring(pos));
    setShowEmojiPicker(false);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(pos + emoji.length, pos + emoji.length);
    }, 0);
  };

  const removeUploadedFile = (path: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.storagePath !== path));
    deleteFile("post-media", path);
  };

  const handleSavePost = async () => {
    const pendingUploads = uploadedFiles.some((f) => f.status === "uploading");
    if (pendingUploads) {
      showToast("Please wait for all files to finish uploading.", "error");
      return;
    }

    setCreating(true);

    if (editingPost) {
      // Update existing post
      const result = await updatePost(editingPost.id, {
        title: editorTitle,
        body: editorBody,
        visibility: editorVisibility,
        ppv_price: editorVisibility === "ppv" ? parseInt(editorPpvPrice) || 0 : undefined,
      });

      if (!result.success) {
        showToast(result.message, "error");
        setCreating(false);
        return;
      }

      // Link any new uploaded media (prefix r2: for R2 storage)
      const successFiles = uploadedFiles.filter((f) => f.status === "done");
      for (let i = 0; i < successFiles.length; i++) {
        await addPostMedia({
          postId: editingPost.id,
          storagePath: `r2:${successFiles[i].storagePath}`,
          mediaType: successFiles[i].mediaType,
          sortOrder: (editingPost.media?.length ?? 0) + i,
        });
      }

      showToast("Post updated!", "success");
    } else {
      // Create new post
      const result = await createPost({
        title: editorTitle,
        body: editorBody,
        visibility: editorVisibility,
        ppv_price: editorVisibility === "ppv" ? parseInt(editorPpvPrice) || 0 : undefined,
      });

      if (!result.success) {
        showToast(result.message, "error");
        setCreating(false);
        return;
      }

      if (result.postId) {
        const successFiles = uploadedFiles.filter((f) => f.status === "done");
        for (let i = 0; i < successFiles.length; i++) {
          await addPostMedia({
            postId: result.postId,
            storagePath: `r2:${successFiles[i].storagePath}`,
            mediaType: successFiles[i].mediaType,
            sortOrder: i,
          });
        }
      }

      showToast("Post created!", "success");
    }

    setShowEditor(false);
    resetEditor();
    setCreating(false);
    fetchPosts();
  };

  const resetEditor = () => {
    setEditorTitle("");
    setEditorBody("");
    setEditorVisibility("premium");
    setEditorPpvPrice("");
    setUploadedFiles([]);
    setShowEmojiPicker(false);
    setEditingPost(null);
  };

  const openEditPost = (post: PostWithMedia) => {
    setEditingPost(post);
    setEditorTitle(post.title);
    setEditorBody(post.body || "");
    setEditorVisibility(post.visibility as Visibility);
    setEditorPpvPrice(post.ppv_price?.toString() || "");
    setUploadedFiles([]);
    setShowEditor(true);
  };

  const handleDeletePost = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deletePost(deleteTarget.id);
    if (result.success) {
      showToast("Post deleted", "success");
      setPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    } else {
      showToast(result.message, "error");
    }
    setDeleteTarget(null);
    setDeleting(false);
  };

  const visibilityClass = (v: string) => {
    if (v === "free") return s.contentVisibilityFree;
    if (v === "premium") return s.contentVisibilityPremium;
    if (v === "ppv") return s.contentVisibilityPpv;
    return "";
  };

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getThumbUrl = (post: PostWithMedia) => {
    const img = post.media?.find((m) => m.media_type === "image");
    if (!img) return null;
    const sp = img.storage_path;
    if (sp.startsWith("r2:")) {
      return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${sp.slice(3)}`;
    }
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/post-media/${sp}`;
  };

  const allUploaded = uploadedFiles.length === 0 || uploadedFiles.every((f) => f.status !== "uploading");
  const canCreate = editorTitle.trim() && allUploaded && !creating;

  return (
    <div>
      <div className={s.contentHeader}>
        <div className={s.viewHeader} style={{ marginBottom: 0 }}>
          <h1>My Content</h1>
          <p>Manage your posts, photos, and videos.</p>
        </div>
        <button className={s.btnGrad} onClick={() => { resetEditor(); setShowEditor(true); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          New Post
        </button>
      </div>

      {/* Post Editor Modal */}
      {showEditor && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !creating) setShowEditor(false);
          }}
        >
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "2rem",
              width: "100%",
              maxWidth: 560,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h2 style={{ fontFamily: "var(--font-sora)", fontWeight: 800, marginBottom: "1.5rem" }}>
              {editingPost ? "Edit Post" : "Create New Post"}
            </h2>

            <div className={s.formGroup}>
              <label className={s.formGroup}>Title</label>
              <input
                type="text"
                className={s.formInput}
                placeholder="Post title..."
                value={editorTitle}
                onChange={(e) => setEditorTitle(e.target.value)}
              />
            </div>

            <div className={s.formGroup}>
              <label className={s.formGroup}>Description</label>
              <textarea
                ref={bodyRef}
                className={`${s.formInput} ${s.formInputTextarea}`}
                rows={3}
                placeholder="Write something..."
                value={editorBody}
                onChange={(e) => setEditorBody(e.target.value)}
              />
              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                  {[
                    { label: "😀", action: () => setShowEmojiPicker((v) => !v), title: "Emoji" },
                    { label: "B", action: () => insertFormat("**", "**"), title: "Bold", fw: 800 },
                    { label: "i", action: () => insertFormat("*", "*"), title: "Italic", fs: "italic" },
                    { label: "U", action: () => insertFormat("<u>", "</u>"), title: "Underline", td: "underline" },
                  ].map((btn) => (
                    <button
                      key={btn.title}
                      type="button"
                      title={btn.title}
                      onClick={btn.action}
                      style={{
                        flex: 1,
                        height: 34,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "var(--input-bg)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        color: "var(--text)",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        fontWeight: (btn as { fw?: number }).fw || 600,
                        fontStyle: (btn as { fs?: string }).fs || "normal",
                        textDecoration: (btn as { td?: string }).td || "none",
                      }}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
                {showEmojiPicker && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "calc(100% + 8px)",
                      left: 0,
                      right: 0,
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: "0.75rem",
                      display: "grid",
                      gridTemplateColumns: "repeat(6, 1fr)",
                      gap: 4,
                      zIndex: 10,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                    }}
                  >
                    {popularEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: "1.3rem",
                          cursor: "pointer",
                          borderRadius: 8,
                          padding: "0.35rem 0",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--input-bg)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={s.formGroup}>
              <label className={s.formGroup}>Visibility</label>
              <div style={{ display: "flex", gap: 8 }}>
                {([
                  { value: "free" as Visibility, label: "Free", color: "var(--success)" },
                  { value: "premium" as Visibility, label: "Premium", color: "var(--purple)" },
                  { value: "ppv" as Visibility, label: "Pay-Per-View", color: "var(--warning)" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEditorVisibility(opt.value)}
                    style={{
                      flex: 1,
                      padding: "0.55rem 0.5rem",
                      borderRadius: 10,
                      border: editorVisibility === opt.value ? `2px solid ${opt.color}` : "2px solid var(--border)",
                      background: editorVisibility === opt.value ? `${opt.color}15` : "var(--input-bg)",
                      color: editorVisibility === opt.value ? opt.color : "var(--dim)",
                      fontWeight: 700,
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {editorVisibility === "ppv" && (
              <div className={s.formGroup}>
                <label className={s.formGroup}>PPV Price (credits)</label>
                <input
                  type="number"
                  className={s.formInput}
                  placeholder="e.g. 50"
                  value={editorPpvPrice}
                  onChange={(e) => setEditorPpvPrice(e.target.value)}
                  min="1"
                />
              </div>
            )}

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "var(--dim)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Media
              </label>
              <MediaUploader onFiles={handleFilesSelected} />
              {uploadedFiles.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "0.75rem" }}>
                  {uploadedFiles.map((f) => (
                    <div
                      key={f.storagePath}
                      style={{
                        padding: "0.5rem 0.75rem",
                        background: "var(--input-bg)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {f.status === "uploading" && (
                            <div style={{ width: 16, height: 16, border: "2px solid var(--purple)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                          )}
                          {f.status === "done" && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          )}
                          {f.status === "error" && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2.5" strokeLinecap="round" style={{ width: 16, height: 16 }}>
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          )}
                          <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                            {f.name.length > 25 ? f.name.slice(0, 25) + "..." : f.name}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {f.status === "uploading" && (
                            <span style={{ fontSize: "0.75rem", color: "var(--purple)", fontWeight: 700 }}>
                              {f.progress}%
                            </span>
                          )}
                          <button
                            onClick={() => removeUploadedFile(f.storagePath)}
                            style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "1rem", lineHeight: 1, padding: 0 }}
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                      {/* Progress bar */}
                      {f.status === "uploading" && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            height: 3,
                            width: `${f.progress}%`,
                            background: "linear-gradient(90deg, var(--pink), var(--purple))",
                            transition: "width 0.3s ease",
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                className={s.btnSecondary}
                onClick={() => { setShowEditor(false); resetEditor(); }}
                style={{ flex: 1 }}
                disabled={creating}
              >
                Cancel
              </button>
              <button
                className={s.btnSave}
                onClick={handleSavePost}
                disabled={!canCreate}
                style={{ flex: 1, opacity: canCreate ? 1 : 0.5 }}
              >
                {creating ? "Saving..." : editingPost ? "Save Changes" : "Create Post"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Grid */}
      {loading ? (
        <div className={s.contentGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={s.contentPost}>
              <div className={s.contentThumb} />
              <div className={s.contentBody}>
                <div style={{ height: 16, width: "70%", background: "var(--input-bg)", borderRadius: 8, marginBottom: "0.5rem" }} />
                <div style={{ height: 12, width: "40%", background: "var(--input-bg)", borderRadius: 8 }} />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4rem 2rem", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--input-bg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28, color: "var(--muted)" }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
          </div>
          <div style={{ fontFamily: "var(--font-sora)", fontSize: "1.1rem", fontWeight: 800, marginBottom: "0.4rem" }}>No content yet</div>
          <div style={{ fontSize: "0.88rem", color: "var(--dim)", marginBottom: "1.5rem", maxWidth: 320 }}>
            Create your first post to start sharing with your subscribers.
          </div>
          <button className={s.btnGrad} onClick={() => { resetEditor(); setShowEditor(true); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Create First Post
          </button>
        </div>
      ) : (
        <div className={s.contentGrid}>
          {posts.map((post) => {
            const thumbUrl = getThumbUrl(post);
            return (
              <div key={post.id} className={s.contentPost}>
                <div className={s.contentThumb}>
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                  )}
                  <span className={`${s.contentVisibility} ${visibilityClass(post.visibility)}`}>
                    {post.visibility === "ppv" ? "PPV" : capitalize(post.visibility)}
                  </span>
                </div>
                <div className={s.contentBody}>
                  <div className={s.contentTitle}>{post.title}</div>
                  <div className={s.contentDate}>{formatDate(post.created_at)}</div>
                  <div className={s.contentStats}>
                    <span className={s.contentStat}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
                      {post.like_count.toLocaleString()}
                    </span>
                    <span className={s.contentStat}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      {post.view_count.toLocaleString()}
                    </span>
                    {post.visibility === "ppv" && post.ppv_price && (
                      <span className={s.contentStat} style={{ color: "var(--warning)" }}>
                        {post.ppv_price} credits
                      </span>
                    )}
                  </div>
                  <div className={s.contentActions}>
                    <button
                      className={s.contentActionBtn}
                      onClick={() => openEditPost(post)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      Edit
                    </button>
                    <button
                      className={`${s.contentActionBtn} ${s.contentActionBtnDelete}`}
                      onClick={() => setDeleteTarget(post)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onConfirm={handleDeletePost}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Post"
        message={`Delete "${deleteTarget?.title ?? ""}"? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
