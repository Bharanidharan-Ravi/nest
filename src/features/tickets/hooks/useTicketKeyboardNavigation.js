import { useEffect, useState } from "react";

export function useTicketKeyboardNavigation(items, onOpen, onEdit) {

  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {

    const handleKey = (e) => {

      if (!items?.length) return;

      if (e.key === "j") {
        setFocusedIndex((prev) => Math.min(prev + 1, items.length - 1));
      }

      if (e.key === "k") {
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
      }

      if (e.key === "Enter") {
        onOpen?.(items[focusedIndex]);
      }

      if (e.key === "e") {
        onEdit?.(items[focusedIndex]);
      }

    };

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);

  }, [items, focusedIndex]);

  return focusedIndex;
}