import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
import FormEngine from "../../../packages/react-input-engine/core/FormEngine";
import { RepoFieldConfig } from "../config/CreateRepo.Config";
import { repositoryFormConfig } from "../config/repositoryForm.Config";

const RepoCreate = () => {
  const { RepoFields } = RepoFieldConfig();
  const values = {};

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-6 pb-2 border-b border-ghBorder">
        <h2 className="text-2xl font-semibold text-ghText">
          Create Repository
        </h2>
      </div>

      <EntityFormPage mode="Create" config={repositoryFormConfig} module="Repository" />
    </div>
  );
};

export default RepoCreate;
