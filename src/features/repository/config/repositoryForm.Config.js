import { queryKeys } from "../../../core/query/queryKeys";
import { RepoFieldConfig } from "./CreateRepo.Config";
export const repositoryFormConfig = {
  key: "repo",
  title: "Repository",
  api: "/Repo/PostRepo",

  invalidateKeys: [queryKeys.repo.list()],

  redirectTo: "/repository",

  fields: RepoFieldConfig(),
};
