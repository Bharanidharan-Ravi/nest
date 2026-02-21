import { useList } from "../context/ListContext";

export function ListSearchBar() {
  const { query, setQuery, config } = useList();

  const handleFocus = () => {
    if (query && !query.endsWith(" ")) {
      setQuery(query + " ");
    }
  };

  return (
    <div className="p-3 border-b border-gray-200 relative bg-white rounded-t-lg">
      <input
        value={query}
        onFocus={handleFocus}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Find a repository..."
        // Replaced the yellow rings with simple outline-none and a darker gray border on focus
        className="w-full border border-gray-300 bg-gray-50 focus:bg-white rounded-md px-4 py-2 text-sm text-brand-black focus:outline-none focus:ring-0 focus:border-gray-400 transition-all"
      />
      {query && (
        <button
          onClick={() => setQuery("")}
          className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-black transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  );
}
