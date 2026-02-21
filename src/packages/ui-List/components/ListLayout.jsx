import { useList } from "../context/ListContext"
import { ListCardView } from "./ListCardView"
import { ListFilters } from "./ListFilters"
import { ListPagination } from "./ListPagination"
import { ListTableView } from "./ListTableView"
import { ListToolbar } from "./ListToolbar"


export function ListLayout() {
  const { view } = useList()

  return (
    <>
      <ListToolbar />
      <ListFilters />
      {view === "table" ? <ListTableView /> : <ListCardView />}
      <ListPagination />
    </>
  )
}