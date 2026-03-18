import {  ProgressUpdateConfig } from "./ProgressUpdate.config";


export const ProgressUpdateFormConfig = {
  key: "ProgressUpdateForm",
  title: "Log Progress",
  api: "/WorkStream", // 👈 The API endpoint your backend auto-built
  
  // Optional: Invalidate the ticket query to auto-refresh the UI after submit
  // invalidateKeys: ["TicketDetails"], 

  fields: ProgressUpdateConfig(),

  // Theming to make it fit perfectly inside the sidebar widget
 theme: {
    formContainer: "p-0", 
    // footer: "mt-5 border-t border-gray-100 pt-4 flex justify-end",
    // This targets your default button and gives it a solid blue color
    submitBtn: "w-full bg-blue-600 text-white hover:bg-blue-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm",
    editorContainer: "border border-gray-300 rounded-md overflow-hidden bg-white focus-within:border-gray-500 transition-all min-h-[120px] mt-1",
    editorToolbar: "flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-gray-200 bg-gray-50",
  },
  // Optional: Custom action buttons if you want a "Cancel" button natively in the form
  actions: [
    {
      type: "submit",
      label: "Post Update",
      className: "w-full py-2.5 px-4 bg-gray-900 rounded-lg text-sm font-medium wg-btn-primary hover:bg-gray-800 transition-colors shadow-sm"
    }
  ]
};