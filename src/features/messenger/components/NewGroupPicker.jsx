import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import ChatAvatar from "./ChatAvatar";
import { useChatPeople } from "../hooks/useChat";
import { readUserFromSession } from "../../../core/auth/useCurrentUser";

const MAX_RESULTS = 8;
const MAX_TITLE_LENGTH = 100;

/** Title + multi-select people picker; creates a group conversation on submit. */
export default function NewGroupPicker({ onCreate, disabled = false, error, onCancel }) {
  const { people } = useChatPeople();
  const [title, setTitle] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]); // [{UserID, UserName}]
  const [open, setOpen] = useState(false);

  const user=readUserFromSession()
  console.log("user",user);
  
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = people.filter((p) => !selected.some((s) => s.UserID === p.UserID));
    return (q ? pool.filter((p) => p.UserName.toLowerCase().includes(q)) : pool).slice(0, MAX_RESULTS);
  }, [people, query, selected]);

  const add = (person) => {
    setSelected((prev) => [...prev, person]);
    setQuery("");
  };
  const remove = (userId) => setSelected((prev) => prev.filter((p) => p.UserID !== userId));

  const canSubmit = title.trim().length > 0 && selected.length > 0 && !disabled;
  const submit = () => {
    if (!canSubmit) return;
    onCreate({ title: title.trim(), memberUserIds: selected.map((p) => p.UserID) });
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={MAX_TITLE_LENGTH}
        disabled={disabled}
        placeholder="Group name"
        className="text-sm px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:border-gray-500"
      />

      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {selected.map((p) => (
            <li
              key={p.UserID}
              className="flex items-center gap-1 pl-1 pr-1.5 py-0.5 rounded-full bg-gray-100 text-xs text-gray-700"
            >
              <ChatAvatar name={p.UserName} seed={p.UserID} photoUrl={p.PreviewUrl} size="sm" />
              <span className="truncate max-w-[8rem]">{p.UserName}</span>
              <button onClick={() => remove(p.UserID)} className="text-gray-400 hover:text-gray-700" aria-label={`Remove ${p.UserName}`}>
                <X size={11} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <div className="flex items-center gap-2 px-2 py-1.5 border border-gray-300 rounded-md bg-white focus-within:border-gray-500">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              if (e.key === "Enter" && matches[0]) add(matches[0]);
            }}
            disabled={disabled}
            placeholder="Add members…"
            className="flex-1 min-w-0 text-sm outline-none bg-transparent"
          />
        </div>

        {open && !disabled && (
          <ul className="absolute z-20 left-0 right-0 mt-1 max-h-64 overflow-y-auto wg-scrollbar bg-white border border-gray-200 rounded-md shadow-lg">
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

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button onClick={onCancel} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-md">
            Cancel
          </button>
        )}
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="px-3 py-1.5 text-xs font-semibold bg-brand-yellow text-black rounded-md disabled:opacity-40"
        >
          Create group
        </button>
      </div>
    </div>
  );
}
