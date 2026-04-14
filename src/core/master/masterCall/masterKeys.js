// src/core/master/masterCall/masterKeys.js

export const masterKeys = {
  all: ["master"],

  repo:       () => ["master", "RepoList"],
  project:    () => ["master", "ProjectList"],
  employee:   () => ["master", "EmployeeList"],
  label:      () => ["master", "LabelMaster"],
  status:     () => ["master", "StatusMaster"],
  team:       () => ["master", "TeamMaster"],

  // Used for the bulk pre-load query (all keys together)
  multi: (keys) => ["master", keys],
};