import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
import FormEngine from "../../../packages/react-input-engine/core/FormEngine";
import { RepoFieldConfig } from "../config/CreateRepo.Config";
import { repositoryFormConfig } from "../config/repositoryForm.Config";

const RepoCreate = () => {
  const { RepoFields } = RepoFieldConfig();
  const values = {};

  return (
    <div>
      <h2>Create Repository</h2>
      <FormEngine fields={RepoFields} values={values} />
      <EntityFormPage mode="create" config={repositoryFormConfig} />
    </div>
  );
};

export default RepoCreate;
