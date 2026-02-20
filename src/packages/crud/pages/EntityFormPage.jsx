import { useEntityForm } from "../formFramework/useEntityForm";
import { useApiMutation } from "../../../core/query/useApiMutation";
import FormEngine from "../../react-input-engine/core/FormEngine";
import { useNavigate } from "react-router-dom";
import { useMasterData } from "../../../core/master/useMasterData";
import { executeApi } from "../../../core/api/executor";

export default function EntityFormPage({ config, mode, context = {} }) {
  const navigate = useNavigate();
  const { data: masterData } = useMasterData();
  const { formData, fields, handleChange, validate, buildDto } = useEntityForm(
    config,
    context,
  );

  const mutation = useApiMutation({
    url: config.api,
    method: mode === "edit" ? "PUT" : "POST",
  });
  const { mutate, isPending } = useApiMutation({
    url: config.api,
    method: mode === "edit" ? "PUT" : "POST",
    // invalidateKeys: config.invalidateKeys || [],
    onSuccess: () => {

      // if (config.redirectTo) {
      //   navigate(config.redirectTo);
      // }
    },
  });
  const handleSubmit = () => {
    if (!validate()) return;

    const dto = buildDto();
    mutate(dto);
  };
  console.log("fields :", fields, formData);

  const uploadFile = async (file) => {
    console.log("Uploading file:", file);
    const formData = new FormData();
    formData.append("files", file);

    const response = await executeApi({
      url: "Attachment/tempUpload",
      method: "POST",
      payload: formData,
      // 2. Wrap headers inside 'config' so your executor picks them up
      config: {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    });
    console.log("Upload response:", response);
    const data = response.Data;
    return data.PublicUrl; // backend returns public URL
  };

  return (
    <>
      {fields?.length > 0 && (
        <FormEngine
          fields={fields}
          values={formData}
          onChange={handleChange}
          master={masterData}
          uploadFile={uploadFile}
        />
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
