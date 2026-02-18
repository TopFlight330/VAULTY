"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markMessagesRead,
  pinMessage,
  deleteMessage,
  pinConversation,
  sendTipInChat,
  unlockPPVMessage,
} from "@/lib/actions/messages";
import { uploadFileWithProgress } from "@/lib/helpers/storage";
import { createClient } from "@/lib/supabase/client";
import type { ConversationWithProfile, Message } from "@/types/database";
import s from "./messages.module.css";

/* ── Helpers ── */

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function getMediaUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${path}`;
}

/* ══════ MAIN COMPONENT ══════ */

export default function MessagesPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "calc(100vh - var(--topbar-h))", margin: "-2rem", color: "var(--dim)" }}>Loading messages...</div>}>
      <MessagesContent />
    </Suspense>
  );
}

function MessagesContent() {
  const { user, profile } = useAuth();
  const searchParams = useSearchParams();
  const isCreator = profile?.role === "creator";

  // Conversations
  const [conversations, setConversations] = useState<ConversationWithProfile[]>([]);
  const [convSearch, setConvSearch] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);

  // Active chat
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [totalMessages, setTotalMessages] = useState(0);
  const [msgPage, setMsgPage] = useState(1);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Input
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPpvMode, setIsPpvMode] = useState(false);
  const [ppvPrice, setPpvPrice] = useState("");

  // Tip modal
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState("");
  const [sendingTip, setSendingTip] = useState(false);

  // UI
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);
  const [contextMenuMsg, setContextMenuMsg] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  /* ── Load conversations ── */
  const loadConversations = useCallback(async () => {
    const convs = await getConversations();
    setConversations(convs);
    setLoadingConvs(false);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  /* ── Handle ?to= parameter (open conversation with specific user) ── */
  useEffect(() => {
    const toUserId = searchParams.get("to");
    if (toUserId && user) {
      (async () => {
        const result = await getOrCreateConversation(toUserId);
        if (result) {
          setActiveConvId(result.conversationId);
          setShowMobileChat(true);
          // Refresh conversations list
          await loadConversations();
        }
      })();
    }
  }, [searchParams, user, loadConversations]);

  /* ── Load messages when conversation changes ── */
  useEffect(() => {
    if (!activeConvId) return;
    setLoadingMessages(true);
    setMsgPage(1);
    (async () => {
      const result = await getMessages(activeConvId, 1, 50);
      setMessages(result.messages);
      setTotalMessages(result.total);
      setLoadingMessages(false);
      // Mark as read
      await markMessagesRead(activeConvId);
      // Update local unread count
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConvId ? { ...c, unread_count: 0 } : c))
      );
    })();
  }, [activeConvId]);

  /* ── Scroll to bottom on new messages ── */
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  /* ── Load more messages ── */
  const loadMore = async () => {
    if (!activeConvId || loadingMessages) return;
    const nextPage = msgPage + 1;
    setLoadingMessages(true);
    const result = await getMessages(activeConvId, nextPage, 50);
    setMessages((prev) => [...result.messages, ...prev]);
    setMsgPage(nextPage);
    setLoadingMessages(false);
  };

  /* ── Supabase Realtime ── */
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    // Listen for new messages in any conversation the user is part of
    const channel = supabase
      .channel("user-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          // If this message is in the active conversation, add it
          if (newMsg.conversation_id === activeConvId && newMsg.sender_id !== user.id) {
            setMessages((prev) => [...prev, newMsg]);
            // Mark as read immediately since we're viewing
            await markMessagesRead(activeConvId);
          }
          // Refresh conversation list for updated previews / unread counts
          await loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeConvId, loadConversations]);

  /* ── Send message ── */
  const handleSend = async () => {
    if (sending) return;
    const text = inputText.trim();
    if (!text && !mediaFile) return;
    if (!activeConvId) return;

    setSending(true);
    let mediaUrl: string | null = null;
    let mediaType: string | null = null;

    // Upload media if present
    if (mediaFile) {
      const ext = mediaFile.name.split(".").pop() ?? "bin";
      const path = `${user!.id}/chat/${activeConvId}/${Date.now()}.${ext}`;
      mediaType = mediaFile.type.startsWith("video/") ? "video" : "image";

      setUploadProgress(1);
      const uploaded = await uploadFileWithProgress("post-media", path, mediaFile, (pct) => {
        setUploadProgress(pct);
      });
      setUploadProgress(0);

      if (!uploaded) {
        setSending(false);
        return;
      }
      mediaUrl = path;
    }

    const result = await sendMessage(
      activeConvId,
      text,
      mediaUrl,
      mediaType,
      isPpvMode && isCreator ? true : false,
      isPpvMode && isCreator ? parseInt(ppvPrice) || null : null
    );

    if (result.success && result.sentMessage) {
      setMessages((prev) => [...prev, result.sentMessage!]);
      setInputText("");
      setMediaFile(null);
      setMediaPreviewUrl(null);
      setIsPpvMode(false);
      setPpvPrice("");
      // Update conversation preview
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? {
                ...c,
                last_message_at: result.sentMessage!.created_at,
                last_message_preview: text || (mediaType === "video" ? "Sent a video" : "Sent an image"),
              }
            : c
        )
      );
    }
    setSending(false);
    textareaRef.current?.focus();
  };

  /* ── Handle file select ── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Non-creators can only send images
    if (!isCreator && !file.type.startsWith("image/")) {
      return;
    }

    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setMediaPreviewUrl(url);
    e.target.value = "";
  };

  /* ── Handle tip ── */
  const handleSendTip = async () => {
    if (!activeConvId || sendingTip) return;
    const amount = parseInt(tipAmount);
    if (!amount || amount <= 0) return;

    setSendingTip(true);
    const result = await sendTipInChat(activeConvId, amount);
    if (result.success) {
      setShowTipModal(false);
      setTipAmount("");
      await loadConversations();
      // Refresh messages to show the tip
      const msgResult = await getMessages(activeConvId, 1, 50);
      setMessages(msgResult.messages);
      setTotalMessages(msgResult.total);
    }
    setSendingTip(false);
  };

  /* ── Handle PPV unlock ── */
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const handleUnlockPPV = async (messageId: string) => {
    setUnlocking(messageId);
    const result = await unlockPPVMessage(messageId);
    if (result.success) {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, is_ppv_unlocked: true } : m))
      );
    }
    setUnlocking(null);
  };

  /* ── Pin/delete message ── */
  const handlePinMsg = async (messageId: string) => {
    const result = await pinMessage(messageId);
    if (result.success) {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === messageId) return { ...m, is_pinned: !m.is_pinned };
          // Unpin others
          if (m.is_pinned) return { ...m, is_pinned: false };
          return m;
        })
      );
    }
    setContextMenuMsg(null);
  };

  const handleDeleteMsg = async (messageId: string) => {
    const result = await deleteMessage(messageId);
    if (result.success) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    }
    setContextMenuMsg(null);
  };

  /* ── Pin conversation ── */
  const handlePinConv = async (convId: string) => {
    await pinConversation(convId);
    await loadConversations();
  };

  /* ── Textarea auto-resize ── */
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  /* ── Filter conversations ── */
  const filteredConvs = conversations.filter((c) =>
    !convSearch || c.other_user?.display_name?.toLowerCase().includes(convSearch.toLowerCase())
  );

  const pinnedMessage = messages.find((m) => m.is_pinned);

  /* ── Date grouping ── */
  const getMessageDate = (dateStr: string) => new Date(dateStr).toDateString();

  return (
    <div className={s.chatLayout}>
      {/* ═══ CONVERSATION LIST ═══ */}
      <div className={`${s.convPanel} ${showMobileChat ? s.convPanelHidden : ""}`}>
        <div className={s.convHeader}>
          <div className={s.convTitle}>Messages</div>
          <input
            className={s.convSearch}
            placeholder="Search conversations..."
            value={convSearch}
            onChange={(e) => setConvSearch(e.target.value)}
          />
        </div>

        <div className={s.convList}>
          {loadingConvs ? (
            <div className={s.convEmpty}>
              <div className={s.convEmptyIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
              </div>
              <div style={{ color: "var(--dim)", fontSize: "0.85rem" }}>Loading...</div>
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className={s.convEmpty}>
              <div className={s.convEmptyIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
              </div>
              <div className={s.convEmptyTitle}>No conversations</div>
              <div style={{ fontSize: "0.85rem" }}>
                {convSearch ? "No results found." : "Start a conversation from a creator's page."}
              </div>
            </div>
          ) : (
            filteredConvs.map((conv) => {
              const isPinned = conv.participant_1 === user?.id ? conv.is_pinned_by_1 : conv.is_pinned_by_2;
              return (
                <button
                  key={conv.id}
                  className={`${s.convItem} ${activeConvId === conv.id ? s.convItemActive : ""} ${isPinned ? s.convItemPinned : ""}`}
                  onClick={() => {
                    setActiveConvId(conv.id);
                    setShowMobileChat(true);
                    setContextMenuMsg(null);
                  }}
                >
                  <div className={s.convAvatar}>
                    {conv.other_user?.avatar_url ? (
                      <img src={conv.other_user.avatar_url} alt="" />
                    ) : (
                      getInitials(conv.other_user?.display_name ?? "?")
                    )}
                    {conv.other_user?.online_status === "available" && (
                      <div className={s.convOnlineDot} />
                    )}
                  </div>
                  <div className={s.convInfo}>
                    <div className={s.convName}>{conv.other_user?.display_name}</div>
                    <div className={`${s.convPreview} ${conv.unread_count > 0 ? s.convPreviewUnread : ""}`}>
                      {conv.last_message_preview || "No messages yet"}
                    </div>
                  </div>
                  <div className={s.convMeta}>
                    <div className={s.convTime}>{timeAgo(conv.last_message_at)}</div>
                    {conv.unread_count > 0 && (
                      <div className={s.convUnread}>{conv.unread_count}</div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ═══ CHAT PANEL ═══ */}
      <div className={s.chatPanel}>
        {!activeConv ? (
          /* No conversation selected */
          <div className={s.chatEmpty}>
            <div className={s.chatEmptyIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
            </div>
            <div className={s.chatEmptyTitle}>Your Messages</div>
            <div className={s.chatEmptyDesc}>Select a conversation to start chatting.</div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className={s.chatHeader}>
              <button
                className={s.chatBackBtn}
                onClick={() => {
                  setShowMobileChat(false);
                  setActiveConvId(null);
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <div className={s.chatHeaderAvatar}>
                {activeConv.other_user?.avatar_url ? (
                  <img src={activeConv.other_user.avatar_url} alt="" />
                ) : (
                  getInitials(activeConv.other_user?.display_name ?? "?")
                )}
              </div>
              <div className={s.chatHeaderInfo}>
                <div className={s.chatHeaderName}>{activeConv.other_user?.display_name}</div>
                <div className={`${s.chatHeaderStatus} ${activeConv.other_user?.online_status !== "available" ? s.chatHeaderStatusOffline : ""}`}>
                  <div className={s.chatHeaderStatusDot} />
                  {activeConv.other_user?.online_status === "available" ? "Online" : "Offline"}
                </div>
              </div>
              <div className={s.chatHeaderActions}>
                {/* Tip button (only for non-creators chatting with creators, or members) */}
                {activeConv.other_user?.role === "creator" && !isCreator && (
                  <button className={s.chatHeaderBtn} title="Send Tip" onClick={() => setShowTipModal(true)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
                  </button>
                )}
                {/* Pin conversation */}
                <button
                  className={s.chatHeaderBtn}
                  title="Pin conversation"
                  onClick={() => handlePinConv(activeConv.id)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22" /><path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24z" /></svg>
                </button>
              </div>
            </div>

            {/* Pinned Message Banner */}
            {pinnedMessage && (
              <div className={s.pinnedBanner} onClick={() => {
                const el = document.getElementById(`msg-${pinnedMessage.id}`);
                el?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}>
                <div className={s.pinnedBannerIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22" /><path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24z" /></svg>
                </div>
                <div className={s.pinnedBannerText}>
                  {pinnedMessage.body || (pinnedMessage.media_type === "video" ? "Pinned video" : "Pinned image")}
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div className={s.messagesArea} ref={messagesAreaRef}>
              {/* Load more button */}
              {messages.length < totalMessages && (
                <button className={s.loadMoreBtn} onClick={loadMore} disabled={loadingMessages}>
                  {loadingMessages ? "Loading..." : "Load older messages"}
                </button>
              )}

              {messages.map((msg, idx) => {
                const isSent = msg.sender_id === user?.id;
                const prevMsg = messages[idx - 1];
                const showDate = !prevMsg || getMessageDate(msg.created_at) !== getMessageDate(prevMsg.created_at);

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className={s.dateSeparator}>{formatDate(msg.created_at)}</div>
                    )}

                    {/* Tip message */}
                    {msg.is_tip ? (
                      <div
                        id={`msg-${msg.id}`}
                        className={`${s.msgRow} ${isSent ? s.msgRowSent : s.msgRowReceived}`}
                        style={{ maxWidth: "100%", justifyContent: isSent ? "flex-end" : "flex-start" }}
                      >
                        <div className={s.msgTip}>
                          <div className={s.msgTipIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
                          </div>
                          <div className={s.msgTipInfo}>
                            <div className={s.msgTipAmount}>{msg.tip_amount} credits</div>
                            <div className={s.msgTipLabel}>{isSent ? "Tip sent" : "Tip received"}</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Regular message */
                      <div
                        id={`msg-${msg.id}`}
                        className={`${s.msgRow} ${isSent ? s.msgRowSent : s.msgRowReceived}`}
                        onMouseEnter={() => setHoveredMsg(msg.id)}
                        onMouseLeave={() => { setHoveredMsg(null); if (contextMenuMsg === msg.id) setContextMenuMsg(null); }}
                      >
                        <div style={{ position: "relative" }}>
                          {/* Pin badge */}
                          {msg.is_pinned && (
                            <div className={s.msgPinBadge}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22" /><path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24z" /></svg>
                              Pinned
                            </div>
                          )}

                          {/* PPV media (locked) */}
                          {msg.is_ppv && !msg.is_ppv_unlocked && msg.media_url && !isSent ? (
                            <div className={s.msgPpv}>
                              <img
                                src={getMediaUrl(msg.media_url)}
                                alt=""
                                className={s.msgPpvBlur}
                              />
                              <div className={s.msgPpvOverlay}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                                <div className={s.msgPpvPrice}>Unlock for {msg.ppv_price} credits</div>
                                <button
                                  className={s.msgPpvBtn}
                                  onClick={() => handleUnlockPPV(msg.id)}
                                  disabled={unlocking === msg.id}
                                >
                                  {unlocking === msg.id ? "Unlocking..." : "Unlock"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Media */}
                              {msg.media_url && (
                                <div className={s.msgMedia}>
                                  {msg.media_type === "video" ? (
                                    <video
                                      src={getMediaUrl(msg.media_url)}
                                      controls
                                      preload="metadata"
                                    />
                                  ) : (
                                    <img
                                      src={getMediaUrl(msg.media_url)}
                                      alt=""
                                      onClick={() => setLightboxSrc(getMediaUrl(msg.media_url!))}
                                    />
                                  )}
                                </div>
                              )}

                              {/* Text bubble */}
                              {msg.body && (
                                <div className={`${s.msgBubble} ${isSent ? s.msgBubbleSent : s.msgBubbleReceived}`}>
                                  {msg.body}
                                </div>
                              )}
                            </>
                          )}

                          {/* Meta (time + read status) */}
                          <div className={`${s.msgMeta} ${!isSent ? s.msgMetaReceived : ""}`} style={{ justifyContent: isSent ? "flex-end" : "flex-start" }}>
                            <span>{new Date(msg.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                            {isSent && (
                              <span className={`${s.msgRead} ${msg.is_read ? s.msgReadDone : ""}`}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  {msg.is_read ? (
                                    <>
                                      <polyline points="1 12 5 16 12 6" />
                                      <polyline points="7 12 11 16 20 6" />
                                    </>
                                  ) : (
                                    <polyline points="5 12 10 17 20 6" />
                                  )}
                                </svg>
                              </span>
                            )}
                          </div>

                          {/* Context menu */}
                          {hoveredMsg === msg.id && (
                            <div
                              className={`${s.msgContextMenu} ${isSent ? s.msgContextMenuSent : s.msgContextMenuReceived}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Pin (creator only) */}
                              {isCreator && (
                                <button className={s.msgContextBtn} title={msg.is_pinned ? "Unpin" : "Pin"} onClick={() => handlePinMsg(msg.id)}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22" /><path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24z" /></svg>
                                </button>
                              )}
                              {/* Delete (own messages only) */}
                              {isSent && (
                                <button className={`${s.msgContextBtn} ${s.msgContextBtnDanger}`} title="Delete" onClick={() => handleDeleteMsg(msg.id)}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Area */}
            <div className={s.chatInputArea}>
              {/* Upload progress */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className={s.uploadProgress}>
                  <div className={s.uploadProgressBar}>
                    <div className={s.uploadProgressFill} style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <div className={s.uploadProgressText}>{uploadProgress}%</div>
                </div>
              )}

              {/* PPV mode bar */}
              {isPpvMode && isCreator && (
                <div className={s.ppvBar}>
                  <div className={s.ppvBarLabel}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                    PPV
                  </div>
                  <input
                    className={s.ppvBarInput}
                    type="number"
                    placeholder="Price"
                    min="1"
                    value={ppvPrice}
                    onChange={(e) => setPpvPrice(e.target.value)}
                  />
                  <span style={{ fontSize: "0.78rem", color: "var(--dim)" }}>credits</span>
                  <button className={s.ppvBarClose} onClick={() => { setIsPpvMode(false); setPpvPrice(""); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              )}

              {/* Media preview */}
              {mediaFile && mediaPreviewUrl && (
                <div className={s.mediaPreview}>
                  <div className={s.mediaPreviewThumb}>
                    {mediaFile.type.startsWith("video/") ? (
                      <video src={mediaPreviewUrl} muted />
                    ) : (
                      <img src={mediaPreviewUrl} alt="" />
                    )}
                  </div>
                  <div className={s.mediaPreviewName}>{mediaFile.name}</div>
                  <button className={s.mediaPreviewRemove} onClick={() => { setMediaFile(null); setMediaPreviewUrl(null); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              )}

              {/* Input row */}
              <div className={s.chatInputRow}>
                <div className={s.chatInputBtns}>
                  {/* Image/video attach */}
                  <button className={s.chatInputBtn} title={isCreator ? "Attach image or video" : "Attach image"} onClick={() => fileInputRef.current?.click()}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={isCreator ? "image/*,video/*" : "image/*"}
                    style={{ display: "none" }}
                    onChange={handleFileSelect}
                  />

                  {/* PPV toggle (creators only) */}
                  {isCreator && (
                    <button
                      className={`${s.chatInputBtn} ${isPpvMode ? s.chatInputBtnActive : ""}`}
                      title="Pay-per-view"
                      onClick={() => setIsPpvMode(!isPpvMode)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                    </button>
                  )}

                  {/* Tip button (non-creators only, when chatting with creator) */}
                  {!isCreator && activeConv.other_user?.role === "creator" && (
                    <button className={s.chatInputBtn} title="Send tip" onClick={() => setShowTipModal(true)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
                    </button>
                  )}
                </div>

                <textarea
                  ref={textareaRef}
                  className={s.chatTextarea}
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={handleTextareaChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={1}
                />

                <button
                  className={s.chatSendBtn}
                  onClick={handleSend}
                  disabled={sending || (!inputText.trim() && !mediaFile)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ═══ TIP MODAL ═══ */}
      {showTipModal && (
        <div className={s.tipModal} onClick={() => setShowTipModal(false)}>
          <div className={s.tipModalBox} onClick={(e) => e.stopPropagation()}>
            <div className={s.tipModalTitle}>Send a Tip</div>
            <div className={s.tipModalDesc}>
              Send credits to {activeConv?.other_user?.display_name}
            </div>
            <div className={s.tipModalPresets}>
              {[5, 10, 25, 50].map((amt) => (
                <button
                  key={amt}
                  className={`${s.tipPreset} ${tipAmount === String(amt) ? s.tipPresetActive : ""}`}
                  onClick={() => setTipAmount(String(amt))}
                >
                  {amt}
                </button>
              ))}
            </div>
            <input
              className={s.tipModalInput}
              type="number"
              placeholder="Custom amount"
              min="1"
              value={tipAmount}
              onChange={(e) => setTipAmount(e.target.value)}
            />
            <div className={s.tipModalActions}>
              <button
                className={s.tipModalCancel}
                onClick={() => { setShowTipModal(false); setTipAmount(""); }}
              >
                Cancel
              </button>
              <button
                className={s.tipModalSend}
                onClick={handleSendTip}
                disabled={sendingTip || !tipAmount || parseInt(tipAmount) <= 0}
              >
                {sendingTip ? "Sending..." : `Send ${tipAmount || 0} credits`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ LIGHTBOX ═══ */}
      {lightboxSrc && (
        <div className={s.lightbox} onClick={() => setLightboxSrc(null)}>
          <img src={lightboxSrc} alt="" onClick={(e) => e.stopPropagation()} />
          <button className={s.lightboxClose} onClick={() => setLightboxSrc(null)}>&times;</button>
        </div>
      )}
    </div>
  );
}
