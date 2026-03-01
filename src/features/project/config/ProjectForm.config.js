import { queryKeys } from "../../../core/query/queryKeys";
import { ProjFieldConfig } from "./ProjectCreate.config";

  export const projectFormConfig = {
    key: "project",
    title: "Project",
    api: "/Project/PostProject",

    invalidateKeys: [queryKeys.project.list()],

    redirectTo: ({ goBack }) => goBack(),

    fields: ProjFieldConfig(),
  };
