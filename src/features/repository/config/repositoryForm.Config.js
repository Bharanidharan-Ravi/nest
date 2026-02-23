import { masterKeys } from "../../../core/master/masterKeys";
import { queryKeys } from "../../../core/query/queryKeys";
import { RepoFieldConfig } from "./CreateRepo.Config";
export const repositoryFormConfig = {
  key: "repo",
  title: "Repository",
  api: "/Repo/PostRepo",

  invalidateKeys: [masterKeys.multi(["RepoList"])],

  redirectTo: "/repository",

  fields: RepoFieldConfig(),

  theme: {
    // Parent Card & Footer
    // formContainer: "wg-form-container",
    // footer: "wg-form-footer",
    // submitBtn: "wg-submit-btn",
    // input: "wg-input",
    // Editor Styling
    editorContainer:
      "border border-gray-300 rounded-md overflow-hidden bg-white focus-within:border-gray-500 focus-within:ring-0 transition-all",
    editorToolbar:
      "flex flex-wrap items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50",
  },
};
