import { Link, useLocation, useParams } from "react-router-dom";
import { useTicketMaster } from "../../features/tickets/hooks/useTicketMaster";
import "./Breadcrumbs.css";
import { useMasterData } from "../master/useMasterData";

export default function Breadcrumbs() {
  const location = useLocation();
  const { repoId, ticketId, projId } = useParams();


  const pathnames = location.pathname.split("/").filter(Boolean);
  // const { data: repoList } = useRepoMaster();
  // const { data: ticketList } = useTicketMaster(repoId);
  const { data } = useMasterData();
  const { data: ticketList } = useTicketMaster(repoId, {
    enabled: !!ticketId,
  });

  const getLabel = (value) => {
    if (value === "repository") return "Repository";
    if (value === "t") return "Tickets";
    if (value === "p") return "Projects";
    if (value === "overview") return "Overview";
    if (value === "projects") return "Projects";  

    if (value === repoId) {
      if (!data?.RepoList) return "Loading...";
      const repo = data?.RepoList?.find((r) => r.Repo_Id === value);
      return repo?.Title || "Unknown Repo";
    }

    if (value === ticketId) {
      if (!ticketList) return "Loading...";
      const ticket = ticketList?.find((t) => t.Issue_Id === value);
      return ticket?.Issue_Title || "Unknown Ticket";
    }

    
    if (value === projId) {
      if (!data?.ProjectList) return "Loading...";
      const ticket = data?.ProjectList?.find((t) => t.Id === value);
      return ticket?.Project_Name || "Unknown Project";
    }
    return value;
  };
  const isHidden = (value) => {
    return value === "dashboard";
  };

  return (
    <nav aria-label="breadcrumb" className="breadcrumb-container">
      <Link to="/dashboard" className="breadcrumb-link">
        Home
      </Link>

      {pathnames.map((value, index) => {
        // 1. Hide unwanted segments
        if (isHidden(value)) return null;

        const isLast = index === pathnames.length - 1;

        // 2. FIX: Join the array to create a valid URL string
        let to = "/" + pathnames.slice(0, index + 1).join("/");

        // if (value === repoId) {
        //   to = `${to}/overview`;
        // }
        return (
          // 3. FIX: Renamed class to 'custom-breadcrumb-item' to stop Bootstrap double slashes
          <span key={to} className="custom-breadcrumb-item">
            <span className="breadcrumb-separator">/</span>

            {isLast ? (
              <span className="breadcrumb-active">{getLabel(value)}</span>
            ) : (
              <Link to={to} className="breadcrumb-link">
                {getLabel(value)}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
//   return (
//     <div className="textdesign">
//       <Link to="/dashboard">Home</Link>
//       {pathnames.map((value, index) => {
//         const to = "/" + pathnames.slice(0, index + 1).join("/");
//         if (isHidden(value)) return null;
//         return (
//           <span key={to}>
//             {" / "}
//             <Link to={to}>{getLabel(value, index)}</Link>
//           </span>
//         );
//       })}
//     </div>
//   );
// }
