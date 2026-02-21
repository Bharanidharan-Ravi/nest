import { useListState } from "../hooks/useListState"
import { ListContext } from "../context/ListContext"

export function ListProvider({ config, data, children }) {
  const state = useListState(config, data)

  return (
    <ListContext.Provider value={state}>
      {children}
    </ListContext.Provider>
  )
}