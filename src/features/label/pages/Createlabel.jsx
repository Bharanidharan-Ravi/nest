// ─────────────────────────────────────────────────────────────────────────────
// CreateLabel.jsx
// Matches CreateProject.jsx pattern exactly.
//
// Handles both Create and Edit in one component.
// isEdit detected from :labelId URL param.
// Status field injected dynamically for edit mode only.
// ─────────────────────────────────────────────────────────────────────────────
import { useParams }      from "react-router-dom"
import EntityFormPage     from "../../../packages/crud/pages/EntityFormPage"
import { labelFormConfig } from "../config/LabelForm.config"
import { useLabelData }   from "../hooks/useLabelData"

const CreateLabel = () => {
  const params = useParams()

  // Detect mode — :labelId in URL = edit
  const isEdit = !!params.labelId

  // Fetch existing data ONLY in edit mode
  const { data: labelListWrapper } = useLabelData(
    isEdit ? params.labelId : null
  )

  // Extract single entity from sync/v2 array response
  const entityData =
    isEdit &&
    Array.isArray(labelListWrapper) &&
    labelListWrapper.length > 0
      ? labelListWrapper[0]
      : null

  // Status options — string values matching DB varchar(100)
  const statusOptions = [
    { label: "Active",   value: { id: "Active",   name: "Active"   } },
    { label: "Inactive", value: { id: "Inactive", name: "Inactive" } },
  ]

  // Status field — injected only on edit (same pattern as Project)
  const statusField = {
    name:    "status",
    label:   "Label Status",
    type:    "select",
    ui:      "mui",
    apiKey:  "Status",
    options: statusOptions,
    required: true,

    initValueResolver: (context) => {
      // On create — default Active
      if (!context.isEdit || !context.entityData) {
        return statusOptions[0]
      }

      const apiStatus = context.entityData?.Status

      const matched = statusOptions.find(
        (opt) => opt.value.id === apiStatus || opt.label === apiStatus
      )

      return matched ?? statusOptions[0]
    },
  }

  // Dynamic config — same as CreateProject.jsx
  const dynamicConfig = {
    ...labelFormConfig,
    // PUT /api/label/{id} on edit, POST /api/label on create
    api: isEdit ? `label/${params.labelId}` : labelFormConfig.api,
    fields: isEdit
      ? [...labelFormConfig.fields, statusField]  // status only on edit
      : labelFormConfig.fields,
  }

  return (
    <div>
      <h2>{isEdit ? "Edit Label" : "Create Label"}</h2>
      <EntityFormPage
        mode={isEdit ? "Update" : "Create"}
        config={dynamicConfig}
        context={{ params, isEdit, entityData }}
        module="Label"
      />
    </div>
  )
}

export default CreateLabel