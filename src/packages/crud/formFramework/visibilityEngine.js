// visibilityEngine.js
// -------------------------------------------------------
// RECURSIVE VISIBILITY ENGINE
// Handles:
// - top level fields
// - group children
// - hidden fields
// - visibleWhen
// -------------------------------------------------------

export const applyVisibilityRules = (formData, fields = []) => {
  return fields
    .map(field => {
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
        const isVisible = field.visibleWhen(formData);
        if (!isVisible) return null;
      }

      // -----------------------------------------
      // 3️⃣ Group Field → Process children
      // -----------------------------------------
      if (field.type === "group" && Array.isArray(field.fields)) {
        const processedChildren = applyVisibilityRules(
          formData,
          field.fields
        );

        return {
          ...field,
          fields: processedChildren
        };
      }

      return field;
    })
    .filter(Boolean); // remove nulls
};
