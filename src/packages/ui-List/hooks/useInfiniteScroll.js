import { useEffect } from "react"

export function useInfiniteScroll(callback, hasMore) {
  console.log("trigger:", callback, hasMore);
  
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 100 >=
        document.documentElement.offsetHeight &&
        hasMore
      ) {
        callback()
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [callback, hasMore])
}