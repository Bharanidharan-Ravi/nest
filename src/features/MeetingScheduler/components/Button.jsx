// src/shared/ui/Button.jsx
import React from "react";

const VARIANTS = {
  primary:
    "bg-amber-400 hover:bg-amber-500 text-gray-900 focus-visible:ring-amber-300",
  secondary:
    "bg-gray-200 hover:bg-gray-300 text-gray-700 focus-visible:ring-gray-300",
  subtle:
    "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 focus-visible:ring-gray-200",
  ghost: "bg-transparent hover:bg-gray-100 text-gray-500 focus-visible:ring-gray-200",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

/**
 * Single button primitive for the whole scheduler feature (New Meeting,
 * Complete, Edit, Set Availability, calendar prev/next/today). Standardizes
 * focus rings, disabled state, and transition so every button behaves and
 * looks the same instead of each screen re-declaring its own className.
 */
export const Button = React.forwardRef(function Button(
  { icon: Icon, iconPosition = "left", variant = "primary", size = "md", className = "", children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-md font-semibold transition
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {Icon && iconPosition === "left" && <Icon size={13} aria-hidden="true" />}
      {children}
      {Icon && iconPosition === "right" && <Icon size={13} aria-hidden="true" />}
    </button>
  );
});
