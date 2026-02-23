import { useEntityForm } from "../formFramework/useEntityForm";
import { useApiMutation } from "../../../core/query/useApiMutation";
import FormEngine from "../../react-input-engine/core/FormEngine";
import { useNavigate } from "react-router-dom";
import { useMasterData } from "../../../core/master/useMasterData";
import { executeApi } from "../../../core/api/executor";
import { useState } from "react";

export default function EntityFormPage({ config, mode, context = {} }) {
  const navigate = useNavigate();
  const { data: masterData } = useMasterData();
  const { formData, fields, handleChange, validate, buildDto } = useEntityForm(
    config,
    context,
  );
  const [tempFiles, setTempFiles] = useState([]);
  const mutation = useApiMutation({
    url: config.api,
    method: mode === "edit" ? "PUT" : "POST",
  });
  const { mutate, isPending } = useApiMutation({
    url: config.api,
    method: mode === "edit" ? "PUT" : "POST",
    // invalidateKeys: config.invalidateKeys || [],
    onSuccess: () => {

      if (config.redirectTo) {
        navigate(config.redirectTo);
      }
    },
  });

  const handleEditorFileDelete = async (deletedUrl) => {
    // 1. Only process deletions for files in the temporary folder
    if (deletedUrl.includes("/UploadsTemp/")) {

      // 2. Find the complete Tempdata object (which contains the LocalPath) from state
      const fileToDelete = tempFiles.find((f) => f.PublicUrl === deletedUrl);

      if (fileToDelete) {
        try {
          // 3. Construct the payload matching your C# TempReturn class
          const payload = {
            Delete: "single",        // Maps to: CASE 1 — Delete Single File
            temps: [fileToDelete],   // Maps to: List<Tempdata>
          };

          // 4. Trigger the backend API
          await executeApi({
            url: "Attachment/DeleteTemp", // Ensure this matches your Controller Route
            method: "POST", // Use POST since you are sending a body
            payload: payload,
          });

          // 5. Remove it from the local React state so it isn't included in the final Save
          setTempFiles((prev) => prev.filter((f) => f.PublicUrl !== deletedUrl));

          console.log("Successfully deleted from temporary storage:", deletedUrl);
        } catch (error) {
          console.error("Failed to call delete API:", error);
        }
      } else {
        // This happens if the user deletes a file but the state was lost (e.g., page refresh)
        console.warn("File object not found in local state for URL:", deletedUrl);
      }
    }
  };
  const handleSubmit = () => {
    console.log("itest trigger");

    if (!validate()) return;

    const dto = buildDto();
    if (tempFiles.length > 0) {
      dto.temp = {
        Delete: "all", // Optional: Send "all" if your backend expects it for cleanup logic
        temps: tempFiles,
      };
    } else {
      dto.temp = null;
    }
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
    // The backend returns the Tempdata object: { FileName, PublicUrl, LocalPath }
    const data = response.Data;

    // 🔥 2. Save the full temp data object into our React state
    setTempFiles((prev) => [...prev, data]);

    // 🔥 3. Return ONLY the public URL for the Tiptap editor to display
    return data.PublicUrl;
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
          onFileDelete={handleEditorFileDelete}
        />
      )}
      <button onClick={handleSubmit}>Save</button>
    </>
  );
}

