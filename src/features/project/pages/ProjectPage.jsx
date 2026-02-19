import { useNavigate } from "react-router-dom";

const ProjectPage = () => {
  const navigate = useNavigate();
  return (
    <div>       
        <h2>Projects</h2>
        <p>This is the Projects page.</p>
         <button onClick={() => navigate("create")}>Create New Project</button>
    </div>
  )
}   
export default ProjectPage;