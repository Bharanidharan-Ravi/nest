// visibilityEngine.js
// -------------------------------------------------------
// RECURSIVE VISIBILITY ENGINE
// Handles:
// - top level fields
// - group children
// - hidden fields
// - visibleWhen
// -------------------------------------------------------

export const applyVisibilityRules = (formData, fields = [], context = {}) => {
  return fields
    .map((field) => {
      // -----------------------------------------
      // 1️⃣ Explicit hidden flag
      // -----------------------------------------
      if (field.hidden) {
        return null;
      }

      // -----------------------------------------
      // 2️⃣ visibleWhen rule
      // -----------------------------------------
      if (field.visibleWhen) {
        // 🔥 FIX: Pass both formData AND context here
        const isVisible = field.visibleWhen(formData, context);
        if (!isVisible) return null;
      }

      // 3️⃣ Group Field → Process children
      if (field.type === "group" && Array.isArray(field.fields)) {
        // 🔥 FIX: Pass context down recursively so nested fields can use it too
        const processedChildren = applyVisibilityRules(
          formData,
          field.fields,
          context,
        );

        return {
          ...field,
          fields: processedChildren,
        };
      }

      return field;
    })
    .filter(Boolean); // remove nulls
};
