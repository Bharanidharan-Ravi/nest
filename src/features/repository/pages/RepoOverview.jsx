import { ListCardView } from "../../../packages/ui-List/components/ListCardView";
import { ListFilters } from "../../../packages/ui-List/components/ListFilters";
import { ListPagination } from "../../../packages/ui-List/components/ListPagination";
import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
import { ListTableView } from "../../../packages/ui-List/components/ListTableView";
import { ListToolbar } from "../../../packages/ui-List/components/ListToolbar";
import { useList } from "../../../packages/ui-List/context/ListContext";
import { RepoUIConfig } from "../config/RepoUI.config";

const RepoOverview = () => {

//   function TicketContent() {
//     const { view } = useList()
// console.log(" view: ", view);

//     return (
//       <>
//         <ListToolbar />
//         <ListFilters />
//         {view === "table" ? <ListTableView /> : <ListCardView />}
//         <ListPagination />
//       </>
//     )
//   }
  return (
    <div>
      <h3>Repository Overview</h3>
      {/* <ListProvider config={RepoUIConfig}>
        <TicketContent />
      </ListProvider> */}
    </div>
  )
}
export default RepoOverview;