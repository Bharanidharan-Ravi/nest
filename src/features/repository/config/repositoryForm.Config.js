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
};
