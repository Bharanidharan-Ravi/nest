import { ListContext } from "../context/ListContext";
import { useListState } from "../hooks/useListState";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { useUrlSync } from "../hooks/useUrlSync";

export function ListProvider({ config, data, children, userRole }) {
  const state = useListState(config, data, userRole);
  console.log("12345", data, state);

  useUrlSync(state);

  useInfiniteScroll(state.loadMore, state.hasMore, Boolean(config?.infinite));

  return (
    <ListContext.Provider value={{ ...state, userRole }}>
      {children}
    </ListContext.Provider>
  );
}
