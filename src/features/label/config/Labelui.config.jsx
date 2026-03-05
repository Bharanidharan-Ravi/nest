// ─────────────────────────────────────────────────────────────────────────────
// LabelUI.config.jsx
// Matches ProjUIConfig shape exactly.
// ─────────────────────────────────────────────────────────────────────────────
import LabelCard from "../pages/Labelcard";

export const LabelUIConfig = {
  defaultView:     "card",
  pageSize:        10,
  infinite:        true,
  enableSearch:    true,
  enableTabs:      true,
  enableSort:      true,
  enableSelection: true,
  enableEdit:      true,

  // Status tabs — matches DB varchar values "Active" / "Inactive"
  tabConfig: [
    {
      key:         "active",
      label:       "Active",
      field:       "status",
      filterValue: "Active",
    },
    {
      key:         "inactive",
      label:       "Inactive",
      field:       "status",
      filterValue: "Inactive",
    },
  ],

  defaultSort: {
    field: "title",
    order: "asc",
  },

  sortFields: [
    { key: "title",     label: "Title"      },
    { key: "createdAt", label: "Created on" },
    { key: "updatedAt", label: "Updated on" },
  ],

  sortOrders: [
    { key: "asc",  label: "A → Z"   },
    { key: "desc", label: "Z → A"   },
  ],

  filters: [],  // Labels have no extra filters — global master, no repo scope

  cardRenderer: (item) => <LabelCard item={item} />,
}