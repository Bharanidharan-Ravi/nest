import { useEffect, useMemo, useRef } from "react";

const CHECKBOX_CLASS =
  "h-4 w-4 shrink-0 cursor-pointer accent-emerald-600 disabled:cursor-not-allowed";

/** "Jordan Reeves" -> "JR" */
const initialsOf = (name = "") =>
  String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

/**
 * Checklist of people (or any { label, value: { id } } options) with a
 * "Select all" toggle. Value is the array of selected option values.
 * An option may carry a `group` string (e.g. "Internal" / "Client"),
 * shown beside its name.
 */
const ListCheckBox = ({
  name,
  label,
  options = [],
  value = [],
  error,
  disabled,
  onChange,
}) => {
  const selected = useMemo(() => (Array.isArray(value) ? value : []), [value]);

  const selectedIds = useMemo(
    () => new Set(selected.map((v) => String(v.id))),
    [selected]
  );

  const selectedCount = options.filter((opt) =>
    selectedIds.has(String(opt.value.id))
  ).length;
  const allSelected = options.length > 0 && selectedCount === options.length;
  const someSelected = selectedCount > 0 && !allSelected;

  // "indeterminate" has no HTML attribute; it can only be set on the element.
  const selectAllRef = useRef(null);
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected;
  }, [someSelected]);

  const handleToggle = (item, checked) => {
    const rest = selected.filter((v) => String(v.id) !== String(item.id));
    onChange?.(name, checked ? [...rest, item] : rest);
  };

  const handleToggleAll = (checked) => {
    onChange?.(name, checked ? options.map((opt) => opt.value) : []);
  };

  if (options.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-center text-sm text-slate-500">
        No participants to show
      </div>
    );
  }

  return (
    <div role="group" aria-label={label} className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer select-none items-center gap-2 text-sm font-medium text-slate-700">
          <input
            ref={selectAllRef}
            type="checkbox"
            className={CHECKBOX_CLASS}
            checked={allSelected}
            disabled={disabled}
            onChange={(e) => handleToggleAll(e.target.checked)}
          />
          Select all
        </label>

        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-emerald-700 ring-1 ring-inset ring-emerald-100">
          {selectedCount} of {options.length} present
        </span>
      </div>

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((opt) => {
          const isChecked = selectedIds.has(String(opt.value.id));

          return (
            <li key={opt.value.id}>
              <label
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 transition ${
                  isChecked
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold transition ${
                    isChecked
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {initialsOf(opt.label)}
                </span>

                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span
                    className={`truncate text-sm font-medium ${
                      isChecked ? "text-slate-900" : "text-slate-500"
                    }`}
                    title={opt.label}
                  >
                    {opt.label}
                  </span>
                  {opt.group && (
                    <span className="shrink-0 rounded bg-slate-100 px-1.5 py-px text-[10px] font-medium text-slate-500">
                      {opt.group}
                    </span>
                  )}
                </span>

                <input
                  type="checkbox"
                  className={CHECKBOX_CLASS}
                  checked={isChecked}
                  disabled={disabled}
                  onChange={(e) => handleToggle(opt.value, e.target.checked)}
                />
              </label>
            </li>
          );
        })}
      </ul>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default ListCheckBox;
