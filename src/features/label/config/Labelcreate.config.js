// ─────────────────────────────────────────────────────────────────────────────
// LabelCreate.config.js
// Field definitions for Label create + edit form.
// Follows exact same shape as ProjFieldConfig.
//
// Fields: Title, Description, Color
// Status added dynamically in CreateLabel.jsx for edit mode (same as Project)
// ─────────────────────────────────────────────────────────────────────────────

export const LabelFieldConfig = () => [
  {
    label: "Label Title",
    name: "title",
    type: "text",
    ui: "mui",

    required: true,
    dataType: "string",
    apiKey: "Title",

    pattern: "^[A-Za-z0-9 ]+$",
    errorMessage: "Only alphanumeric characters allowed",

    initValueResolver: ({context}) =>
      context.isEdit ? context.entityData?.Title : "",
  },

  {
    label: "Description",
    name: "description",
    type: "text",
    ui: "mui",

    required: false,
    dataType: "string",
    apiKey: "Description",

    initValueResolver: ({context}) =>
      context.isEdit ? context.entityData?.Description ?? "" : "",
  },

  {
    label:    "Color",
    name:     "color",
    type:     "color",
    ui:       "mui",
    required: false,
    dataType: "string",
    apiKey:   "Color",
    initValueResolver: ({context}) =>
      context.isEdit ? context.entityData?.Color ?? "" : "",
  },
]