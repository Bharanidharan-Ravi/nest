import { ListContext } from "../context/ListContext"
import { useListState } from "../hooks/useListState"
import { useInfiniteScroll } from "../hooks/useInfiniteScroll"
import { useUrlSync } from "../hooks/useUrlSync"

export function ListProvider({ config, data, children }) {
  const state = useListState(config, data)
  useUrlSync(state)

  if (config.infinite)
    useInfiniteScroll(state.loadMore, state.hasMore)

  return (
    <ListContext.Provider value={state}>
      {children}
    </ListContext.Provider>
  )
}