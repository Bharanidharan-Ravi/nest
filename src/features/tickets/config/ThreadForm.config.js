import { masterKeys } from "../../../core/master/masterKeys";
import { ROUTE_KEYS } from "../../../core/routing/paths";
import { ThreadFieldConfig } from "./Thread.config";

export const ThreadFormConfig = {
  key: "Thread",
  title: "Thread",
  api: "/WorkStream",

  // invalidateKeys: [masterKeys.multi(["ThreadList"])],
  redirectTo: ROUTE_KEYS.TICKET_DETAIL,
  fields: ThreadFieldConfig(),

  actions: ({ formData, context }) => {
    const statusId = formData?.StreamStatus?.value?.id;
    const role = context?.userRole;
    const currentStreamStatus = context?.activeWorkStream?.StreamStatus;
    console.log("currentStreamStatus :", currentStreamStatus);
    
    // ── 1. TESTER BUTTONS ─────────────────────────────────────────
    if (role === "Tester") {
      return [
        {
          type: "split-button", // 👈 Triggers your new component
          options: [
            {
              label: "Update Progress",
              subtext: "Log hours without finishing testing",
              colorClass: "bg-gray-700", // Tailwind color
              onClick: ({ submitForm }) =>
                submitForm({ StreamStatus: currentStreamStatus }),
            },
            {
              label: "Pass & Complete",
              subtext: "Marks testing as 100% successful",
              colorClass: "bg-green-600",
              onClick: ({ submitForm }) => {
                submitForm({
                  StreamStatus: currentStreamStatus, 
                  CompletionPercentage: 100,
                  ClearTestFailure: true,
                });

              }
            },
            {
              label: "Report Bug",
              subtext: "Rejects code and blocks developer",
              colorClass: "bg-red-600",
              onClick: ({ submitForm }) =>
                submitForm({
                  StreamStatus: currentStreamStatus ,
                  ReportTestFailure: true,
                  TestFailureComment: formData.description,
                }),
            },
          ],
        },
      ];
    }

    // ── 2. DEVELOPER BUTTONS ──────────────────────────────────────
    if (role === "Dev") {
      return [
        {
          type: "split-button",
          options: [
            {
              label: "Commit Progress",
              subtext: "Save your current work",
              intent: "neutral",
              onClick: ({ formData, submitForm, context }) => {
                // 🔥 1. Block 100% on normal commit
                if (Number(formData.CompletionPercentage) === 100) {
                  alert(
                    "Please use the 'Commit & Complete Task' button since your work is 100% finished.",
                  );
                  return;
                }

                const overrides = { StreamStatus: 5 };

                // 🔥 2. Handle Assignees with StreamId 5
                if (formData.assignees && formData.assignees.length > 0) {
                  const myUserId = context?.currentUser?.userId?.toLowerCase();

                  // 🔥 3. Validate they didn't assign it to themselves
                  const isAssigningSelf = formData.assignees.some(
                    (a) => a.value.id.toLowerCase() === myUserId,
                  );

                  if (isAssigningSelf) {
                    alert(
                      "You cannot assign the ticket to yourself. Please remove your name from the Assignees list.",
                    );
                    return;
                  }

                  overrides.NextAssignees = formData.assignees.map((a) => ({
                    Id: a.value.id,
                    StreamId: 5, // 5 = In Development
                  }));
                } else {
                  overrides.NextAssignees = null;
                }

                submitForm(overrides);
              },
            },
            {
              label: "Commit & Complete Task",
              subtext: "Mark your work as 100% finished",
              intent: "primary",
              onClick: ({ formData, submitForm, context }) => {
                const overrides = {
                  StreamStatus: 6,
                  CompletionPct: 100,
                };

                // 🔥 If they complete their task but hand it to another DEV (StreamId 5)
                if (formData.assignees && formData.assignees.length > 0) {
                  const myUserId = context?.currentUser?.userId?.toLowerCase();

                  const isAssigningSelf = formData.assignees.some(
                    (a) => a.value.id.toLowerCase() === myUserId,
                  );

                  if (isAssigningSelf) {
                    alert(
                      "You cannot assign the ticket to yourself. Please remove your name from the Assignees list.",
                    );
                    return;
                  }

                  overrides.NextAssignees = formData.assignees.map((a) => ({
                    Id: a.value.id,
                    StreamId: 5, // 5 = In Development
                  }));
                } else {
                  overrides.NextAssignees = null;
                }

                submitForm(overrides);
              },
            },
            {
              label: "Move to Unit Testing",
              subtext: "Internal testing (Assignee Optional)",
              intent: "warning",
              onClick: ({ formData, submitForm }) => {
                const overrides = {};

                // 1. Set the correct Developer status
                if (Number(formData.CompletionPercentage) === 100) {
                  overrides.StreamStatus = 6;
                } else {
                  overrides.StreamStatus = 5;
                }

                // 2. 🔥 SELF-TAGGING MAGIC for Unit Testing (StreamId: 7)
                if (formData.assignees && formData.assignees.length > 0) {
                  // Scenario A: They explicitly picked someone else in the dropdown
                  overrides.NextAssignees = formData.assignees.map((a) => ({
                    Id: a.value.id,
                    StreamId: 7,
                  }));
                } else {
                  // Scenario B: They left it empty! Auto-assign to THEMSELVES.
                  // We grab their ID safely from the context you passed into the form
                  const myUserId = context?.currentUser?.userId;

                  if (myUserId) {
                    overrides.NextAssignees = [
                      {
                        Id: myUserId,
                        StreamId: 7,
                      },
                    ];
                  }
                }
                ((overrides.StreamStatus = 6), submitForm(overrides));
              },
            },
            {
              label: "Move to Functional QA",
              subtext: "Handoff to QA (Requires Assignee)",
              intent: "warning",
              onClick: ({ formData, submitForm }) => {
                // FIXED: Checking assignees instead of AssignedTo
                if (!formData.assignees || formData.assignees.length === 0) {
                  alert(
                    "Please select a tester in the 'Assignees' dropdown before moving to Functional QA.",
                  );
                  return;
                }

                // 🔥 Build array manually for Dev
                const overrides = {};
                overrides.NextAssignees = formData.assignees.map((a) => ({
                  Id: a.value.id,
                  StreamId: 8, // 8 = Functional QA
                }));
                if (Number(formData.CompletionPercentage) === 100) {
                  overrides.StreamStatus = 6;
                } else {
                  overrides.StreamStatus = 5;
                }

                submitForm(overrides);
              },
            },
          ],
        },
      ];
    }

    // ── 3. OWNER BUTTONS ──────────────────────────────────────────
    // 🔥 FIX: Explicitly check for Owner!
    if (role === "Owner") {
      return [
        {
          type: "split-button",
          options: [
            {
              label: "Commit Update",
              subtext: "Save changes or reassign users",
              intent: "neutral",
              onClick: ({ formData, submitForm }) => {
                let overrides = {};

                const cleanComment = formData.description
                  ?.replace(/<[^>]*>?/gm, "")
                  .trim();
                const hasComment = !!cleanComment;
                const hasHours = !!formData.hours || !!formData.fromTime;

                // FIXED: Changed to assignees
                const hasAssignee = formData.assignees?.length > 0;
                const hasStatus = !!formData.UpdateStatus;

                // ── ASSIGN ONLY MODE ──
                if (context.isOwner && !hasComment && !hasHours) {
                  if (hasAssignee && hasStatus) {
                    overrides.AssignOnly = true;
                    overrides.Comment = null;
                  }
                }
                // ── NORMAL UPDATE WITH ASSIGNMENTS ──
                // else if (context.isOwner && !hasComment && hasAssignee) {
                //   overrides.Comment =
                //     "System: Owner updated assignees and logged hours.";
                // }

                submitForm(overrides);
              },
            },
            {
              label: "Complete & Close",
              subtext: "Complete this ticket successfully",
              intent: "success",
              onClick: ({ submitForm }) =>
                submitForm({
                  StreamStatus: 14, // 14 = Closed
                  CompletionPercentage: 100,
                  Comment: formData.description || "Ticket closed by owner.",
                }),
            },
            {
              label: "Cancel & Close",
              subtext: "Mark this ticket as cancelled",
              intent: "danger",
              onClick: ({ submitForm }) =>
                submitForm({
                  StreamStatus: 15, // 15 = Cancelled
                  Comment: formData.description || "Ticket cancelled by owner.",
                }),
            },
          ],
        },
      ];
    }

    // ── 4. STANDARD/FALLBACK BUTTON ───────────────────────────────
    // 🔥 FIX: Users who are just "Standard" fall here and get a normal button.
    return [
      {
        label: "Commit Update",
        type: "button",
        className:
          "bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 font-medium",
        onClick: ({ submitForm }) => submitForm(),
      },
    ];
  },

  // actions: ({ formData, context }) => {
  //   // ── 1. GLOBAL VARIABLES & HELPERS ─────────────────────────────────
  //   const role = context?.userRole;
  //   const currentStreamStatus = context?.activeWorkStream?.StreamStatus;
  //   const myUserId = context?.currentUser?.userId?.toLowerCase();

  //   // Reusable helper: Checks if the logged-in user accidentally assigned themselves
  //   const checkIsAssigningSelf = (assignees) => {
  //     if (!assignees || !myUserId) return false;
  //     return assignees.some((a) => a.value.id.toLowerCase() === myUserId);
  //   };

  //   // ── 2. TESTER BUTTONS ─────────────────────────────────────────────
  //   const testerButtons = [
  //     {
  //       type: "split-button",
  //       options: [
  //         {
  //           label: "Update Progress",
  //           subtext: "Log hours without finishing testing",
  //           colorClass: "bg-gray-700",
  //           onClick: ({ submitForm }) => submitForm({ StreamStatus: currentStreamStatus }),
  //         },
  //         {
  //           label: "Pass & Complete",
  //           subtext: "Marks testing as 100% successful",
  //           colorClass: "bg-green-600",
  //           onClick: ({ submitForm }) =>
  //             submitForm({
  //               StreamStatus: currentStreamStatus,
  //               CompletionPercentage: 100,
  //               ClearTestFailure: true,
  //             }),
  //         },
  //         {
  //           label: "Report Bug",
  //           subtext: "Rejects code and blocks developer",
  //           colorClass: "bg-red-600",
  //           onClick: ({ formData, submitForm }) =>
  //             submitForm({
  //               StreamStatus: currentStreamStatus,
  //               ReportTestFailure: true,
  //               TestFailureComment: formData.description,
  //             }),
  //         },
  //       ],
  //     },
  //   ];

  //   // ── 3. DEVELOPER BUTTONS ──────────────────────────────────────────
  //   const devButtons = [
  //     {
  //       type: "split-button",
  //       options: [
  //         {
  //           label: "Commit Progress",
  //           subtext: "Save your current work",
  //           intent: "neutral",
  //           onClick: ({ formData, submitForm }) => {
  //             if (Number(formData.CompletionPercentage) === 100) {
  //               alert("Please use the 'Commit & Complete Task' button since your work is 100% finished.");
  //               return;
  //             }

  //             const overrides = { StreamStatus: 5 };

  //             if (formData.assignees && formData.assignees.length > 0) {
  //               if (checkIsAssigningSelf(formData.assignees)) {
  //                 alert("You cannot assign the ticket to yourself. Please remove your name from the Assignees list.");
  //                 return;
  //               }
  //               overrides.NextAssignees = formData.assignees.map((a) => ({
  //                 Id: a.value.id,
  //                 StreamId: 5, // 5 = In Development
  //               }));
  //             } else {
  //               overrides.NextAssignees = null;
  //             }

  //             submitForm(overrides);
  //           },
  //         },
  //         {
  //           label: "Commit & Complete Task",
  //           subtext: "Mark your work as 100% finished",
  //           intent: "primary",
  //           onClick: ({ formData, submitForm }) => {
  //             const overrides = {
  //               StreamStatus: 6,
  //               CompletionPct: 100,
  //             };

  //             if (formData.assignees && formData.assignees.length > 0) {
  //               if (checkIsAssigningSelf(formData.assignees)) {
  //                 alert("You cannot assign the ticket to yourself. Please remove your name from the Assignees list.");
  //                 return;
  //               }
  //               overrides.NextAssignees = formData.assignees.map((a) => ({
  //                 Id: a.value.id,
  //                 StreamId: 5,
  //               }));
  //             } else {
  //               overrides.NextAssignees = null;
  //             }

  //             submitForm(overrides);
  //           },
  //         },
  //         {
  //           label: "Move to Unit Testing",
  //           subtext: "Internal testing (Assignee Optional)",
  //           intent: "warning",
  //           onClick: ({ formData, submitForm }) => {
  //             const overrides = {};

  //             if (formData.assignees && formData.assignees.length > 0) {
  //               overrides.NextAssignees = formData.assignees.map(a => ({
  //                 Id: a.value.id,
  //                 StreamId: 7
  //               }));
  //             } else if (myUserId) {
  //               overrides.NextAssignees = [{ Id: myUserId, StreamId: 7 }];
  //             }

  //             overrides.StreamStatus = 6;
  //             submitForm(overrides);
  //           },
  //         },
  //         {
  //           label: "Move to Functional QA",
  //           subtext: "Handoff to QA (Requires Assignee)",
  //           intent: "warning",
  //           onClick: ({ formData, submitForm }) => {
  //             if (!formData.assignees || formData.assignees.length === 0) {
  //               alert("Please select a tester in the 'Assignees' dropdown before moving to Functional QA.");
  //               return;
  //             }

  //             const overrides = {
  //               NextAssignees: formData.assignees.map(a => ({
  //                 Id: a.value.id,
  //                 StreamId: 8 // 8 = Functional QA
  //               })),
  //               StreamStatus: 6
  //             };

  //             submitForm(overrides);
  //           },
  //         },
  //       ],
  //     },
  //   ];

  //   // ── 4. OWNER BUTTONS ──────────────────────────────────────────────
  //   const ownerButtons = [
  //     {
  //       type: "split-button",
  //       options: [
  //         {
  //           label: "Commit Update",
  //           subtext: "Save changes or reassign users",
  //           intent: "neutral",
  //           onClick: ({ formData, submitForm }) => {
  //             let overrides = {};
  //             const hasComment = !!formData.description;
  //             const hasHours = !!formData.hours || !!formData.fromTime;
  //             const hasAssignee = formData.assignees?.length > 0;
  //             const hasStatus = !!formData.UpdateStatus;

  //             if (context.isOwner && !hasComment && !hasHours) {
  //               if (hasAssignee && hasStatus) {
  //                 overrides.AssignOnly = true;
  //                 overrides.Comment = null;
  //               }
  //             } else if (context.isOwner && !hasComment && hasAssignee) {
  //               overrides.Comment = "System: Owner updated assignees and logged hours.";
  //             }

  //             submitForm(overrides);
  //           },
  //         },
  //         {
  //           label: "Complete & Close",
  //           subtext: "Complete this ticket successfully",
  //           intent: "success",
  //           onClick: ({ formData, submitForm }) =>
  //             submitForm({
  //               StreamStatus: 14, // 14 = Closed
  //               CompletionPercentage: 100,
  //               Comment: formData.description || "Ticket closed by owner.",
  //             }),
  //         },
  //         {
  //           label: "Cancel & Close",
  //           subtext: "Mark this ticket as cancelled",
  //           intent: "danger",
  //           onClick: ({ formData, submitForm }) =>
  //             submitForm({
  //               StreamStatus: 15, // 15 = Cancelled
  //               Comment: formData.description || "Ticket cancelled by owner.",
  //             }),
  //         },
  //       ],
  //     },
  //   ];

  //   // ── 5. FALLBACK BUTTON ────────────────────────────────────────────
  //   const fallbackButtons = [
  //     {
  //       label: "Commit Update",
  //       type: "button",
  //       className: "bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 font-medium",
  //        onClick: ({ submitForm }) => submitForm()
  //     },
  //   ];

  //   // ── 6. FINAL RETURN LOGIC ─────────────────────────────────────────
  //   if (role === "Tester") return testerButtons;
  //   if (role === "Dev") return devButtons;
  //   if (role === "Owner") return ownerButtons;

  //   return fallbackButtons;
  // },
  theme: {
    // Parent Card & Footer
    // formContainer: "wg-form-container",
    // footer: "wg-form-footer",
    // submitBtn: "wg-submit-btn",
    // input: "wg-input",
    // Editor Styling
    editorContainer:
      "border border-gray-300 rounded-md overflow-hidden bg-white focus-within:border-gray-500 focus-within:ring-0 transition-all",
    editorToolbar:
      "flex flex-wrap items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50",
  },
};
