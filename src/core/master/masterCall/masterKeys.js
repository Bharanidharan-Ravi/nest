// src/core/master/masterCall/masterKeys.js

// The one bulk master list: boot preload, useMasterData() and the realtime
// patcher must all use this exact array, or each builds its own cache entry
// and the same masters are fetched twice.
export const MASTER_DATA_KEYS = [
  "RepoList",
  "ProjectList",
  "EmployeeList",
  "LabelMaster",
  "StatusMaster",
  "TeamMaster",
];

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