import { queryKeys } from "../../../core/query/queryKeys";
import { RepoFieldConfig } from "./CreateRepo.Config";
export const repositoryFormConfig = {
  key: "project",
  title: "Project",
  api: "/Project/PostProject",

  invalidateKeys: [queryKeys.project.list()],

  redirectTo: "/p",

  fields: RepoFieldConfig(),
};
