import { createContext, useContext } from "react"

export const ListContext = createContext(null)

// Just the query string, for list rows: a row reading it re-renders only when
// the query changes, not on every list state change (data, counts, …)
export const ListQueryContext = createContext("")

export const useList = () => {
  const ctx = useContext(ListContext)
  if (!ctx) throw new Error("useList must be used inside ListProvider")
  return ctx
}

export const useListQuery = () => useContext(ListQueryContext)
