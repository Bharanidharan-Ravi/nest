import { useParams } from "react-router-dom";
import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
import { projectFormConfig } from "../config/ProjectForm.config";
import { useProjectData } from "../hooks/useProjectData";

const ProjectCreate = () => {
  const params = useParams();

  // 1. Determine if we are creating or updating based on the URL params
  const isEdit = !!params.projId;
  // 1. Fetch existing data ONLY if we are in Edit mode
  const { data: projectListWrapper } = useProjectData(params.repoId, params.projId);

  // 2. Extract the single entity object from the array returned by sync/v2
  const entityData = isEdit && Array.isArray(projectListWrapper) && projectListWrapper.length > 0
    ? projectListWrapper[0]
    : null;

  const statusOptions = [
    { label: "Active", value: { id: 1, name: "Active" } },
    { label: "InActive", value: { id: 2, name: "InActive" } },
    // { label: "Hold", value: { id: 3, name: "Hold" } }
  ];
  // 2. Define the Status field that only appears during editing
  const statusField = {
    name: "Status",
    label: "Project Status",
    type: "select", // Assuming your form engine uses 'select'
    ui: "mui",
    apiKey:  "Status",
    options: statusOptions,
    required: true,
    initValueResolver: (context) => {
      // 1. If creating, default to Active
      if (!context.isEdit || !context.entityData) {
        return statusOptions[0]; // Returns the whole { label, value: { id, name } } object
      }

      const apiStatus = context.entityData.Status; 

      // 2. Find the matching option based on either the ID or the Label
      const matchedOption = statusOptions.find(
        (opt) => opt.value.id === apiStatus || opt.label === apiStatus
      );
      // 3. Return the full object so MUI recognizes it
      return matchedOption || statusOptions[0];
    },
  };

  // 3. Dynamically adjust the form config
  const dynamicConfig = {
    ...projectFormConfig,
    api: isEdit ? `Project/${params.projId}` : projectFormConfig.api,
    fields: isEdit
      ? [...projectFormConfig.fields, statusField] // Add status field on edit
      : projectFormConfig.fields
  };
  return (
    <div>
      <h2>{isEdit ? "Edit Project" : "Create Project"}</h2>
      <EntityFormPage mode={isEdit ? "Update" : "create"} config={dynamicConfig}
        context={{ params, isEdit, entityData }}
        module="Project"
      />
    </div>
  );
};

export default ProjectCreate;
