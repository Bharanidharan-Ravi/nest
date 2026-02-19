import { useEntityForm } from "../formFramework/useEntityForm";
import { useApiMutation } from "../../../core/query/useApiMutation";
import FormEngine from "../../react-input-engine/core/FormEngine";
import { useNavigate } from "react-router-dom";

export default function EntityFormPage({ config, mode }) {
  const navigate = useNavigate();
  const { formData, fields, handleChange, validate, buildDto } =
    useEntityForm(config);

  const mutation = useApiMutation({
    url: config.api,
    method: mode === "edit" ? "PUT" : "POST",
  });
  const { mutate, isPending } = useApiMutation({
    url: config.api,
    method: mode === "edit" ? "PUT" : "POST",
    invalidateKeys: config.invalidateKeys || [],
    onSuccess: () => {
      console.log("success trigger");
      
      if (config.redirectTo) {
        navigate(config.redirectTo);
      }
    }
  });
  const handleSubmit = () => {
    if (!validate()) return;

    const dto = buildDto();
    mutate(dto);
  };
  console.log("fields :", fields, formData);

  return (
    <>
      {fields?.length > 0 && (
        <FormEngine fields={fields} values={formData} onChange={handleChange} />
      )}
      <button onClick={handleSubmit}>Save</button>
    </>
  );
}

// // core/crud/EntityFormPage.jsx

// import React, { useEffect, useState } from "react";
// import { useApiMutation } from "../../../core/query/useApiMutation";
// import { useNavigate } from "react-router-dom";
// import FormEngine from "../../react-input-engine/core/FormEngine";
// import { useApiQuery } from "../../../core/query/useApiQuery";

// export default function EntityFormPage({
//   mode = "create",        // create | edit | view
//   id,
//   config,
// }) {
//   const navigate = useNavigate();
//   const isEdit = mode === "edit";
//   const isView = mode === "view";
//   const isCreate = mode === "create";

//   const [formData, setFormData] = useState({});

//   // 🔥 Fetch detail if edit/view
//   const { data: detailData, isLoading } = useApiQuery({
//     queryKey: [config.key, id],
//     url: `${config.api}/${id}`,
//     method: "GET",
//     options: {
//       enabled: isEdit || isView,
//     },
//   });

//   // Populate formData when editing
//   useEffect(() => {
//     if (detailData) {
//       setFormData(detailData);
//     }
//   }, [detailData]);

//   // 🔥 Mutation
//   const mutation = useApiMutation({
//     url: config.api,
//     method: isEdit ? "PUT" : "POST",
//     invalidateKeys: config.invalidateKeys || [],
//   });

//   // 🔥 Handle change from FormEngine
//   const handleChange = (fieldName, value) => {
//     setFormData((prev) => ({
//       ...prev,
//       [fieldName]: value,
//     }));
//   };

//   const handleSubmit = () => {
//     mutation.mutate(formData, {
//       onSuccess: () => {
//         if (config.redirectTo) {
//           navigate(config.redirectTo);
//         }
//       },
//     });
//   };

//   if (isLoading) return <div>Loading...</div>;

//   return (
//     <div>
//       <h2>{config.title}</h2>

//       <FormEngine
//         fields={config.fields}
//         values={formData}
//         onChange={handleChange}
//         readOnly={isView}
//       />

//       {!isView && (
//         <button onClick={handleSubmit} disabled={mutation.isPending}>
//           {isEdit ? "Update" : "Create"}
//         </button>
//       )}
//     </div>
//   );
// }
