import { useNavigate } from "react-router-dom";

const ProjectPage = () => {
  const navigate = useNavigate();
  return (
    <div>       
        <h2>Projects</h2>
        <p>This is the Projects page.</p>
         <button onClick={() => navigate("/projects/create")}>Create New Repository</button>
    </div>
  )
}   
export default ProjectPage;