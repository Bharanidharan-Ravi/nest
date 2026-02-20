import { useParams } from "react-router-dom";
import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
import { repositoryFormConfig } from "../../repository/config/repositoryForm.Config";
import { projectFormConfig } from "../config/ProjectForm.config";

const ProjectCreate = () => {
    const params = useParams();    
  return (
    <div>
      <p> Create Project</p>
      <EntityFormPage mode="create" config={projectFormConfig}  context={{ params }}/>
    </div>
  );
};

export default ProjectCreate;
