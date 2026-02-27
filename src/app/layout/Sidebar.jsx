import { Link } from "react-router-dom";
import "../css/sideBar.css"; // Ensure you import the CSS file created above
import { useMasterData } from "../../core/master/useMasterData";

export default function Sidebar({ isOpen, onClose }) {
  // const { data, isLoading } = useRepoMaster();
   const { data } = useMasterData();

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
            <div>
              <Link to="/projects" onClick={onClose}>Labels</Link>
            </div><div>
              <Link to="/projects" onClick={onClose}>Employee master</Link>
            </div>
          </div>
          <hr />
          
          <div>
            <Link to="/repository" onClick={onClose}>Repositories</Link>
          </div>

          {/* {isLoading && <p>Loading...</p>} */}

          <div className="d-flex flex-column gap-2 mt-2">
            {data?.RepoList?.map((repo) => (
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


