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
  // actions: [
  //   {
  //     label: "Create Thread",
  //     type: "submit",

  //   },
  //   {
  //     label: "Commit & Close",
  //     type: "button", // Important: type is "button", not "submit"
  //     className:
  //       "bg-brand-yellow text-white px-4 py-2 rounded-md hover:bg-yellow-600 ml-3 font-medium",
  //     onClick: (formContext) => {
  //       // 🔥 Safely inject the forced values directly into the submit pipeline!
  //       formContext.submitForm({
  //         UpdateStatus: "CLOSED",
  //         CompletionPercentage: 100,
  //       });
  //     },
  //   },
  // ],
  actions: ({ formData, context }) => {
    const statusId = formData?.StreamStatus?.value?.id;
    const role = context?.userRole;

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
              onClick: ({ submitForm }) => submitForm(),
            },
            {
              label: "Pass & Complete",
              subtext: "Marks testing as 100% successful",
              colorClass: "bg-green-600",
              onClick: ({ submitForm }) =>
                submitForm({
                  CompletionPercentage: 100,
                  ClearTestFailure: true,
                }),
            },
            {
              label: "Report Bug",
              subtext: "Rejects code and blocks developer",
              colorClass: "bg-red-600",
              onClick: ({ submitForm }) =>
                submitForm({
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
      return [{
        type: "split-button",
        options: [
          {
            label: "Commit Progress",
            subtext: "Save your current work",
            intent: "neutral",
            onClick: ({ submitForm }) => submitForm() 
          },
          {
            label: "Commit & Complete Task",
            subtext: "Mark your work as 100% finished",
            intent: "primary",
            onClick: ({ submitForm }) => submitForm({ 
              StreamStatus: 6, 
              CompletionPct: 100 // Forces 100% completion
            })
          },
          {
            label: "Move to Unit Testing",
            subtext: "Internal testing (Assignee Optional)",
            intent: "warning",
            onClick: ({ submitForm }) => submitForm({ 
              NextAssigneeStreamId: 7 // 7 = Unit Testing
            })
          },
          {
            label: "Move to Functional QA",
            subtext: "Handoff to QA (Requires Assignee)",
            intent: "warning", 
            onClick: ({ formData, submitForm }) => {
              if (!formData.AssignedTo || formData.AssignedTo.length === 0) {
                alert("Please select a tester in the 'Assign To' dropdown before moving to Functional QA.");
                return;
              }
              submitForm({ 
                NextAssigneeStreamId: 8 // 8 = Functional Testing
              });
            }
          }
        ]
      }];
    }

    // ── 3. OWNER BUTTONS ──────────────────────────────────────────
    // 🔥 FIX: Explicitly check for Owner!
    if (role === "Owner") {
      return [{
        type: "split-button",
        options: [
          {
            label: "Commit Update",
            subtext: "Save changes or reassign users",
            intent: "neutral",
            onClick: ({ submitForm }) => {
              let overrides = {};
              if (context.isOwner && !formData.description && formData.AssignedTo?.length > 0) {
                 overrides.Comment = "System: Owner updated assignees.";
              }
              submitForm(overrides);
            }
          },
          {
            label: "Complete & Close",
            subtext: "Complete this ticket successfully",
            intent: "success",
            onClick: ({ submitForm }) => submitForm({ 
              StreamStatus: 14, // 14 = Closed
              CompletionPercentage: 100,
              Comment: formData.description || "Ticket closed by owner."
            })
          },
          {
            label: "Cancel & Close",
            subtext: "Mark this ticket as cancelled",
            intent: "danger",
            onClick: ({ submitForm }) => submitForm({ 
              StreamStatus: 15, // 15 = Cancelled
              Comment: formData.description || "Ticket cancelled by owner." 
            })
          }
        ]
      }];
    }

    // ── 4. STANDARD/FALLBACK BUTTON ───────────────────────────────
    // 🔥 FIX: Users who are just "Standard" fall here and get a normal button.
    return [{
      label: "Commit Update",
      type: "button",
      className: "bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 font-medium",
      // onClick: ({ submitForm }) => submitForm()
    }];
  },
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
