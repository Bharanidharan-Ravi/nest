import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, File as FileIcon, Search, Shield, UserPlus, X } from "lucide-react";
import ChatAvatar from "./ChatAvatar";
import { decryptMediaAttachment } from "../e2ee/chatCryptoSession";
import {
  chatQueryKeys,
  conversationAvatarPhoto,
  conversationAvatarSeed,
  conversationTitle,
  isGroupAdmin,
  isGroupConversation,
  sameId,
  useChatPeople,
  useUpdateGroupIcon,
  useUpdateGroupMembers,
} from "../hooks/useChat";
import { useScrollReveal } from "../hooks/useScrollReveal";

const MAX_ADD_RESULTS = 8;

export default function ConversationInfoPanel({ conversation, userId, nameOf, photoOf, onClose, avatarRef, avatarHidden }) {
  const isGroup = isGroupConversation(conversation);
  const title = conversationTitle(conversation, userId, nameOf);
  const isAdmin = isGroupAdmin(conversation, userId);
  const onScroll = useScrollReveal();

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-white">
      <div className="flex-1 min-h-0 overflow-y-auto wg-scrollbar relative" onScroll={onScroll}>
        <div className="flex flex-col items-center gap-2 py-6 border-b border-gray-100">
          <GroupIconEditor
            conversation={conversation}
            userId={userId}
            title={title}
            photoOf={photoOf}
            editable={isGroup && isAdmin}
            avatarRef={avatarRef}
            avatarHidden={avatarHidden}
          />
          {isGroup && <p className="text-xs text-gray-400">{conversation.MemberUserIds?.length ?? 0} members</p>}
        </div>

        {isGroup && (
          <MembersSection conversation={conversation} userId={userId} nameOf={nameOf} photoOf={photoOf} isAdmin={isAdmin} />
        )}

        <MediaSection conversation={conversation} />
      </div>
    </div>
  );
}

function GroupIconEditor({ conversation, userId, title, photoOf, editable, avatarRef, avatarHidden }) {
  const updateIcon = useUpdateGroupIcon(conversation.ConversationId);
  const fileInputRef = useRef(null);

  return (
    <div ref={avatarRef} className={`relative transition-opacity duration-150 ${avatarHidden ? "opacity-0" : "opacity-100"}`}>
      <ChatAvatar
        name={title}
        seed={conversationAvatarSeed(conversation, userId)}
        photoUrl={conversationAvatarPhoto(conversation, userId, photoOf)}
        size="xl"
      />
      {editable && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) updateIcon.mutate(file);
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={updateIcon.isPending}
            className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-gray-800 text-white flex items-center justify-center border-2 border-white disabled:opacity-50"
            aria-label="Change group photo"
            title="Change group photo"
          >
            <Camera size={12} />
          </button>
        </>
      )}
      {updateIcon.isError && (
        <p className="absolute top-full mt-1 left-1/2 -translate-x-1/2 w-40 text-center text-[11px] text-red-600">
          Couldn't update the photo.
        </p>
      )}
    </div>
  );
}

function MembersSection({ conversation, userId, nameOf, photoOf, isAdmin }) {
  const updateMembers = useUpdateGroupMembers(conversation.ConversationId);
  const memberIds = conversation.MemberUserIds ?? [];
  const roles = conversation.MemberRoles ?? {};
  const roleOf = (id) => {
    const key = Object.keys(roles).find((k) => sameId(k, id));
    return key ? roles[key] : null;
  };

  return (
    <div className="border-b border-gray-100 py-2">
      <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Members</p>

      {isAdmin && <AddMembersControl conversation={conversation} updateMembers={updateMembers} />}

      <ul>
        {memberIds.map((id) => {
          const mine = sameId(id, userId);
          const admin = roleOf(id) === "Admin";
          return (
            <li key={id} className="flex items-center gap-2.5 px-3 py-1.5">
              <ChatAvatar name={mine ? "You" : nameOf(id)} seed={id} photoUrl={photoOf(id)} size="sm" />
              <span className="flex-1 min-w-0 flex items-center gap-1.5">
                <span className="truncate text-sm text-gray-800">{mine ? "You" : nameOf(id)}</span>
                {admin && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gray-100 text-[10px] font-medium text-gray-600">
                    <Shield size={9} /> Admin
                  </span>
                )}
              </span>
              {isAdmin && !mine && (
                <button
                  onClick={() => updateMembers.mutate({ removeUserIds: [id] })}
                  disabled={updateMembers.isPending}
                  className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-40"
                  aria-label={`Remove ${nameOf(id)}`}
                  title="Remove from group"
                >
                  <X size={13} />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {updateMembers.isError && <p className="px-3 pt-1 text-xs text-red-600">Couldn't update members. Try again.</p>}
    </div>
  );
}

function AddMembersControl({ conversation, updateMembers }) {
  const { people } = useChatPeople();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const memberIds = conversation.MemberUserIds ?? [];

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = people.filter((p) => !memberIds.some((id) => sameId(id, p.UserID)));
    return (q ? pool.filter((p) => p.UserName.toLowerCase().includes(q)) : pool).slice(0, MAX_ADD_RESULTS);
  }, [people, query, memberIds]);

  const add = (person) => {
    setQuery("");
    setOpen(false);
    updateMembers.mutate({ addUserIds: [person.UserID] });
  };

  return (
    <div className="relative px-3 pb-2">
      <div className="flex items-center gap-2 px-2 py-1.5 border border-gray-300 rounded-md bg-white focus-within:border-gray-500">
        <Search size={13} className="text-gray-400 shrink-0" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          disabled={updateMembers.isPending}
          placeholder="Add members…"
          className="flex-1 min-w-0 text-sm outline-none bg-transparent"
        />
        <UserPlus size={13} className="text-gray-400 shrink-0" />
      </div>

      {open && (
        <ul className="absolute z-20 left-3 right-3 mt-1 max-h-52 overflow-y-auto wg-scrollbar bg-white border border-gray-200 rounded-md shadow-lg">
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-400">No one found.</li>
          ) : (
            matches.map((person) => (
              <li key={person.UserID}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => add(person)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  <ChatAvatar name={person.UserName} seed={person.UserID} photoUrl={person.PreviewUrl} size="sm" />
                  <span className="truncate text-gray-800">{person.UserName}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

/**
 * Only covers media from messages already loaded into this client's cache (whatever pages of
 * the timeline were fetched this session) — there's no "list all media in this conversation"
 * backend endpoint. Accepted v1 limitation, not a bug: scrolling further back in the timeline
 * first would surface more items here.
 */
function MediaSection({ conversation }) {
  const queryClient = useQueryClient();
  const mediaMessages = useMemo(() => {
    const data = queryClient.getQueryData(chatQueryKeys.messages(conversation.ConversationId));
    const all = (data?.pages ?? []).flat();
    return all.filter((m) => m.decrypted?.status === "ok" && m.decrypted.body.type === "media");
  }, [queryClient, conversation.ConversationId]);

  return (
    <div className="py-2">
      <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Media</p>
      {mediaMessages.length === 0 ? (
        <p className="px-3 pb-2 text-xs text-gray-400">No media loaded from this conversation yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-1 px-3 pb-2">
          {mediaMessages.map((m) => (
            <MediaThumbnail key={m.MessageId} message={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function MediaThumbnail({ message }) {
  const { fileName, mimeType } = message.decrypted.body;
  const isImage = (mimeType ?? "").startsWith("image/");
  const [state, setState] = useState("idle"); // idle | loading | error
  const [url, setUrl] = useState(null);

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

  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);

  if (isImage && url) {
    return (
      <a href={url} download={fileName} target="_blank" rel="noreferrer" className="block aspect-square">
        <img src={url} alt={fileName} className="h-full w-full object-cover rounded" />
      </a>
    );
  }

  return (
    <button
      onClick={load}
      title={fileName}
      className="aspect-square flex flex-col items-center justify-center gap-1 rounded bg-gray-100 text-gray-500 hover:bg-gray-200 p-1"
    >
      <FileIcon size={16} />
      <span className="text-[9px] truncate max-w-full px-1">
        {state === "loading" ? "…" : state === "error" ? "Failed" : fileName}
      </span>
    </button>
  );
}
