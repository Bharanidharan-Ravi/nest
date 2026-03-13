import { useEntityForm } from "../formFramework/useEntityForm";
import { useApiMutation } from "../../../core/query/useApiMutation";
import FormEngine from "../../react-input-engine/core/FormEngine";
import { useNavigate } from "react-router-dom";
import { useMasterData } from "../../../core/master/useMasterData";
import { executeApi } from "../../../core/api/executor";
import { useState } from "react";
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";

export default function EntityFormPage({ config, mode, context = {}, module }) {
  const navigate = useNavigate();
  const smartNav = useSmartNavigation();
  const { data: masterData } = useMasterData();
  const { formData, fields, handleChange, errors, validate, buildDto, reset } =
    useEntityForm(config, context);
  const [tempFiles, setTempFiles] = useState([]);
  const handleFormReset = () => {
    reset();
    setTempFiles([]);
  };
  const { mutate, isPending } = useApiMutation({
    url: config.api,
    method: mode === "Update" ? "PUT" : "POST",
    invalidateKeys: config.invalidateKeys || [],
    onSuccess: (data) => {
      handleFormReset();
      if (!config.redirectTo) return;
      if (typeof config.redirectTo === "function") {
        config.redirectTo(smartNav); // 👈 pass navigation API
      } else {
        smartNav.goTo(config.redirectTo);
      }
      // if (config.redirectTo) {
      //   navigate(config.redirectTo);
      // }
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
            Delete: "single", // Maps to: CASE 1 — Delete Single File
            temps: [fileToDelete], // Maps to: List<Tempdata>
          };

          // 4. Trigger the backend API
          await executeApi({
            url: "Attachment/tempCleanUp", // Ensure this matches your Controller Route
            method: "POST", // Use POST since you are sending a body
            payload: payload,
          });

          // 5. Remove it from the local React state so it isn't included in the final Save
          setTempFiles((prev) =>
            prev.filter((f) => f.PublicUrl !== deletedUrl),
          );
        } catch (error) {
          console.error("Failed to call delete API:", error);
        }
      } else {
        // This happens if the user deletes a file but the state was lost (e.g., page refresh)
        console.warn(
          "File object not found in local state for URL:",
          deletedUrl,
        );
      }
    }
  };
  const handleSubmit = () => {
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

  const uploadFile = async (file) => {
    const formDataPayload = new FormData();
    formDataPayload.append("files", file);
    const response = await executeApi({
      url: "Attachment/tempUpload",
      method: "POST",
      payload: formDataPayload,
      // 2. Wrap headers inside 'config' so your executor picks them up
      config: {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    });
    // The backend returns the Tempdata object: { FileName, PublicUrl, LocalPath }
    const data = response;

    // 🔥 2. Save the full temp data object into our React state
    setTempFiles((prev) => [...prev, data]);

    // 🔥 3. Return ONLY the public URL for the Tiptap editor to display
    return data.PublicUrl;
  };

  const theme = config.theme || {};

  return (
    <div className={`wg-form-container ${theme.formContainer || ""}`}>
      <div className="p-6 flex-1 overflow-y-auto">
        {fields?.length > 0 && (
          <FormEngine
            fields={fields}
            values={formData}
            onChange={handleChange}
            master={masterData}
            errors={errors}
            uploadFile={uploadFile}
            onFileDelete={handleEditorFileDelete}
            globalTheme={theme} // 🔥 Pass the theme down!
          />
        )}
      </div>

      <div className={`wg-form-footer ${theme.footer || ""}`}>
        {/* 🔥 UPDATED: Dynamic Action Button Rendering */}
        {config.actions && config.actions.length > 0 ? (
          config.actions.map((action, index) => (
            <button
              key={index}
              type="button"
              disabled={isPending}
              className={
                action.className || `wg-btn-primary ${theme.submitBtn || ""}`
              }
              onClick={() => {
                // Standard Submit Button
                if (action.type === "submit") {
                  handleSubmit();
                }
                // Custom Button (like Commit & Close)
                else if (action.onClick) {
                  action.onClick({
                    formData,
                    // Pass handleSubmit so they can inject their overrides safely
                    submitForm: handleSubmit,
                  });
                }
              }}
            >
              {isPending && action.type === "submit"
                ? "Processing..."
                : action.label}
            </button>
          ))
        ) : (
          /* Fallback if no config.actions are provided */
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isPending}
            className={`wg-btn-primary ${theme.submitBtn || ""}`}
          >
            {isPending
              ? mode === "Create"
                ? "Creating..."
                : "Updating..."
              : `${mode} ${module}`}
          </button>
        )}
      </div>
    </div>
  );
}
