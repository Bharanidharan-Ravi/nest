// // core/master/masterKeys.js

// export const masterKeys = {
//   all: ["master"],

//   repo: () => ["master", "repo"],
//   project: () => ["master", "project"],
//   employee: () => ["master", "employee"],
//   label: () => ["master", "label"],

//   multi: (keys) => ["master", keys],
// };


// //anbu


// core/master/masterKeys.js

export const masterKeys = {
  all: ["master"],

  repo: () => ["master", "repo"],
  project: () => ["master", "project"],
  employee: () => ["master", "EmployeeList"],
  label: () => ["master", "label"],
  TeamMaster: () => ["master", "TeamMaster"],

  multi: (keys) => ["master", keys],
};
