import { useRef, useState } from "react";
import {
  Download,
  Upload,
  FileText,
  Clock,
  Loader2,
} from "lucide-react";
import dayjs from "dayjs";

export const PolicyTab = ({ isAdmin, policyData, onUpload }) => {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const fileName =
    policyData?.FileName ||
    policyData?.fileName ||
    "No policy document uploaded yet.";

  const previewUrl =
    policyData?.previewUrl || policyData?.PreviewUrl;

  const updatedAt =
    policyData?.UpdatedAt || policyData?.updatedAt;

  const updatedBy =
    policyData?.UpdatedBy || policyData?.updatedBy;

  const handleDownload = async () => {
    if (!previewUrl) return;

    try {
      setIsDownloading(true);

      const response = await fetch(previewUrl);

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const originalBlob = await response.blob();

      const forceDownloadBlob = new Blob([originalBlob], {
        type: "application/octet-stream",
      });

      const downloadUrl =
        window.URL.createObjectURL(forceDownloadBlob);

      const tempLink = document.createElement("a");

      tempLink.style.display = "none";
      tempLink.href = downloadUrl;
      tempLink.download =
        policyData?.FileName ||
        policyData?.fileName ||
        "Company_Policy";

      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);

      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Failed to download file:", error);
      alert(
        "Failed to download file. Please check your network connection."
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];

    if (file && onUpload) {
      try {
        setIsUploading(true);
        await onUpload(file);
      } finally {
        setIsUploading(false);
      }
    }

    // Allow selecting the same file again
    e.target.value = null;
  };

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-brand-yellow/10 rounded-lg text-brand-yellow">
          <FileText className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-semibold text-brand-black m-0">
          Company Policy
        </h3>
      </div>

      {/* Description */}
      <p className="text-gray-600 leading-relaxed mb-8">
        Our company policies outline our core values, expectations,
        and guidelines. Please review this document to ensure a safe,
        respectful, and productive work environment for everyone.
      </p>

      {/* Policy Card */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* File Information */}
        <div className="min-w-0 flex-1 w-full">
          <h4
            className="font-medium text-gray-900 mb-1 truncate"
            title={fileName}
          >
            {fileName}
          </h4>

          {updatedAt && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500 min-w-0">
              <Clock className="w-3.5 h-3.5 shrink-0" />

              <span className="truncate">
                Last updated:{" "}
                {dayjs(updatedAt).format("DD/MM/YYYY hh:mm A")} by{" "}
                {updatedBy}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          {/* Download Button */}
          {previewUrl && (
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors disabled:opacity-70 whitespace-nowrap"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download
                </>
              )}
            </button>
          )}

          {/* Upload */}
          {isAdmin && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx"
                className="hidden"
                disabled={isUploading}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-brand-yellow text-white rounded-md font-medium hover:bg-yellow-500 transition-colors disabled:opacity-70 whitespace-nowrap"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload New
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
