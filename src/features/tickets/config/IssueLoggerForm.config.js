import { IssueLoggerFieldConfig } from "./IssueLoggerField.config";

// "Create Issue" submits to the same endpoint as the Thread "Commit Update"
// button (/WorkStream), keyed to this ticket via IssueId (=ticketId). The
// backend is expected to, in one request:
//   1. Create the normal Thread entry (CommentText = the Issue Description).
//   2. Insert a row into a new "IssueLog" table for this ticket, using the
//      IssueLog_* fields below (Description/Status/Priority/DeveloperRemarks/
//      TesterRemarks/RetestResult/Hours/Attachment). Issue/Point No., Date
//      Raised and Last Updated Date are not sent from the UI — the backend
//      generates/stamps those itself when the row is inserted/updated.
// The IsIssueLog marker flags the payload so the backend knows to do both.
export const IssueLoggerFormConfig = {
  key: "IssueLogger",
  title: "Issue Logger",
  api: "/WorkStream",
  theme: {
    formContainer: "border-0 shadow-none !max-h-none overflow-visible p-0 bg-transparent flex flex-col w-full",
    footer: "bg-slate-50/50 border-t border-slate-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl flex-none",
    submitBtn: "px-5 py-2.5 text-sm font-bold bg-slate-900 hover:bg-black text-white rounded-lg transition-all shadow-xs active:scale-[0.98] duration-150 cursor-pointer disabled:opacity-50",
    cancelBtn: "px-4 py-2.5 text-sm font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition-all shadow-2xs active:scale-[0.98] duration-150 cursor-pointer",
    editorContainer: "border border-slate-200/80 rounded-xl overflow-hidden bg-white focus-within:border-slate-800 transition-colors duration-150",
    editorToolbar: "flex flex-wrap items-center gap-1 p-2 border-b border-slate-100 bg-slate-50/30",
  },
  fields: IssueLoggerFieldConfig(),
};
