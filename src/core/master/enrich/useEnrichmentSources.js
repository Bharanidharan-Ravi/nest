import {
  useProjectMaster,
  useTeamMaster,
} from "../selectors/selectors";

export const useEnrichmentSources = () => {
  const projects = useProjectMaster();
  const teams = useTeamMaster();

  return {
    project: projects,
    team: teams,
  };
};