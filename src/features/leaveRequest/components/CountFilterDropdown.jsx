// ─────────────────────────────────────────────────────────────────────────────
// CountFilterDropdown.jsx
// Standalone single-select dropdown styled like ui-List's ListFilters
// (search box, ✓ on selected, count pill per option). Used outside ListProvider.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useRef, useState } from "react"

const CountFilterDropdown = ({ allLabel, allCount, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const wrapperRef = useRef(null)
  const searchInputRef = useRef(null)
  const optionsRefs = useRef([])

  // "All" pinned first, then selected, then by count desc, then name.
  const visibleOptions = useMemo(() => {
    const term = search.toLowerCase()
    const matches = options
      .filter((opt) => opt.label.toLowerCase().includes(term))
      .sort((a, b) => {
        if (a.value === value) return -1
        if (b.value === value) return 1
        if (a.count !== b.count) return b.count - a.count
        return a.label.localeCompare(b.label)
      })
    const all = { value: "", label: allLabel, count: allCount }
    return all.label.toLowerCase().includes(term) ? [all, ...matches] : matches
  }, [options, search, value, allLabel, allCount])

  const selectedLabel = options.find((opt) => opt.value === value)?.label || allLabel

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    setSearch("")
    setHighlightedIndex(0)
    searchInputRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    optionsRefs.current[highlightedIndex]?.scrollIntoView({ block: "nearest" })
  }, [highlightedIndex])

  const select = (next) => {
    onChange(next)
    setIsOpen(false)
  }

  const handleKeyDown = (event) => {
    if (!visibleOptions.length) return
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault()
        setHighlightedIndex((prev) => (prev < visibleOptions.length - 1 ? prev + 1 : 0))
        break
      case "ArrowUp":
        event.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : visibleOptions.length - 1))
        break
      case "Enter":
        event.preventDefault()
        select(visibleOptions[highlightedIndex]?.value ?? "")
        break
      case "Escape":
      case "Tab":
        setIsOpen(false)
        break
      default:
        break
    }
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="px-2 py-1.5 text-xs font-medium border border-gray-200 rounded-md bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-1"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="max-w-[140px] truncate">{selectedLabel}</span>
        <span className="text-xs ml-1">▾</span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          onKeyDown={handleKeyDown}
          className="absolute left-0 top-full mt-1 w-56 max-h-[350px] bg-white border border-gray-200 rounded-lg shadow-2xl flex flex-col overflow-hidden z-50"
        >
          <div className="p-2 bg-gray-50 border-b border-gray-100 shrink-0">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={search}
              className="w-full p-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              onChange={(e) => {
                setSearch(e.target.value)
                setHighlightedIndex(0)
              }}
            />
          </div>

          <div className="overflow-y-auto flex-1 py-1 custom-scrollbar">
            {visibleOptions.length === 0 && (
              <div className="px-3 py-2 text-xs text-gray-400">No matches</div>
            )}
            {visibleOptions.map((opt, index) => {
              const isSelected = opt.value === value
              const isHighlighted = index === highlightedIndex
              return (
                <div
                  key={opt.value || "__all"}
                  role="option"
                  aria-selected={isSelected}
                  ref={(el) => (optionsRefs.current[index] = el)}
                  onClick={() => select(opt.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-2 py-2 mx-1 rounded-md text-xs cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                    isSelected
                      ? "font-semibold text-brand-yellow bg-brand-yhover"
                      : isHighlighted
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="w-3 text-brand-yellow flex-shrink-0">{isSelected ? "✓" : ""}</span>
                    <span className="truncate">{opt.label}</span>
                  </div>
                  <span className="text-[10px] bg-white border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full font-medium shadow-sm">
                    {opt.count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default CountFilterDropdown
