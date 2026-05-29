// ConfirmDialog.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Colors matched to WorkGlow (nest.workglow.in):
//   • White card, gray-100 border, gray-800 text  — matches the ticket UI
//   • info    → brand amber/yellow  (owl logo accent)
//   • warning → soft orange
//   • danger  → muted red
//   • Cancel button → plain gray outline (same as the app's secondary actions)
//   • Confirm button → filled, per variant
//   • Backdrop → very light black/10 blur — keeps the ticket UI visible
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useCallback, useState } from "react";

// ── Variant tokens — tuned to WorkGlow's neutral + amber brand palette ────────
const VARIANT_STYLES = {
  // Primary action (e.g. "Commit to Client") — uses the brand amber/yellow
  info: {
    backdrop:   "bg-black/10",
    iconWrap:   "bg-amber-50 border-amber-200",
    iconColor:  "text-amber-500",
    titleColor: "text-gray-800",
    confirmBtn:
      "bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold shadow-sm",
    svg: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
  // Reversible action (e.g. "Remove commitment") — neutral amber-orange
  warning: {
    backdrop:   "bg-black/10",
    iconWrap:   "bg-orange-50 border-orange-200",
    iconColor:  "text-orange-400",
    titleColor: "text-gray-800",
    confirmBtn:
      "bg-orange-400 hover:bg-orange-500 text-white font-semibold shadow-sm",
    svg: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
      />
    ),
  },
  // Destructive action — muted red, still feels within the app's calm tone
  danger: {
    backdrop:   "bg-black/15",
    iconWrap:   "bg-red-50 border-red-200",
    iconColor:  "text-red-400",
    titleColor: "text-gray-800",
    confirmBtn:
      "bg-red-500 hover:bg-red-600 text-white font-semibold shadow-sm",
    svg: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h8a1 1 0 011 1v1a1 1 0 01-1 1H5z"
      />
    ),
  },
};

// ── Component ─────────────────────────────────────────────────────────────────
/**
 * config shape:
 *   variant?     – "info" | "warning" | "danger"   default "info"
 *   title        – string  (required)
 *   description? – string
 *   confirmText? – string  default "Confirm"
 *   cancelText?  – string  default "Cancel"
 *   onConfirm    – () => void
 *   onCancel?    – () => void
 */
const ConfirmDialog = ({ config, onClose }) => {
  const handleKeyDown = useCallback(
    (e) => {
      if (!config) return;
      if (e.key === "Escape") { config.onCancel?.(); onClose(); }
    },
    [config, onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!config) return null;

  const {
    variant     = "info",
    title,
    description,
    confirmText = "Confirm",
    cancelText  = "Cancel",
    onConfirm,
    onCancel,
  } = config;
  const s = VARIANT_STYLES[variant] ?? VARIANT_STYLES.info;

  const handleConfirm = () => { onConfirm?.(); onClose(); };
  const handleCancel  = () => { onCancel?.();  onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">

      {/* Backdrop — very light so the ticket page stays readable behind it */}
      <div
        className={`absolute inset-0 ${s.backdrop} backdrop-blur-[2px]`}
        onClick={handleCancel}
      />

      {/* Card — same white / gray-100 border language as the ticket cards */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative z-10 bg-white rounded-2xl border border-gray-200
                   shadow-lg w-full max-w-[360px] mx-4 overflow-hidden"
      >
        {/* Top accent bar — thin brand stripe */}
        <div className={`h-1 w-full ${
          variant === "info"    ? "bg-amber-400"  :
          variant === "warning" ? "bg-orange-400" :
                                  "bg-red-400"
        }`} />

        <div className="px-6 pt-6 pb-5">
          {/* Icon */}
          <div className={`flex items-center justify-center w-11 h-11 rounded-full
                           border ${s.iconWrap} mx-auto mb-4`}>
            <svg
              className={`w-5 h-5 ${s.iconColor}`}
              fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={2}
            >
              {s.svg}
            </svg>
          </div>

          {/* Title */}
          <p
            id="confirm-dialog-title"
            className={`text-center font-semibold text-[14.5px] leading-snug mb-1 ${s.titleColor}`}
          >
            {title}
          </p>

          {/* Description */}
          {description && (
            <p className="text-center text-gray-400 text-[12px] leading-relaxed mb-5">
              {description}
            </p>
          )}

          {/* Buttons */}
          <div className={`flex gap-2.5 ${description ? "" : "mt-5"}`}>
            {/* Cancel — matches the app's plain outline secondary style */}
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200
                         text-gray-500 text-[13px] font-medium
                         hover:bg-gray-50 hover:border-gray-300
                         transition-colors duration-150"
            >
              {cancelText}
            </button>

            {/* Confirm — variant-coloured */}
            <button
              onClick={handleConfirm}
              className={`flex-1 px-4 py-2 rounded-xl text-[13px]
                          transition-colors duration-150 ${s.confirmBtn}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

// ── useConfirmDialog hook ─────────────────────────────────────────────────────
export function useConfirmDialog() {
  const [config, setConfig] = useState(null);
  const openDialog  = useCallback((cfg) => setConfig(cfg), []);
  const closeDialog = useCallback(() => setConfig(null), []);
  return {
    dialogProps: { config, onClose: closeDialog },
    openDialog,
  };
}
