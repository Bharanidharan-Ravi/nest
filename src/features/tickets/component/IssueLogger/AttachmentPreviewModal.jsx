import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { FiX, FiDownload, FiFile, FiAlertCircle, FiLoader } from "react-icons/fi";

const IMAGE_EXT = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"];
const EXCEL_EXT = ["xls", "xlsx", "csv"];

export const getFileKind = (filename = "", url = "") => {
  const source = (filename || url || "").split("?")[0].split("#")[0];
  const ext = source.includes(".") ? source.split(".").pop().toLowerCase() : "";
  if (IMAGE_EXT.includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (EXCEL_EXT.includes(ext)) return "excel";
  return "other";
};

const downloadFile = async (url, filename) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (err) {
    console.error("Failed to download file:", err);
    window.open(url, "_blank", "noopener,noreferrer");
  }
};

const ExcelPreview = ({ url }) => {
  const [state, setState] = useState({ loading: true, error: null, sheets: [] });
  const [activeSheet, setActiveSheet] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, error: null, sheets: [] });
    setActiveSheet(0);

    (async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch file");
        const buffer = await response.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheets = workbook.SheetNames.map((name) => ({
          name,
          rows: XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: "" }),
        }));
        if (!cancelled) setState({ loading: false, error: null, sheets });
      } catch (err) {
        console.error("Failed to parse spreadsheet:", err);
        if (!cancelled) setState({ loading: false, error: "Couldn't read this file's rows.", sheets: [] });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (state.loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-slate-400 py-16 text-sm">
        <FiLoader className="animate-spin" size={16} />
        Reading rows…
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-slate-400 py-16 text-sm">
        <FiAlertCircle size={20} className="text-red-400" />
        {state.error}
      </div>
    );
  }

  const sheet = state.sheets[activeSheet];
  const rows = sheet?.rows || [];
  const [header, ...body] = rows;

  return (
    <div className="flex flex-col gap-2">
      {state.sheets.length > 1 && (
        <div className="flex gap-1 flex-wrap border-b border-slate-100 pb-2">
          {state.sheets.map((s, idx) => (
            <button
              key={s.name}
              type="button"
              onClick={() => setActiveSheet(idx)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                idx === activeSheet
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="text-center text-slate-400 py-16 text-sm">This sheet has no rows.</div>
      ) : (
        <div className="overflow-auto max-h-[65vh] border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            {header && (
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr>
                  {header.map((cell, idx) => (
                    <th key={idx} className="px-3 py-2 font-semibold text-slate-600 border-b border-slate-200 whitespace-nowrap">
                      {String(cell ?? "")}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {body.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 1 ? "bg-slate-50/50" : ""}>
                  {(header || row).map((_, cIdx) => (
                    <td key={cIdx} className="px-3 py-1.5 border-b border-slate-50 text-slate-600 whitespace-nowrap">
                      {String(row[cIdx] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const AttachmentPreviewModal = ({ attachments = [], initialIndex = 0, onClose }) => {
  const [index, setIndex] = useState(initialIndex);
  const attachment = attachments[index];

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!attachment) return null;

  const kind = getFileKind(attachment.filename, attachment.url);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2 min-w-0">
            <FiFile className="text-slate-400 shrink-0" size={16} />
            <span className="text-sm font-medium text-slate-700 truncate">{attachment.filename}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => downloadFile(attachment.url, attachment.filename)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Download"
            >
              <FiDownload size={15} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close"
            >
              <FiX size={16} />
            </button>
          </div>
        </div>

        {attachments.length > 1 && (
          <div className="flex gap-1 flex-wrap px-4 pt-3">
            {attachments.map((a, idx) => (
              <button
                key={`${a.url}-${idx}`}
                type="button"
                onClick={() => setIndex(idx)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium truncate max-w-[160px] transition-colors ${
                  idx === index
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
                title={a.filename}
              >
                {a.filename}
              </button>
            ))}
          </div>
        )}

        <div className="p-4 overflow-auto">
          {kind === "image" && (
            <img src={attachment.url} alt={attachment.filename} className="max-h-[75vh] mx-auto rounded-lg" />
          )}
          {kind === "pdf" && (
            <iframe src={attachment.url} title={attachment.filename} className="w-full h-[75vh] rounded-lg border border-slate-100" />
          )}
          {kind === "excel" && <ExcelPreview url={attachment.url} />}
          {kind === "other" && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400 text-sm">
              <FiFile size={28} className="text-slate-300" />
              <span>Preview isn't available for this file type.</span>
              <button
                type="button"
                onClick={() => downloadFile(attachment.url, attachment.filename)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-medium hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <FiDownload size={13} />
                Download instead
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttachmentPreviewModal;
