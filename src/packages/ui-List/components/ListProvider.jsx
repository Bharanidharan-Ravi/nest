import { ListContext } from "../context/ListContext"
import { useListState } from "../hooks/useListState"
import { useInfiniteScroll } from "../hooks/useInfiniteScroll"
import { useUrlSync } from "../hooks/useUrlSync"

export function ListProvider({ config, data, children }) {
  const state = useListState(config, data)
  console.log("config, data :", config, data);
  
  useUrlSync(state)

  useInfiniteScroll(state.loadMore, state.hasMore, Boolean(config?.infinite))

  return (
    <ListContext.Provider value={state}>
      {children}
    </ListContext.Provider>
  )
}
