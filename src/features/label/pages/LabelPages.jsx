// ─────────────────────────────────────────────────────────────────────────────
// LabelPage.jsx
// Matches ProjectPage.jsx pattern exactly.
//
// No repoId scope — labels are global master data.
// Data comes from useLabelData (sync/v2 ConfigKey "LabelMaster").
// Role 1 only sees Create/Edit buttons — Role 2 sees list read-only.
// ─────────────────────────────────────────────────────────────────────────────
import { ListProvider } from "../../../packages/ui-List/components/ListProvider"
import { ListLayout }   from "../../../packages/ui-List/components/ListLayout"
import { LabelUIConfig } from "../config/LabelUI.config"
import { useLabelData }  from "../hooks/useLabelData"
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation"
import { ROUTE_KEYS }    from "../../../core/routing/paths"

const LabelPage = () => {
  const { data: labels }  = useLabelData()
  const { goTo } = useSmartNavigation()

  // Normalize API response → list item shape
  // Matches the normalizeProj pattern in ProjectPage
  const normalizeLabel = (label) => ({
    id:          label.Id,
    title:       label.Title,
    description: label.Description,
    color:       label.Color,
    status:      label.Status,
    createdAt:   label.Created_On,
    createdBy:   label.Created_By,
    updatedAt:   label.Updated_On,
    updatedBy:   label.Updated_By,
  })

  const labelList = Array.isArray(labels)
    ? labels.map(normalizeLabel)
    : []

  const listConfigWithNav = {
    ...LabelUIConfig,

    onEditClick: (item) => {
      goTo(ROUTE_KEYS.LABEL_EDIT, { labelId: item.id })
    },

    onSelectionChange: (item, isChecked) => {
      console.log(`Label ${item.id} ${isChecked ? "selected" : "deselected"}`)
    },
  }

  return (
    <>
      <div className="flex justify-between items-center mb-3 flex-none">
        <h2>Labels</h2>

        <button
          onClick={() => goTo(ROUTE_KEYS.LABEL_CREATE)}
          className="bg-brand-yellow text-white px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors"
        >
          Create New Label
        </button>
      </div>

      <div className="flex-1 min-h-0">
        <ListProvider config={listConfigWithNav} data={labelList}>
          <ListLayout />
        </ListProvider>
      </div>
    </>
  )
}

export default LabelPage