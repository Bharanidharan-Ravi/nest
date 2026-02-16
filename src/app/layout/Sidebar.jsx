import { Link } from "react-router-dom";
import { useRepoMaster } from "../../features/repository/hooks/useRepoMaster";

export default function Sidebar() {
  const { data, isLoading } = useRepoMaster();
  console.log("Sidebar data:", data, data?.Data);

  return (
    <div style={{ width: 250, background: "#f4f4f4", padding: 20 }}>
      <Link to="/dashboard">Dashboard</Link>

      <hr />
      <div className="d-flex flex-column gap-2">
        <div>
          <Link to="/tickets">Tickets</Link>
        </div>
        <div>
          <Link to="/projects">Projects</Link>
        </div>
      </div>
      <hr />
      {/* <h4>Repositories</h4> */}
      <div>
        <Link to="/repository">Repositories</Link>
      </div>

      {isLoading && <p>Loading...</p>}

      {data?.Data.map((repo) => (
        <div key={repo.Repo_Id}>
          <Link to={`/repository/${repo.Repo_Id}`}>{repo.Title}</Link>
        </div>
      ))}
    </div>
  );
}

// import { Link } from "react-router-dom"
// import { getAllFeatures } from "../../core/registry/featureRegistry"

// export default function Sidebar() {
//   const features = getAllFeatures()

//   const items = features.flatMap(f => f.sidebar || [])

//   return (
//     <div style={{ width: 200, background: "#f5f5f5", padding: 20 }}>
//       {items.map((item, index) => (
//         <div key={index}>
//           <Link to={item.path}>{item.label}</Link>
//         </div>
//       ))}
//     </div>
//   )
// }
