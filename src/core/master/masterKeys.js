// core/master/masterKeys.js

export const masterKeys = {
  all: ["master"],

  repo: () => ["master", "repo"],
  project: () => ["master", "project"],
  employee: () => ["master", "employee"],
  label: () => ["master", "label"],

  multi: (keys) => ["master", keys],
};
