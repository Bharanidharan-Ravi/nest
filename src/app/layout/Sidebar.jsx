import { Link } from "react-router-dom";
import { useRepoMaster } from "../../features/repository/hooks/useRepoMaster";
import "../css/sideBar.css"; // Ensure you import the CSS file created above

export default function Sidebar({ isOpen, onClose }) {
  const { data, isLoading } = useRepoMaster();

  return (
    <>
      {/* 1. The Overlay (Clicking this closes the sidebar) */}
      <div 
        className={`sidebar-overlay ${isOpen ? "open" : ""}`} 
        onClick={onClose} 
      />

      {/* 2. The Sidebar Drawer */}
      <div className={`sidebar-container ${isOpen ? "open" : ""}`}>
        
        {/* Header with Close Button */}
        <div className="sidebar-header">
          <h5 style={{ margin: 0 }}>Menu</h5>
          <button className="close-btn" onClick={onClose}>
            &times; {/* This is an 'X' symbol */}
          </button>
        </div>

        {/* Content */}
        <div className="sidebar-content">
          <div>
            <Link to="/dashboard" onClick={onClose}>Dashboard</Link>
          </div>

          <hr />
          <div className="d-flex flex-column gap-2">
            <div>
              <Link to="/tickets" onClick={onClose}>Tickets</Link>
            </div>
            <div>
              <Link to="/projects" onClick={onClose}>Projects</Link>
            </div>
          </div>
          <hr />
          
          <div>
            <Link to="/repository" onClick={onClose}>Repositories</Link>
          </div>

          {isLoading && <p>Loading...</p>}

          <div className="d-flex flex-column gap-2 mt-2">
            {data?.Data?.map((repo) => (
              <div key={repo.Repo_Id}>
                <Link to={`/repository/${repo.Repo_Id}`} onClick={onClose}>
                  {repo.Title}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}


// export default function Sidebar() {
//   const { data, isLoading } = useRepoMaster();
// console.log("data :", data);

//   return (
//     <div style={{ width: 250, background: "#f4f4f4", padding: 20 }}>
//       <Link to="/dashboard">Dashboard</Link>

//       <hr />
//       <div className="d-flex flex-column gap-2">
//         <div>
//           <Link to="/tickets">Tickets</Link>
//         </div>
//         <div>
//           <Link to="/projects">Projects</Link>
//         </div>
//       </div>
//       <hr />
//       {/* <h4>Repositories</h4> */}
//       <div>
//         <Link to="/repository">Repositories</Link>
//       </div>

//       {isLoading && <p>Loading...</p>}

//       {data?.Data.map((repo) => (
//         <div key={repo.Repo_Id}>
//           <Link to={`/repository/${repo.Repo_Id}`}>{repo.Title}</Link>
//         </div>
//       ))}
//     </div>
//   );
// }
