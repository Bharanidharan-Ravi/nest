import { useRef } from "react";

/** Toggles a class while the element is actively scrolling, so a hidden scrollbar can reveal itself. */
export function useScrollReveal(delay = 800) {
  const timeoutRef = useRef(null);

  return (e) => {
    const el = e.currentTarget;
    el.classList.add("wg-scrollbar--scrolling");
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => el.classList.remove("wg-scrollbar--scrolling"), delay);
  };
}
