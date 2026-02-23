import { useNavigate } from "react-router-dom";

const ProjectPage = () => {
  const navigate = useNavigate();
  return (
    <div>
      <div className="flex justify-between items-center mb-3 flex-none">
        <h2>Projects</h2>
        <button
          onClick={() => navigate("create")}
          className="bg-brand-yellow text-white px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors"
        >
          Create New Repository
        </button>
      </div>
      <p>This is the Projects page.</p>
      <button onClick={() => navigate("create")}>Create New Project</button>
    </div>
  )
}
export default ProjectPage;