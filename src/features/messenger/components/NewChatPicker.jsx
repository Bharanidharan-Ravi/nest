import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import ChatAvatar from "./ChatAvatar";
import { useChatPeople } from "../hooks/useChat";

const MAX_RESULTS = 8;

/** Search box that lists active employees; picking one opens (or creates) the 1:1 chat. */
export default function NewChatPicker({ onPick, disabled = false, error }) {
  const { people } = useChatPeople();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (q ? people.filter((p) => p.UserName.toLowerCase().includes(q)) : people).slice(0, MAX_RESULTS);
  }, [people, query]);

  const pick = (person) => {
    setQuery("");
    setOpen(false);
    onPick(person.UserID);
  };

  return (
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
          // Delay so a click on a result lands before the list closes
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Enter" && matches[0]) pick(matches[0]);
          }}
          disabled={disabled}
          placeholder="Start a chat — search people"
          className="flex-1 min-w-0 text-sm outline-none bg-transparent"
        />
      </div>

      {open && !disabled && (
        <ul className="absolute z-20 left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg">
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-400">No one found.</li>
          ) : (
            matches.map((person) => (
              <li key={person.UserID}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(person)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  <ChatAvatar name={person.UserName} seed={person.UserID} size="sm" />
                  <span className="truncate text-gray-800">{person.UserName}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
