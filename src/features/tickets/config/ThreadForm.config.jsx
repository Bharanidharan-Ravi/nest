import React from "react";
import { FaCheckCircle, FaSave, FaTelegramPlane, FaTimesCircle, FaUndo } from "react-icons/fa";
import { ROUTE_KEYS } from "../../../core/routing/paths";
import { ThreadFieldConfig } from "./Thread.config";

// 🔥 HELPER: Checks if ONLY the Ticket Status Update fields are filled
const isProgressOnlyUpdate = (formData, context) => {
  // 1. Check Thread Data safely (handles empty strings "")
  const cleanDesc = (formData?.description || "").replace(/<[^>]*>?/gm, "").trim();

  const hasThreadData =
    cleanDesc.length > 0 ||
    (formData?.hours || "").trim().length > 0 ||
    (formData?.fromTime || "").trim().length > 0 ||
    (formData?.toTime || "").trim().length > 0 ||
    (formData?.assignees?.length || 0) > 0
    ;

  // 2. Check Progress Data safely
  const summary = (formData?.TicketStatusSummary || "").trim();
  const currentPct = Number(formData?.TicketOverallPercentage || 0);

  // We ONLY count the percentage as "updated" if it changed from what it was when the page loaded
  const initialPct = Number(context?.editingItem?.OverallPercentage || context?.editingItem?.CompletionPct || 0);

  const hasProgressData = summary.length > 0 || currentPct !== initialPct;

  // 3. Return true ONLY if they typed progress data BUT left all thread data completely empty
  return !hasThreadData && hasProgressData;
};
const stripHtml = (str = "") =>
  str.replace(/<[^>]*>/g, "")
    .replace(/&nbsp;|&zwnj;/gi, "")
    .trim();

export const validateThreadForm = (formData, context) => {
  if (context?.isViewer) {
    return {};
  }
  const errors = {};


  const description = stripHtml(formData.description);
  const summary = stripHtml(formData.TicketStatusSummary);

  const hasDescription = !!description;
  const hasSummary = !!summary;


  const hasTime =
    !!formData.hours ||
    (!!formData.fromTime && !!formData.toTime);

  const hasProgress =
    !!formData.TicketOverallPercentage;
  
  const original = {
    requestClose: !!(
      context?.parentTicket?.IsCloseRequested ||
      context?.parentTicket?.isCloseRequested
    ),
    priority: !!(
      context?.parentTicket?.PriorityRequest ||
      context?.parentTicket?.priorityRequest
    ),
    functional: !!(
      context?.parentTicket?.FuncResponse ||
      context?.parentTicket?.funcResponse
    ),
    web: !!(
      context?.parentTicket?.WebResponse ||
      context?.parentTicket?.webResponse
    ),
    technical: !!(
      context?.parentTicket?.TechnicalResponse ||
      context?.parentTicket?.technicalResponse
    ),
    admin: !!(
      context?.parentTicket?.AdminResponse ||
      context?.parentTicket?.adminResponse
    ),
  };

  const current = {
    requestClose: !!formData.requestClose,
    priority: !!formData.Priority,
    functional: !!formData["Functional Response"],
    web: !!formData["Web Response"],
    technical: !!formData["Technical Response"],
    admin: !!formData["Admin Response"],
  };

  const togglesChanged = Object.keys(original).some(
    key => original[key] !== current[key]
  );

  // Description required
  if (
    !hasDescription &&
    !hasSummary &&
    !togglesChanged && !hasProgress
  ) {
    errors.description = "Description is mandatory.";
  }

  // Description required when logging hours
  if (
    !hasDescription &&
    hasTime &&
    !hasSummary &&
    !togglesChanged
  ) {
    errors.description =
      "Description is mandatory when logging hours.";
  }

  // Hours required when description entered
  if (hasDescription && !hasTime) {
    errors.hours =
      "Hours are mandatory when description is entered.";
  }

  // Summary required when progress/toggle changed and no description
  if (
    // !hasDescription &&
    (hasProgress) &&
    !hasSummary
  ) {
    errors.TicketStatusSummary =
      "Status Summary is required.";
  }

  if (togglesChanged &&
    !hasSummary
  ) {
    errors.TicketStatusSummary =
      "Status Summary is mandatory when a toggle is changed.";
  }


  return errors;
};

export const ThreadFormConfig = {
  key: "Thread",
  title: "Thread",
  api: "/WorkStream",
  redirectTo: ROUTE_KEYS.TICKET_DETAIL,
  fields: ThreadFieldConfig(),
  actions: ({ formData, context }) => {
    const statusId = formData?.StreamStatus?.value?.id;
    const role = context?.userRole;
    const currentStreamStatus = context?.activeWorkStream?.StreamStatus;
    const openDialog = context?.openDialog;
    if (context?.isClosed) {
      return [
        {
          label: "Reopen Ticket",
          type: "button",
          icon: (
            <span className="flex items-center pr-3 border-r border-green-500/60 mr-1">
              <FaUndo className="text-sm opacity-90" />
            </span>
          ),
          className:
            "inline-flex items-center bg-green-700 hover:bg-green-600 text-white border border-green-700 shadow-sm text-sm font-semibold pl-3 pr-4 py-1.5 rounded-md transition-all",
            onClick: ({ submitForm, formData,setErrors }) =>{
              const errors={};
              const percentage=formData?.TicketOverallPercentage
              const summary=stripHtml(formData?.TicketStatusSummary)
              if(percentage===undefined||percentage===null||percentage===""||Number(percentage)<0){
                errors.TicketOverallPercentage="Please select Battery % less than 100"
              }else if(Number(percentage)>=100){
                errors.TicketOverallPercentage="Overall Battery % must be less than 100% to reopen"
              }
              if(!summary){
                errors.TicketStatusSummary="Status Summary mandatory before reopen"
              }
              if (Object.keys(errors).length>0){
                setErrors(prev=>({...prev,...errors}))
                return
              }
              submitForm({ IsReopenRequest: true })},
           
        },
      ];
    }

    // ── 1. TESTER BUTTONS ─────────────────────────────────────────
    if (role === "Tester") {
      return [
        {
          type: "split-button",
          options: [
            {
              label: "Update Progress",
              subtext: "Log hours without finishing testing",
              colorClass: "bg-gray-700",
              onClick: ({ submitForm }) => {
                const overrides = { StreamStatus: currentStreamStatus };
                // if (isProgressOnlyUpdate(formData)) {
                //   overrides.IsTicketProgressOnly = true;
                // }
                submitForm(overrides);
              }
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
              },
            },
            {
              label: "Report Bug",
              subtext: "Rejects code and blocks developer",
              colorClass: "bg-red-600",
              onClick: ({ submitForm }) =>
                submitForm({
                  StreamStatus: currentStreamStatus,
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
                if (Number(formData.CompletionPercentage) === 100) {
                  alert(
                    "Please use the 'Commit & Complete Task' button since your work is 100% finished.",
                  );
                  return;
                }

                const overrides = { StreamStatus: 5 };
                // if (isProgressOnlyUpdate(formData)) {
                //   overrides.IsTicketProgressOnly = true;
                // }
                if (formData.assignees && formData.assignees.length > 0) {
                  const myUserId = context?.currentUser?.userId?.toLowerCase();
                  const isAssigningSelf = formData.assignees.some(
                    (a) => a.value.id.toLowerCase() === myUserId,
                  );

                  if (isAssigningSelf) {
                    alert("You cannot assign the ticket to yourself.");
                    return;
                  }

                  overrides.NextAssignees = formData.assignees.map((a) => ({
                    Id: a.value.id,
                    StreamId: 5,
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

                if (formData.assignees && formData.assignees.length > 0) {
                  const myUserId = context?.currentUser?.userId?.toLowerCase();
                  const isAssigningSelf = formData.assignees.some(
                    (a) => a.value.id.toLowerCase() === myUserId,
                  );

                  if (isAssigningSelf) {
                    alert("You cannot assign the ticket to yourself.");
                    return;
                  }

                  overrides.NextAssignees = formData.assignees.map((a) => ({
                    Id: a.value.id,
                    StreamId: 5,
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

                if (Number(formData.CompletionPercentage) === 100) {
                  overrides.StreamStatus = 6;
                } else {
                  overrides.StreamStatus = 5;
                }

                if (formData.assignees && formData.assignees.length > 0) {
                  overrides.NextAssignees = formData.assignees.map((a) => ({
                    Id: a.value.id,
                    StreamId: 7,
                  }));
                } else {
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
                submitForm(overrides);
              },
            },
            {
              label: "Move to Functional QA",
              subtext: "Handoff to QA (Requires Assignee)",
              intent: "warning",
              onClick: ({ formData, submitForm }) => {
                if (!formData.assignees || formData.assignees.length === 0) {
                  alert(
                    "Please select a tester in the 'Assignees' dropdown before moving to Functional QA.",
                  );
                  return;
                }

                const overrides = {};
                overrides.NextAssignees = formData.assignees.map((a) => ({
                  Id: a.value.id,
                  StreamId: 8,
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

    if (role === "Owner" && !context.isViewer) {

      return [
        // ── SEPARATE BUTTON (LEFT SIDE) ──
        {
          type: "button",
          label: "Commit to Client",
          subtext: "Commit status to client",
          intent: "clientCommit",
          className:
            "bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold border-transparent",
          icon: <FaTelegramPlane className="text-black-600" />,
          onClick: ({ formData, setErrors, context, submitForm }) => {
            const validationErrors = validateThreadForm(formData, context);
            if (Object.keys(validationErrors).length > 0) {
              setErrors((prev) => ({
                ...prev,
                ...validationErrors,
              }));
              return; // 🚨 STOP HERE
            }
            openDialog({
              variant: "info",
              title: "Commit this thread to the client?",
              description: "This will update the thread for all participants",
              confirmText: "Yes, Commit",
              cancelText: "Cancel",
              onConfirm: () =>
                submitForm({
                  Comment: formData.description,
                  toClient: true,
                }),
              onCancel: () => { },
            });
          },
        },
        // ── SPLIT BUTTON ──
        {
          type: "split-button",
          options: [
            {
              label: "Commit Update",
              subtext: "Save changes",
              intent: "neutral",
              icon: <FaSave className="text-gray-500" />,
              onClick: ({ formData, setErrors, context, submitForm }) => {
                const validationErrors = validateThreadForm(formData, context);

                if (Object.keys(validationErrors).length > 0) {
                  setErrors((prev) => ({
                    ...prev,
                    ...validationErrors,
                  }));

                  return; // 🚨 STOP HERE

                }
                let overrides = {
                 
                };
                // // if (isProgressOnlyUpdate(formData)) {
                // //   overrides.IsTicketProgressOnly = true;
                // // }
                if(context?.onCommitIntercept){
                  context.onCommitIntercept((isSupport)=>{
                    submitForm({...overrides,IsSupport:isSupport})
                  })
                }else{
                submitForm(overrides);}
              },
            },
            {
              label: "Complete & Close",
              subtext: "Complete this ticket successfully",
              intent: "success",
              icon: <FaCheckCircle className="text-green-600" />,
              onClick: ({ submitForm, formData,setErrors }) =>{
                const errors={};
                const percentage=formData?.TicketOverallPercentage
                const summary=stripHtml(formData?.TicketStatusSummary)
                if(!percentage||Number(percentage)<100){
                  errors.TicketOverallPercentage="Overall progress must be 100% before closing"
                }
                if(!summary){
                  errors.TicketStatusSummary="Status Summary mandatory before closing"
                }
                if (Object.keys(errors).length>0){
                  setErrors(prev=>({...prev,...errors}))
                  return
                }
                submitForm(
                  {
                    StreamStatus: 15,
                    CompletionPercentage: 100,
                    Comment:
                      formData.description || "Ticket closed by owner.",
                  },
                  true
                )},
            },
            {
              label: "Cancel & Close",
              subtext: "Mark this ticket as cancelled",
              intent: "danger",
              icon: <FaTimesCircle className="text-red-600" />,
              onClick: ({ submitForm, formData }) =>
                submitForm(
                  {
                    StreamStatus: 16,
                    Comment:
                      formData.description || "Ticket cancelled by owner.",
                  },
                  true
                ),
            },
          ],
        },
      ];
    }

    const isClosed = Boolean(context?.isClosed);
    const isOwner = Boolean(context?.isOwner);
    const isViewer = Boolean(context?.isViewer);

    if (isClosed) return [];
    const commitAction = {
      label: "Commit Update",
      subtext: "Save changes",
      intent: "neutral",
      icon: <FaSave className="text-gray-500" />,
      onClick: ({ formData, setErrors, context, submitForm }) => {
        const validationErrors = validateThreadForm(formData, context);
        if (Object.keys(validationErrors).length > 0) {
          setErrors((prev) => ({
            ...prev,
            ...validationErrors,
          }));
          return;
        }
        const overrides = {
          Comment: formData.description,
          toClient: isViewer,
        };

        if (context?.isViewer) {
          submitForm(overrides);
          return;
        }

        // if (isProgressOnlyUpdate(formData)) {
        //   overrides.IsTicketProgressOnly = true;
        // }
        if (context?.onCommitIntercept) {
          context.onCommitIntercept((isSupport) => {
            submitForm({ ...overrides, IsSupport: isSupport });
          });
        } else {
          submitForm(overrides);
        }
      },
    };

    const closeAction = {
      label: "Complete & Close",
      subtext: "Complete this ticket successfully",
      intent: "success",
      icon: <FaCheckCircle className="text-green-600" />,
      onClick: ({ submitForm, formData }) =>
        submitForm(
          {
            StreamStatus: 15,
            CompletionPercentage: 100,
            Comment: formData.description || "Ticket closed by owner.",
          },
          true
        ),
    };

    // ✅ ONLY when BOTH owner + viewer → split button
    if (isOwner && isViewer) {
      return [
        {
          type: "split-button",
          options: [commitAction, closeAction],
        },
      ];
    }
    return [
      {
        type: "button",
        ...commitAction,
      },
    ];
  },


  theme: {
    editorContainer:
      "border border-gray-300 rounded-md overflow-hidden bg-white focus-within:border-gray-500 focus-within:ring-0 transition-all",
    editorToolbar:
      "flex flex-wrap items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50",
  },
};





// import React from "react";
// import { FaCheckCircle, FaSave, FaTimesCircle, FaUndo } from "react-icons/fa";
// import { ROUTE_KEYS } from "../../../core/routing/paths";
// import { ThreadFieldConfig } from "./Thread.config";

// export const ThreadFormConfig = {
//   key: "Thread",
//   title: "Thread",
//   api: "/WorkStream",

//   // invalidateKeys: [masterKeys.multi(["ThreadList"])],
//   redirectTo: ROUTE_KEYS.TICKET_DETAIL,
//   fields: ThreadFieldConfig(),

//   actions: ({ formData, context }) => {
//     const statusId = formData?.StreamStatus?.value?.id;
//     const role = context?.userRole;
//     const currentStreamStatus = context?.activeWorkStream?.StreamStatus

//     if (context?.isClosed) {
//       return [
//         {
//           label: "Reopen Ticket", // Explicit label
//           type: "button",
//           //  icon: React.createElement(FaUndo),
//           icon: (
//             <span className="flex items-center pr-3 border-r border-green-500/60 mr-1">
//               <FaUndo className="text-sm opacity-90" />
//             </span>
//           ),
//           className:
//             "inline-flex items-center bg-green-700 hover:bg-green-600 text-white border border-green-700 shadow-sm text-sm font-semibold pl-3 pr-4 py-1.5 rounded-md transition-all",
//           // Optional: You can pass custom overrides here if your backend needs specific flags
//           // onClick: ({ submitForm }) => submitForm({ IsReopenRequest: true })
//           onClick: ({ submitForm }) =>
//             submitForm({
//               IsReopenRequest: true,
//               // StreamStatus: 18 // Use 18 (or your specific Reopen status ID)
//             }),
//         },
//       ];
//     }
//     // ── 1. TESTER BUTTONS ─────────────────────────────────────────
//     if (role === "Tester") {
//       return [
//         {
//           type: "split-button", // 👈 Triggers your new component
//           options: [
//             {
//               label: "Update Progress",
//               subtext: "Log hours without finishing testing",
//               colorClass: "bg-gray-700", // Tailwind color
//               onClick: ({ submitForm }) =>
//                 submitForm({ StreamStatus: currentStreamStatus }),
//             },
//             {
//               label: "Pass & Complete",
//               subtext: "Marks testing as 100% successful",
//               colorClass: "bg-green-600",
//               onClick: ({ submitForm }) => {
//                 submitForm({
//                   StreamStatus: currentStreamStatus,
//                   CompletionPercentage: 100,
//                   ClearTestFailure: true,
//                 });
//               },
//             },
//             {
//               label: "Report Bug",
//               subtext: "Rejects code and blocks developer",
//               colorClass: "bg-red-600",
//               onClick: ({ submitForm }) =>
//                 submitForm({
//                   StreamStatus: currentStreamStatus,
//                   ReportTestFailure: true,
//                   TestFailureComment: formData.description,
//                 }),
//             },
//           ],
//         },
//       ];
//     }

//     // ── 2. DEVELOPER BUTTONS ──────────────────────────────────────
//     if (role === "Dev") {
//       return [
//         {
//           type: "split-button",
//           options: [
//             {
//               label: "Commit Progress",
//               subtext: "Save your current work",
//               intent: "neutral",
//               onClick: ({ formData, submitForm, context }) => {
//                 // 🔥 1. Block 100% on normal commit
//                 if (Number(formData.CompletionPercentage) === 100) {
//                   alert(
//                     "Please use the 'Commit & Complete Task' button since your work is 100% finished.",
//                   );
//                   return;
//                 }

//                 const overrides = { StreamStatus: 5 };

//                 // 🔥 2. Handle Assignees with StreamId 5
//                 if (formData.assignees && formData.assignees.length > 0) {
//                   const myUserId = context?.currentUser?.userId?.toLowerCase();

//                   // 🔥 3. Validate they didn't assign it to themselves
//                   const isAssigningSelf = formData.assignees.some(
//                     (a) => a.value.id.toLowerCase() === myUserId,
//                   );

//                   if (isAssigningSelf) {
//                     alert(
//                       "You cannot assign the ticket to yourself. Please remove your name from the Assignees list.",
//                     );
//                     return;
//                   }

//                   overrides.NextAssignees = formData.assignees.map((a) => ({
//                     Id: a.value.id,
//                     StreamId: 5, // 5 = In Development
//                   }));
//                 } else {
//                   overrides.NextAssignees = null;
//                 }

//                 submitForm(overrides);
//               },
//             },
//             {
//               label: "Commit & Complete Task",
//               subtext: "Mark your work as 100% finished",
//               intent: "primary",
//               onClick: ({ formData, submitForm, context }) => {
//                 const overrides = {
//                   StreamStatus: 6,
//                   CompletionPct: 100,
//                 };

//                 // 🔥 If they complete their task but hand it to another DEV (StreamId 5)
//                 if (formData.assignees && formData.assignees.length > 0) {
//                   const myUserId = context?.currentUser?.userId?.toLowerCase();

//                   const isAssigningSelf = formData.assignees.some(
//                     (a) => a.value.id.toLowerCase() === myUserId,
//                   );

//                   if (isAssigningSelf) {
//                     alert(
//                       "You cannot assign the ticket to yourself. Please remove your name from the Assignees list.",
//                     );
//                     return;
//                   }

//                   overrides.NextAssignees = formData.assignees.map((a) => ({
//                     Id: a.value.id,
//                     StreamId: 5, // 5 = In Development
//                   }));
//                 } else {
//                   overrides.NextAssignees = null;
//                 }

//                 submitForm(overrides);
//               },
//             },
//             {
//               label: "Move to Unit Testing",
//               subtext: "Internal testing (Assignee Optional)",
//               intent: "warning",
//               onClick: ({ formData, submitForm }) => {
//                 const overrides = {};

//                 // 1. Set the correct Developer status
//                 if (Number(formData.CompletionPercentage) === 100) {
//                   overrides.StreamStatus = 6;
//                 } else {
//                   overrides.StreamStatus = 5;
//                 }

//                 // 2. 🔥 SELF-TAGGING MAGIC for Unit Testing (StreamId: 7)
//                 if (formData.assignees && formData.assignees.length > 0) {
//                   // Scenario A: They explicitly picked someone else in the dropdown
//                   overrides.NextAssignees = formData.assignees.map((a) => ({
//                     Id: a.value.id,
//                     StreamId: 7,
//                   }));
//                 } else {
//                   // Scenario B: They left it empty! Auto-assign to THEMSELVES.
//                   // We grab their ID safely from the context you passed into the form
//                   const myUserId = context?.currentUser?.userId;

//                   if (myUserId) {
//                     overrides.NextAssignees = [
//                       {
//                         Id: myUserId,
//                         StreamId: 7,
//                       },
//                     ];
//                   }
//                 }
//                 ((overrides.StreamStatus = 6), submitForm(overrides));
//               },
//             },
//             {
//               label: "Move to Functional QA",
//               subtext: "Handoff to QA (Requires Assignee)",
//               intent: "warning",
//               onClick: ({ formData, submitForm }) => {
//                 // FIXED: Checking assignees instead of AssignedTo
//                 if (!formData.assignees || formData.assignees.length === 0) {
//                   alert(
//                     "Please select a tester in the 'Assignees' dropdown before moving to Functional QA.",
//                   );
//                   return;
//                 }

//                 // 🔥 Build array manually for Dev
//                 const overrides = {};
//                 overrides.NextAssignees = formData.assignees.map((a) => ({
//                   Id: a.value.id,
//                   StreamId: 8, // 8 = Functional QA
//                 }));
//                 if (Number(formData.CompletionPercentage) === 100) {
//                   overrides.StreamStatus = 6;
//                 } else {
//                   overrides.StreamStatus = 5;
//                 }

//                 submitForm(overrides);
//               },
//             },
//           ],
//         },
//       ];
//     }

//     // ── 3. OWNER BUTTONS ──────────────────────────────────────────
//     // 🔥 FIX: Explicitly check for Owner!
//     if (role === "Owner") {
//       return [
//         {
//           type: "split-button",
//           options: [
//             {
//               label: "Commit Update",
//               subtext: "Save changes or reassign users",
//               intent: "neutral",
//               icon: <FaSave className="text-gray-500" />,
//               onClick: ({ formData, submitForm }) => {
//                 let overrides = {};

//                 const cleanComment = formData.description
//                   ?.replace(/<[^>]*>?/gm, "")
//                   .trim();
//                 const hasComment = !!cleanComment;
//                 const hasHours = !!formData.hours || !!formData.fromTime;

//                 // FIXED: Changed to assignees
//                 const hasAssignee = formData.assignees?.length > 0;
//                 const hasStatus = !!formData.UpdateStatus;

//                 // ── ASSIGN ONLY MODE ──
//                 if (context.isOwner && !hasComment && !hasHours) {
//                   if (hasAssignee) {
//                     overrides.AssignOnly = true;
//                     overrides.Comment = null;
//                   }
//                 } else if (hasComment) {
//                   overrides.WorkStreamId =
//                     context?.activeWorkStream?.StreamId ||
//                     context?.lastValidStreamId ||
//                     null;
//                 }
//                 // ── NORMAL UPDATE WITH ASSIGNMENTS ──
//                 // else if (context.isOwner && !hasComment && hasAssignee) {
//                 //   overrides.Comment =
//                 //     "System: Owner updated assignees and logged hours.";
//                 // }

//                 submitForm(overrides);
//               },
//             },
//             {
//               label: "Complete & Close",
//               subtext: "Complete this ticket successfully",
//               intent: "success",
//               icon: <FaCheckCircle className="text-green-600" />,
//               onClick: ({ submitForm }) =>
//                 submitForm(
//                   {
//                     StreamStatus: 15, // 14 = Closed
//                     CompletionPercentage: 100,
//                     Comment: formData.description || "Ticket closed by owner.",
//                   },
//                   true,
//                 ),
//             },
//             {
//               label: "Cancel & Close",
//               subtext: "Mark this ticket as cancelled",
//               intent: "danger",
//               icon: <FaTimesCircle className="text-red-600" />,
//               onClick: ({ submitForm }) =>
//                 submitForm(
//                   {
//                     StreamStatus: 16, // 15 = Cancelled
//                     Comment:
//                       formData.description || "Ticket cancelled by owner.",
//                   },
//                   true,
//                 ),
//             },
//           ],
//         },
//       ];
//     }

//     // ── 4. STANDARD/FALLBACK BUTTON ───────────────────────────────
//     // 🔥 FIX: Users who are just "Standard" fall here and get a normal button.
//     return [
//       {
//         label: "Commit Update",
//         type: "button",
//         className:
//           "bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 font-medium",
//         onClick: ({ submitForm }) => submitForm(),
//       },
//     ];
//   },
//   theme: {
//     // Parent Card & Footer
//     // formContainer: "wg-form-container",
//     // footer: "wg-form-footer",
//     // submitBtn: "wg-submit-btn",
//     // input: "wg-input",
//     // Editor Styling
//     editorContainer:
//       "border border-gray-300 rounded-md overflow-hidden bg-white focus-within:border-gray-500 focus-within:ring-0 transition-all",
//     editorToolbar:
//       "flex flex-wrap items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50",
//   },
// };
