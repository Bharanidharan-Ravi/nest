import { ListContext, ListQueryContext } from "../context/ListContext";
import { useListState } from "../hooks/useListState";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { useUrlSync } from "../hooks/useUrlSync";

export function ListProvider({ config, data, children, userRole }) {
  const state = useListState(config, data, userRole);

  useUrlSync(state);

  // Server-mode lists page from the card view (pages around the one on screen)
  useInfiniteScroll(
    state.loadMore,
    state.hasMore,
    Boolean(config?.infinite) && !config?.useServerData,
  );

  return (
    <ListContext.Provider value={{ ...state, userRole }}>
      <ListQueryContext.Provider value={state.query}>
        {children}
      </ListQueryContext.Provider>
    </ListContext.Provider>
  );
}
