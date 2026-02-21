import { createContext, useContext } from "react"

export const ListContext = createContext(null)

export const useList = () => {
  const ctx = useContext(ListContext)
  if (!ctx) throw new Error("useList must be used inside ListProvider")
  return ctx
}