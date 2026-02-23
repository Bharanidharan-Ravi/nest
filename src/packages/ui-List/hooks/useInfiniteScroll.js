import { useEffect } from "react";

export function useInfiniteScroll(callback, hasMore) {
  useEffect(() => {
    const handleScroll = (e) => {
      // e.target could be the document (if the whole page scrolls) 
      // or the specific layout div (if overflow-y: auto is used)
      const target = e.target === document ? document.documentElement : e.target;

      // Ensure the target actually has scroll properties
      if (!target || !target.scrollHeight) return;

      // Check if the scroll has reached the bottom (with a 100px buffer)
      if (
        target.clientHeight + target.scrollTop + 100 >=
        target.scrollHeight &&
        hasMore
      ) {
        callback();
      }
    };

    // Adding 'true' uses the capture phase, catching scroll events from ANY child container
    window.addEventListener("scroll", handleScroll, true);
    
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [callback, hasMore]);
}