import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  AtSign,
  CornerUpLeft,
  Download,
  File as FileIcon,
  Hash,
  Lock,
  Mic,
  Pause,
  Paperclip,
  Play,
  Send,
  Smile,
  Square,
  X,
} from "lucide-react";
import ChatLockedNotice from "./ChatLockedNotice";
import { CHAT_IDENTITY_STATUS, useChatIdentityStore } from "../e2ee/chatIdentityStore";
import { ChatTagEntityType, RecipientNotReadyError, decryptMediaAttachment } from "../e2ee/chatCryptoSession";
import { MAX_MEDIA_BYTES } from "../e2ee/mediaCrypto";
import {
  COMMON_REACTIONS,
  MAX_MESSAGE_LENGTH,
  groupReactions,
  isGroupConversation,
  markConversationRead,
  messagePreview,
  sameId,
  useChatUserId,
  useMessages,
  useSendMedia,
  useSendMessage,
  useToggleReaction,
} from "../hooks/useChat";
import { useTagEntitySources, useTagPeopleSources } from "../hooks/useTagSources";
import { useChatUiStore } from "../state/useChatUiStore";
import { formatDayLabel, formatMessageTime, isSameDay } from "../utils/chatTime";
import { splitTaggedText, tagPath } from "../utils/tagText";
import { detectTrigger } from "../utils/tagTrigger";

const NEAR_BOTTOM_PX = 120;

function sendErrorText(error, nameOf) {
  if (error instanceof RecipientNotReadyError) {
    const names = error.userIds.map(nameOf).join(", ");
    return `${names} hasn't set up secure chat yet — they need to log in to WGNest once.`;
  }
  return error?.response?.data?.errorMessage ?? error?.message ?? "Message not sent.";
}

/**
 * Timeline + composer for one conversation. Used full-size on the Messages page
 * and compact inside the message bar's chat windows.
 */
export default function ConversationView({ conversation, nameOf, compact = false }) {
  const ready = useChatIdentityStore((s) => s.status === CHAT_IDENTITY_STATUS.READY);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {ready ? (
        <Timeline conversation={conversation} nameOf={nameOf} compact={compact} />
      ) : (
        <ChatLockedNotice compact={compact} />
      )}
    </div>
  );
}

function Timeline({ conversation, nameOf, compact }) {
  const userId = useChatUserId();
  const queryClient = useQueryClient();
  const conversationId = conversation.ConversationId;
  const isGroup = isGroupConversation(conversation);
  const [replyTo, setReplyTo] = useState(null);

  // While the timeline is on screen, incoming messages count as read (not notified)
  useEffect(() => useChatUiStore.getState().registerVisible(conversationId), [conversationId]);

  const unread = conversation.UnreadCount ?? 0;
  useEffect(() => {
    const markIfVisible = () => {
      if (document.visibilityState === "visible") markConversationRead(queryClient, conversationId);
    };
    markIfVisible();
    document.addEventListener("visibilitychange", markIfVisible);
    return () => document.removeEventListener("visibilitychange", markIfVisible);
  }, [queryClient, conversationId, unread]);

  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage, refetch } = useMessages(
    conversation.ConversationId,
  );
  const send = useSendMessage(conversation);
  const sendMedia = useSendMedia(conversation);
  const toggleReaction = useToggleReaction(conversationId);

  const scrollRef = useRef(null);
  const nearBottom = useRef(true);
  const restoreFrom = useRef(null); // scrollHeight before older messages were prepended

  const messages = useMemo(() => [...(data?.pages ?? [])].reverse().flat(), [data]);
  const newest = messages[messages.length - 1];
  const byId = useMemo(() => new Map(messages.map((m) => [String(m.MessageId).toLowerCase(), m])), [messages]);

  // Keep the reader's place when older messages load above; otherwise follow new messages
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (restoreFrom.current != null) {
      el.scrollTop += el.scrollHeight - restoreFrom.current;
      restoreFrom.current = null;
      return;
    }
    if (nearBottom.current || sameId(newest?.SenderUserId, userId)) el.scrollTop = el.scrollHeight;
  }, [messages.length, newest?.MessageId, newest?.SenderUserId, userId]);

  const loadOlder = () => {
    restoreFrom.current = scrollRef.current?.scrollHeight ?? null;
    fetchNextPage().catch(() => (restoreFrom.current = null));
  };

  const onScroll = () => {
    const el = scrollRef.current;
    nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    if (el.scrollTop < 40 && hasNextPage && !isFetchingNextPage) loadOlder();
  };

  const bubbleWidth = compact ? "max-w-[85%]" : "max-w-[75%]";

  return (
    <>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className={`flex-1 overflow-y-auto ${compact ? "px-2" : "px-4"} py-3 bg-gray-50 flex flex-col gap-1.5`}
      >
        {hasNextPage && (
          <button
            onClick={loadOlder}
            disabled={isFetchingNextPage}
            className="self-center text-xs text-gray-500 hover:text-gray-800 py-1"
          >
            {isFetchingNextPage ? "Loading…" : "Load older messages"}
          </button>
        )}

        {isLoading && <p className="text-sm text-gray-400 text-center mt-6">Decrypting messages…</p>}
        {isError && (
          <div className="text-sm text-center mt-6">
            <p className="text-red-600">Couldn't load messages.</p>
            <button onClick={() => refetch()} className="text-gray-600 underline text-xs mt-1">
              Try again
            </button>
          </div>
        )}
        {!isLoading && !isError && messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2 text-center">
            <Lock size={compact ? 18 : 24} />
            <p className="text-xs max-w-[220px]">
              {isGroup
                ? `Messages are end-to-end encrypted. Only the ${conversation.MemberUserIds.length} members of this group can read them.`
                : `Messages are end-to-end encrypted. Only you and ${nameOf(conversation.MemberUserIds.find((id) => !sameId(id, userId)))} can read them.`}
            </p>
          </div>
        )}

        {messages.map((m, index) => {
          const previous = messages[index - 1];
          const mine = sameId(m.SenderUserId, userId);
          const showDay = !previous || !isSameDay(previous.CreatedAt, m.CreatedAt);
          const grouped = !showDay && previous && sameId(previous.SenderUserId, m.SenderUserId);
          const replySource = m.ReplyToMessageId ? byId.get(String(m.ReplyToMessageId).toLowerCase()) : null;

          return (
            <Fragment key={m.MessageId}>
              {showDay && (
                <div className="self-center my-2 px-2 py-0.5 rounded-full bg-white border border-gray-200 text-[11px] text-gray-500">
                  {formatDayLabel(m.CreatedAt)}
                </div>
              )}
              <MessageBubble
                message={m}
                mine={mine}
                grouped={grouped}
                widthClass={bubbleWidth}
                senderName={isGroup && !mine ? nameOf(m.SenderUserId) : null}
                replySource={m.ReplyToMessageId ? { message: replySource, senderName: replySource ? nameOf(replySource.SenderUserId) : null } : null}
                reactions={groupReactions(m, userId)}
                onRetry={() => send.mutate({ retry: m })}
                onReply={() => setReplyTo(m)}
                onJumpToReply={() => replySource && jumpToMessage(scrollRef, replySource.MessageId)}
                onToggleReaction={(emoji) => toggleReaction.mutate({ messageId: m.MessageId, emoji })}
              />
            </Fragment>
          );
        })}
      </div>

      <Composer
        compact={compact}
        disabled={send.isPending && !send.variables?.retry}
        error={send.isError && !send.variables?.retry ? sendErrorText(send.error, nameOf) : null}
        mediaSending={sendMedia.isPending}
        mediaError={sendMedia.isError ? sendErrorText(sendMedia.error, nameOf) : null}
        replyTo={replyTo}
        replyToSenderName={replyTo ? (sameId(replyTo.SenderUserId, userId) ? "yourself" : nameOf(replyTo.SenderUserId)) : null}
        onCancelReply={() => setReplyTo(null)}
        onSend={(text, tags, done) => send.mutate({ text, replyTo, tags }, { onSuccess: () => { done(); setReplyTo(null); } })}
        onSendFile={(file) => sendMedia.mutate({ file, kind: "media", replyTo }, { onSuccess: () => setReplyTo(null) })}
        onSendVoice={(blob, durationMs) =>
          sendMedia.mutate({ file: blob, kind: "voice", durationMs, replyTo }, { onSuccess: () => setReplyTo(null) })
        }
        onType={() => send.isError && send.reset()}
      />
    </>
  );
}

function jumpToMessage(scrollRef, messageId) {
  const el = scrollRef.current?.querySelector(`[data-message-id="${CSS.escape(String(messageId))}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add("ring-2", "ring-brand-yellow");
  setTimeout(() => el.classList.remove("ring-2", "ring-brand-yellow"), 1200);
}

/** Turns a message's plaintext into clickable chips wherever a Tags[].DisplayText token appears. */
function TaggedText({ text, tags, mine }) {
  const navigate = useNavigate();
  const segments = useMemo(() => splitTaggedText(text, tags), [text, tags]);

  return (
    <>
      {segments.map((seg, i) => {
        if (!seg.tag) return <Fragment key={i}>{seg.text}</Fragment>;
        const path = tagPath(seg.tag.EntityType, seg.tag.EntityId);
        return (
          <span
            key={i}
            onClick={path ? () => navigate(path) : undefined}
            className={[
              "font-semibold rounded px-0.5",
              mine ? "bg-black/10" : "bg-brand-yellow/30",
              path ? "cursor-pointer hover:underline" : "",
            ].join(" ")}
          >
            {seg.text}
          </span>
        );
      })}
    </>
  );
}

function formatFileSize(bytes) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatDuration(ms) {
  const totalSeconds = Math.round((ms ?? 0) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** File/image attachment bubble. Decrypts on demand (images auto-load once sent) — plaintext is
 * held only as an in-memory object URL, revoked when the bubble unmounts. */
function MediaAttachmentContent({ message, mine }) {
  const { fileName, mimeType, size } = message.decrypted.body;
  const [state, setState] = useState("idle"); // idle | loading | error
  const [url, setUrl] = useState(null);
  const isImage = (mimeType ?? "").startsWith("image/");

  const load = async () => {
    if (state === "loading" || url) return;
    setState("loading");
    try {
      const plaintext = await decryptMediaAttachment(message);
      const blob = new Blob([plaintext], { type: mimeType || "application/octet-stream" });
      setUrl(URL.createObjectURL(blob));
      setState("idle");
    } catch {
      setState("error");
    }
  };

  useEffect(() => {
    if (isImage && !message.pending) load();
    // Only on mount — re-running per render would re-fetch/re-decrypt unnecessarily.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);

  if (isImage) {
    return (
      <div className="max-w-[240px]">
        {url ? (
          <a href={url} download={fileName} target="_blank" rel="noreferrer">
            <img src={url} alt={fileName} className="rounded-lg max-h-64 w-auto" />
          </a>
        ) : (
          <button
            onClick={load}
            className="flex items-center justify-center h-32 w-full rounded-lg bg-black/5 text-xs text-gray-500"
          >
            {state === "loading" ? "Decrypting…" : state === "error" ? "Couldn't load image" : "Tap to view"}
          </button>
        )}
        <p className="text-[11px] mt-1 truncate">{fileName}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 min-w-[180px] max-w-[240px]">
      <button
        onClick={load}
        className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${mine ? "bg-black/10" : "bg-gray-100"}`}
        aria-label="Download attachment"
      >
        <FileIcon size={15} />
      </button>
      <span className="min-w-0 flex-1">
        <span className="block text-sm truncate">{fileName}</span>
        <span className="block text-[11px] text-gray-500">
          {state === "loading" ? "Decrypting…" : state === "error" ? "Couldn't load" : formatFileSize(size)}
        </span>
      </span>
      {url && (
        <a href={url} download={fileName} className="shrink-0 p-1 text-gray-500 hover:text-gray-800" aria-label="Save file">
          <Download size={15} />
        </a>
      )}
    </div>
  );
}

/** Inline voice-note player. Decrypts on first play; the audio element streams from the
 * in-memory object URL, which is revoked when the bubble unmounts. */
function VoiceMessagePlayer({ message, mine }) {
  const { durationMs, mimeType } = message.decrypted.body;
  const audioRef = useRef(null);
  const [url, setUrl] = useState(null);
  const [state, setState] = useState("idle"); // idle | loading | error
  const [playing, setPlaying] = useState(false);

  const ensureLoaded = async () => {
    if (url) return url;
    setState("loading");
    try {
      const plaintext = await decryptMediaAttachment(message);
      const blob = new Blob([plaintext], { type: mimeType || "audio/webm" });
      const objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
      setState("idle");
      return objectUrl;
    } catch {
      setState("error");
      return null;
    }
  };

  const toggle = async () => {
    if (playing) {
      audioRef.current?.pause();
      return;
    }
    const objectUrl = await ensureLoaded();
    if (!objectUrl) return;
    requestAnimationFrame(() => audioRef.current?.play());
  };

  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);

  return (
    <div className="flex items-center gap-2 min-w-[160px]">
      <button
        onClick={toggle}
        disabled={state === "loading"}
        className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${mine ? "bg-black/10" : "bg-gray-100"}`}
        aria-label={playing ? "Pause voice message" : "Play voice message"}
      >
        {playing ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <span className="text-xs text-gray-500">
        {state === "loading" ? "Decrypting…" : state === "error" ? "Couldn't load" : formatDuration(durationMs) || "Voice message"}
      </span>
      {url && (
        <audio
          ref={audioRef}
          src={url}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          className="hidden"
        />
      )}
    </div>
  );
}

function MessageBubble({
  message,
  mine,
  grouped,
  widthClass,
  senderName,
  replySource,
  reactions,
  onRetry,
  onReply,
  onJumpToReply,
  onToggleReaction,
}) {
  const result = message.decrypted;
  const [pickerOpen, setPickerOpen] = useState(false);

  let content;
  if (result?.status === "ok" && result.body.type === "voice") {
    content = <VoiceMessagePlayer message={message} mine={mine} />;
  } else if (result?.status === "ok" && result.body.type === "media") {
    content = <MediaAttachmentContent message={message} mine={mine} />;
  } else if (result?.status === "ok") {
    content = (
      <p className="text-sm whitespace-pre-wrap break-words">
        <TaggedText text={result.body.text} tags={message.Tags} mine={mine} />
      </p>
    );
  } else {
    const text =
      result?.status === "no-key"
        ? "This message wasn't encrypted for you."
        : result?.status === "locked"
          ? "Unlock secure chat to read this message."
          : "This message couldn't be decrypted.";
    content = (
      <p className="text-sm italic text-gray-500 flex items-center gap-1">
        <Lock size={12} /> {text}
      </p>
    );
  }

  return (
    <div
      data-message-id={message.MessageId}
      className={`group/bubble ${widthClass} ${mine ? "self-end items-end" : "self-start items-start"} flex flex-col ${grouped ? "" : "mt-1.5"} transition-shadow rounded-2xl`}
    >
      {senderName && !grouped && <span className="text-[11px] text-gray-500 ml-2.5 mb-0.5">{senderName}</span>}
      <div className="relative flex items-end gap-1">
        {!mine && (
          <BubbleActions
            onReply={onReply}
            pickerOpen={pickerOpen}
            setPickerOpen={setPickerOpen}
            onToggleReaction={onToggleReaction}
            align="left"
          />
        )}
        <div className="min-w-0">
          <div
            className={[
              "rounded-2xl px-3 py-1.5 shadow-sm",
              mine ? "bg-brand-yellow text-black rounded-br-md" : "bg-white text-gray-800 rounded-bl-md",
              message.pending ? "opacity-70" : "",
              message.failed ? "ring-1 ring-red-400" : "",
            ].join(" ")}
          >
            {replySource !== null && (
              <button
                onClick={onJumpToReply}
                className={[
                  "block w-full text-left mb-1 px-2 py-1 rounded-lg border-l-2 text-[11px] truncate",
                  mine ? "bg-black/10 border-black/30 text-black/70" : "bg-gray-100 border-gray-300 text-gray-500",
                ].join(" ")}
              >
                <span className="font-semibold">{replySource.message ? replySource.senderName : "Original message"}</span>
                {": "}
                {replySource.message ? messagePreview(replySource.message) || "Message" : "no longer available"}
              </button>
            )}
            {content}
            <p className="text-[10px] text-gray-500 text-right mt-0.5">
              {message.pending ? "Sending…" : formatMessageTime(message.CreatedAt)}
            </p>
          </div>
          {reactions.length > 0 && (
            <div className={`flex flex-wrap gap-1 mt-1 ${mine ? "justify-end" : "justify-start"}`}>
              {reactions.map((chip) => (
                <button
                  key={chip.emoji}
                  onClick={() => onToggleReaction(chip.emoji)}
                  className={[
                    "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] border",
                    chip.mine ? "bg-brand-yellow/20 border-brand-yellow text-gray-800" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300",
                  ].join(" ")}
                  title={chip.mine ? "Remove your reaction" : "React"}
                >
                  <span>{chip.emoji}</span>
                  <span>{chip.count}</span>
                </button>
              ))}
            </div>
          )}
          {message.failed && message.Media ? (
            // Media/voice sends aren't retryable yet — the encrypted file bytes aren't kept
            // around after a failed upload attempt (unlike text, which resends the same ciphertext).
            <p className="mt-0.5 text-[11px] text-red-600 flex items-center gap-1">
              <AlertCircle size={11} /> Not sent
            </p>
          ) : (
            message.failed && (
              <button onClick={onRetry} className="mt-0.5 text-[11px] text-red-600 flex items-center gap-1 hover:underline">
                <AlertCircle size={11} /> Not sent · Tap to retry
              </button>
            )
          )}
        </div>
        {mine && (
          <BubbleActions
            onReply={onReply}
            pickerOpen={pickerOpen}
            setPickerOpen={setPickerOpen}
            onToggleReaction={onToggleReaction}
            align="right"
          />
        )}
      </div>
    </div>
  );
}

function BubbleActions({ onReply, pickerOpen, setPickerOpen, onToggleReaction, align }) {
  return (
    <div className="relative flex items-center gap-0.5 opacity-0 group-hover/bubble:opacity-100 transition-opacity shrink-0">
      <button
        onClick={onReply}
        className="p-1 text-gray-400 hover:text-gray-700"
        aria-label="Reply"
        title="Reply"
      >
        <CornerUpLeft size={13} />
      </button>
      <button
        onClick={() => setPickerOpen((open) => !open)}
        className="p-1 text-gray-400 hover:text-gray-700"
        aria-label="React"
        title="React"
      >
        <Smile size={13} />
      </button>
      {pickerOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setPickerOpen(false)} />
          <div
            className={`absolute bottom-full mb-1 ${align === "right" ? "right-0" : "left-0"} z-20 flex gap-0.5 bg-white border border-gray-200 rounded-full shadow-lg px-1.5 py-1`}
          >
            {COMMON_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onToggleReaction(emoji);
                  setPickerOpen(false);
                }}
                className="text-base leading-none p-1 rounded-full hover:bg-gray-100"
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const MAX_TAG_MATCHES = 8;

/** MediaRecorder wrapper: start/stop/cancel a voice note; `onSendVoice(blob, durationMs)` fires on stop. */
function useVoiceRecorder(onSendVoice) {
  const supported = typeof window !== "undefined" && !!window.MediaRecorder && !!navigator.mediaDevices;
  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const startRef = useRef(0);
  const timerRef = useRef(null);
  const cancelledRef = useRef(false);

  const cleanup = () => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setRecording(false);
    setElapsedMs(0);
  };

  const start = async () => {
    if (!supported || recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      cancelledRef.current = false;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const instance = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      instance.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      instance.onstop = () => {
        const durationMs = Date.now() - startRef.current;
        const blob = new Blob(chunksRef.current, { type: mimeType });
        cleanup();
        if (!cancelledRef.current && blob.size > 0) onSendVoice(blob, durationMs);
      };
      mediaRecorderRef.current = instance;
      startRef.current = Date.now();
      instance.start();
      setRecording(true);
      timerRef.current = setInterval(() => setElapsedMs(Date.now() - startRef.current), 250);
    } catch {
      cleanup();
    }
  };

  const stop = () => mediaRecorderRef.current?.stop();
  const cancel = () => {
    cancelledRef.current = true;
    mediaRecorderRef.current?.stop();
  };

  // Release the microphone if the composer unmounts mid-recording (e.g. closing a docked window)
  useEffect(
    () => () => {
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  return { supported, recording, elapsedMs, start, stop, cancel };
}

function Composer({
  compact,
  disabled,
  error,
  mediaSending,
  mediaError,
  replyTo,
  replyToSenderName,
  onCancelReply,
  onSend,
  onSendFile,
  onSendVoice,
  onType,
}) {
  const [text, setText] = useState("");
  const [tagsByToken, setTagsByToken] = useState(new Map());
  const [trigger, setTrigger] = useState(null); // { type: "@"|"#", query, start }
  const [entitySourcesEnabled, setEntitySourcesEnabled] = useState(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const recorder = useVoiceRecorder(onSendVoice);

  const peopleSources = useTagPeopleSources();
  const entitySources = useTagEntitySources(entitySourcesEnabled);

  // Grow with the text, up to a few lines
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, compact ? 96 : 160)}px`;
  }, [text, compact]);

  const matches = useMemo(() => {
    if (!trigger) return [];
    const pool = trigger.type === "@" ? peopleSources : entitySources;
    const q = trigger.query.trim().toLowerCase();
    const filtered = q
      ? pool.filter((item) => item.label.toLowerCase().includes(q) || item.displayText.toLowerCase().includes(q))
      : pool;
    return filtered.slice(0, MAX_TAG_MATCHES);
  }, [trigger, peopleSources, entitySources]);

  const updateTrigger = (value, cursor) => {
    const next = detectTrigger(value, cursor);
    setTrigger(next);
    if (next?.type === "#") setEntitySourcesEnabled(true);
  };

  const pickTag = (item) => {
    const el = inputRef.current;
    if (!trigger || !el) return;
    const cursor = el.selectionStart ?? text.length;
    const before = text.slice(0, trigger.start);
    const after = text.slice(cursor);
    const inserted = `${item.displayText} `;
    const nextText = `${before}${inserted}${after}`;

    setText(nextText);
    setTagsByToken((prev) => new Map(prev).set(item.displayText, item));
    setTrigger(null);

    requestAnimationFrame(() => {
      const pos = before.length + inserted.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const submit = () => {
    const value = text.trim();
    if (!value || disabled) return;
    const tags = [...tagsByToken.values()].filter((t) => text.includes(t.displayText));
    onSend(value, tags, () => {
      setText("");
      setTagsByToken(new Map());
      setTrigger(null);
      inputRef.current?.focus();
    });
  };

  const remaining = MAX_MESSAGE_LENGTH - text.length;

  return (
    <div className={`border-t border-gray-200 bg-white relative ${compact ? "p-2" : "p-3"}`}>
      {replyTo && (
        <div className="flex items-center gap-2 mb-1.5 px-2 py-1 bg-gray-100 rounded-lg border-l-2 border-gray-300">
          <CornerUpLeft size={12} className="text-gray-400 shrink-0" />
          <span className="min-w-0 flex-1 text-[11px] text-gray-600 truncate">
            <span className="font-semibold">Replying to {replyToSenderName}</span>
            {": "}
            {messagePreview(replyTo) || "Message"}
          </span>
          <button onClick={onCancelReply} className="p-0.5 text-gray-400 hover:text-gray-700 shrink-0" aria-label="Cancel reply">
            <X size={13} />
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-600 mb-1.5">{error}</p>}
      {mediaError && <p className="text-xs text-red-600 mb-1.5">{mediaError}</p>}

      {trigger && matches.length > 0 && (
        <ul className="absolute z-20 left-2 right-2 bottom-full mb-1 max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          {matches.map((item) => (
            <li key={`${item.entityType}:${item.entityId}`}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pickTag(item)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-50"
              >
                {item.entityType === ChatTagEntityType.User ? (
                  <AtSign size={12} className="text-gray-400 shrink-0" />
                ) : (
                  <Hash size={12} className="text-gray-400 shrink-0" />
                )}
                <span className="min-w-0 flex-1 truncate text-gray-800">{item.label}</span>
                {item.entityType !== ChatTagEntityType.User && (
                  <span className="text-[10px] text-gray-400 shrink-0">{item.entityType}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {recorder.recording && (
        <div className="flex items-center gap-2 mb-1.5 px-2 py-1 bg-red-50 rounded-lg text-xs text-red-600">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          Recording… {formatDuration(recorder.elapsedMs)}
          <button onClick={recorder.cancel} className="ml-auto text-gray-500 hover:text-gray-800">
            Cancel
          </button>
        </div>
      )}

      <div className="flex gap-2 items-end">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            if (file.size > MAX_MEDIA_BYTES) return;
            onSendFile(file);
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={mediaSending || recorder.recording}
          className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-40"
          aria-label="Attach a file"
          title="Attach a file"
        >
          <Paperclip size={16} />
        </button>
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            updateTrigger(e.target.value, e.target.selectionStart ?? e.target.value.length);
            onType();
          }}
          onClick={(e) => updateTrigger(text, e.target.selectionStart ?? text.length)}
          onKeyUp={(e) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
            updateTrigger(text, e.target.selectionStart ?? text.length);
          }}
          onKeyDown={(e) => {
            if (trigger && matches.length > 0) {
              if (e.key === "Escape") {
                e.preventDefault();
                setTrigger(null);
                return;
              }
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                pickTag(matches[0]);
                return;
              }
            }
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          maxLength={MAX_MESSAGE_LENGTH}
          rows={1}
          placeholder="Write a message… (@ to mention, # to tag)"
          className="flex-1 resize-none text-sm px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:border-gray-500"
        />
        {text.trim() ? (
          <button
            onClick={submit}
            disabled={!text.trim() || disabled}
            className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full bg-brand-yellow text-black disabled:opacity-40"
            aria-label="Send"
          >
            <Send size={16} />
          </button>
        ) : (
          <button
            onClick={recorder.recording ? recorder.stop : recorder.start}
            disabled={mediaSending || !recorder.supported}
            className={[
              "h-9 w-9 shrink-0 flex items-center justify-center rounded-full disabled:opacity-40",
              recorder.recording ? "bg-red-500 text-white" : "bg-brand-yellow text-black",
            ].join(" ")}
            aria-label={recorder.recording ? "Stop and send voice message" : "Record a voice message"}
            title={recorder.supported ? "Record a voice message" : "Voice recording isn't supported in this browser"}
          >
            {recorder.recording ? <Square size={14} /> : <Mic size={16} />}
          </button>
        )}
      </div>
      {remaining < 200 && <p className="text-[10px] text-gray-400 text-right mt-1">{remaining} characters left</p>}
    </div>
  );
}
