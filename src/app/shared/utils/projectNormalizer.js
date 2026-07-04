export const normalizeProj = (proj) => ({
  id: proj.Id,
  title: proj.Project_Name,
  key: proj.ProjectKey,
  status: proj.Status,
  owner: proj.EmployeeName,
  createdAt: proj.CreatedAt,
  CreatedBy: proj.CreatedBy,
  repoId: proj.Repo_Id,
  repoName: proj.Repo_Name,
  repoKey: proj.RepoKey,
  UpdatedAt: proj.UpdatedAt,
  UpdatedBy: proj.UpdatedBy,
});