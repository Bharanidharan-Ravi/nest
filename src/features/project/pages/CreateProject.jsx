import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
import { repositoryFormConfig } from "../../repository/config/repositoryForm.Config";

const ProjectCreate = () => {
  return (
    <div>
      <p> Create Project</p>
      <EntityFormPage mode="create" config={repositoryFormConfig} />
    </div>
  );
};

export default ProjectCreate;
