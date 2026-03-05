import { queryKeys } from "../../../core/query/queryKeys"
import { LabelFieldConfig } from "./Labelcreate.config"

export const labelFormConfig = {
  key: "label",
  title: "Label",
  api: "/label",                          // POST /api/label

  // Invalidate full label list after create or update
  invalidateKeys: [queryKeys.label.list()],

  redirectTo: ({ goBack }) => goBack(),

  fields: LabelFieldConfig(),
}