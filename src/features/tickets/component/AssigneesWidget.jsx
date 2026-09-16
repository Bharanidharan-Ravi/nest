// component/AssigneesWidget.jsx
import React, { useState, useMemo, useEffect } from "react";
import {
  FaCheckCircle,
  FaSpinner,
  FaPlus,
  FaTimes,
  FaListUl,
  FaProjectDiagram,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";
import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
import { ProgressUpdateFormConfig } from "../config/AssigneesWidget/ProgressUpdateForm.config"; // 👈 Import your new config
import { ProgressUpdateConfig } from "../config/AssigneesWidget/ProgressUpdate.config";
import MuiSelectInput from "../../../packages/react-input-engine/adapters/mui/MuiSelectInput";
import { useEmployeeOptions, useRepoById, useRepoOptions, useRepoWithOutId } from "../../../core/master/selectors/selectors";
import { buildOptionsResolver } from "../../../app/shared/utilities/utilities";
import { Autocomplete, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { useEntityForm } from "../../../packages/crud/formFramework/useEntityForm";
import apiClient from "../../../core/api/apiClient";

export default function AssigneesWidget({
  workStreams = [],
  formContext,
  threads = [],
  ticketId,
  data,
  selectedWorkStream,
  onSelectWorkStream,
  selectedHandoffId, // 🔥 Received from parent
  onSelectHandoff, // 🔥 Received from parent
}) {

  const repoMaster = useRepoWithOutId();
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [expandedNodes, setExpandedNodes] = useState({});

  const [moveToValue,setMoveToValue]=useState(()=>{
    try{
      const raw=data?.move_toJson
      
      if(!raw)return []
      const parsed=JSON.parse(raw)
      return parsed.map((m)=>({
        label:m.Title,
        value:{id:m.Move_to,name:m.Title}
      }))
    }
    catch{
      return[]
    }
  })
  useEffect(()=>{
    try{
      const raw=data?.move_toJson
      if(!raw){
        setMoveToValue([])
        return
      }
      const parsed=JSON.parse(raw)
      setMoveToValue(
        parsed.map((m)=>({
          label:m.Title,
          value:{id:m.Move_to,name:m.Title},
        }))
      )
    }
    catch{
      setMoveToValue([])
    }
  },[data?.move_toJson])
  const [moveToSaving,setMoveToSaving]=useState(false)
  
  const handleMoveToChange=async(_,selected)=>{
    const previous=moveToValue
    setMoveToValue(selected)
    setMoveToSaving(true)

    try{
      await apiClient.put(`/CurrentHolder/${ticketId}`,{
        Assignee_To_Move:selected.map((s)=>({id:s.value.id})),
      })
    }catch(err){
      setMoveToValue(previous)
      formContext?.openDialog?.({
        variant:"error",
        title:"Move To Update Failed",
        description:"Please try again.",
        confirmText:"OK",
        onConfirm:()=>{},
      })
    }finally{
      setMoveToSaving(false)
    }
  };

  const myLastThread = useMemo(() => {
    if (!threads || !formContext?.currentUser) return null;
    const myThreads = threads.filter(
      (t) =>
        t.CreatedBy === formContext.currentUser.userId ||
        t.CreatedBy === formContext.currentUser.id,
    );
    return myThreads.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    )[0];
  }, [threads, formContext?.currentUser]);

  const filteredWorkStreams = useMemo(() => {
    if (!workStreams) return [];
    return workStreams.filter(
      (ws) =>
        ws.Assignee_Type !== "Main Assignee" &&
        ws.Assignment_Type !== "Main Assignee",
    );
  }, [workStreams]);

  const allHandoffs = useMemo(() => {
    let list = [];
    filteredWorkStreams.forEach((ws) => {
      if (ws.HandOffData && ws.HandOffData.length > 0) {
        ws.HandOffData.forEach((h) => {
          list.push({
            ...h,
            SourceName: ws.Assignee_Name,
            SourcePct: ws.CompletionPct,
          });
        });
      }
    });
    return list;
  }, [filteredWorkStreams]);

  const getAssigneeName = (streamId) => {
    const match = filteredWorkStreams.find((ws) => ws.StreamId === streamId);
    return match ? match.Assignee_Name : "Unknown";
  };

  const toggleExpand = (streamId, e) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [streamId]: !prev[streamId] }));
  };

  const summary = useMemo(() => {
    if (!filteredWorkStreams || filteredWorkStreams.length === 0)
      return { total: 0, completed: 0, pending: 0, overallPct: 0 };
    const total = filteredWorkStreams.length;
    const completed = filteredWorkStreams.filter(
      (ws) => ws.CompletionPct === 100,
    );
    const pending = filteredWorkStreams.filter((ws) => ws.CompletionPct < 100);
    const overallPct = Math.round(
      filteredWorkStreams.reduce(
        (acc, ws) => acc + (ws.CompletionPct || 0),
        0,
      ) / total,
    );
    return {
      total,
      completed: completed.length,
      pending: pending.length,
      overallPct,
    };
  }, [filteredWorkStreams]);


  // const dropDown = [
  //   {
  //     label: "Move to",
  //     name: "move_to",
  //     type: "select",
  //     ui: "mui",
  //     colSpan: 12,
  //     required: false,
  //     apiKey: "Move_to",
  //     // optionsResolver: buildOptionsResolver(
  //     //   "RepoList",
  //     //   null,
  //     //   null,
  //     //   null,
  //     //   null,
  //     //   {
  //     //     nestedKey: "RepoUserList",
  //     //     nestedIdKey: "UserId",
  //     //     nestedLabelKey: "UserName",
  //     //     prependOption: {
  //     //       label: "All User",
  //     //       value: "",
  //     //     },
  //     //   }
  //     // ),
  //     // dataType: "string",
  //     // apiKey: "Move_to",
  //     // optionsResolver: buildOptionsResolver(
  //     //   "RepoList", // 1. listKey
  //     //   "Repo_Id", // 2. idKey
  //     //   "Title",
  //     //   (user) => formContext.isViewer? user.Title === 'WG':   user.Repo_Id === data.repoId, 
  //     // ),
  //     optionsResolver: buildOptionsResolver(
  //       "RepoList",
  //       "Repo_Id",
  //       "Title",
  //       (item) => {
  //         return item.Title === "WG" || item.Repo_Id === data.repoId;
  //       }
  //     ),
  //   },
  // ]

  const repoOptions = useMemo(() => {
    return [
      ...repoMaster
        .filter((item) => item.id === data.repoId)
        .map((item) => ({
          label: item.name,
          value: {
            id: item.id,
            name: item.name,
          },
        })),

     
          {
            label: "WorkGlow Solutions",
            value: {
                 //id:"0c265d6d-084b-43be-ab61-0389357bd28a", 
              id: "7c4039b9-248c-4d4c-a66b-976554d603b1",
              name: "WorkGlow Solutions",
            },
          } 
    ];
  }, [repoMaster, data.repoId]);


  return (
    <>
      {!formContext.isViewer &&

        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl flex flex-col max-h-full overflow-hidden">
          {/* SECTION 1: OVERALL PROGRESS */}

          <div className="p-4 bg-gray-50/50 border-b border-gray-100 shrink-0">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
              Overall Progress
            </h4>
            <div className="flex items-center gap-3 mb-2">
              <div className="text-2xl font-black text-gray-800">
                {data?.completionPct}%
              </div>
              <div className="flex-1">
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${data?.completionPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 🔥 SECTION 2: FIXED HEADER (Separated from the scrolling list) 🔥 */}
          <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Workstreams ({summary.total})
            </h4>
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-md border border-gray-200">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1 rounded transition-colors ${viewMode === "list" ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                title="List View"
              >
                <FaListUl size={12} />
              </button>
              <button
                onClick={() => setViewMode("tree")}
                className={`p-1 rounded transition-colors ${viewMode === "tree" ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                title="Tree View"
              >
                <FaProjectDiagram size={12} />
              </button>
            </div>
          </div>

          {/* SECTION 3: SCROLLABLE LIST */}
          <div
            className={`px-4 py-3 flex flex-col gap-3 overflow-y-auto wg-scrollbar bg-white transition-all duration-300 ${showUpdateForm ? "shrink-0 max-h-[25vh]" : "flex-1"}`}
          >
            {filteredWorkStreams?.map((ws, index) => {
              const myTestingQueue = allHandoffs.filter(
                (h) => h.TargetStreamId === ws.StreamId,
              );
              const hasOutgoingHandoffs =
                ws.HandOffData && ws.HandOffData.length > 0;
              const isExpanded = expandedNodes[ws.StreamId];

              return (
                <div
                  key={ws.StreamId || index}
                  onClick={() => {
                    if (selectedWorkStream?.StreamId === ws.StreamId)
                      onSelectWorkStream(null);
                    else onSelectWorkStream(ws);
                  }}
                  className={`flex flex-col gap-1 pb-2 border-b border-gray-50 cursor-pointer p-2 rounded-md transition-all ${selectedWorkStream?.StreamId === ws.StreamId
                    ? "bg-blue-50 border-blue-200 ring-1 ring-blue-500"
                    : "hover:bg-gray-50"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {viewMode === "tree" && hasOutgoingHandoffs && (
                        <div
                          onClick={(e) => toggleExpand(ws.StreamId, e)}
                          className="text-gray-400 hover:text-gray-700 w-3"
                        >
                          {isExpanded ? (
                            <FaChevronDown size={10} />
                          ) : (
                            <FaChevronRight size={10} />
                          )}
                        </div>
                      )}

                      {ws.CompletionPct === 100 ? (
                        <FaCheckCircle className="text-green-500" size={13} />
                      ) : (
                        <FaSpinner
                          className="text-blue-500 animate-spin-slow"
                          size={13}
                        />
                      )}
                      <span className="text-[13px] font-semibold text-gray-800">
                        {ws.Assignee_Name || "Assignee"}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-gray-600">
                      {ws.CompletionPct || 0}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 ${viewMode === "tree" && hasOutgoingHandoffs ? "ml-6" : "ml-6"}`}
                    >
                      {ws.StatusName || `Status ID: ${ws.StreamStatus}`}
                    </span>
                  </div>

                  {/* 🔥 TREE VIEW (Dev's Outgoing) */}
                  {viewMode === "tree" && isExpanded && hasOutgoingHandoffs && (
                    <div className="ml-5 pl-3 mt-2 border-l-2 border-gray-200 flex flex-col gap-1.5">
                      {ws.HandOffData.map((handoff) => (
                        <div
                          key={handoff.HandsOffId}
                          // 🔥 SELECT HANDOFF EVENT
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectHandoff(
                              selectedHandoffId === handoff.HandsOffId
                                ? null
                                : handoff?.HandsOffId,
                            );
                          }}
                          // onClick={() => {
                          //   if (selectedHandoffId?.HandsOffId === handoff.HandsOffId)
                          //     onSelectHandoff(null);
                          //   else onSelectHandoff(handoff);
                          // }}
                          className={`p-1.5 rounded-md border flex justify-between items-center shadow-sm cursor-pointer transition-colors ${selectedHandoffId === handoff.HandsOffId
                            ? "bg-blue-50 border-blue-300 ring-1 ring-blue-400"
                            : "bg-gray-50/80 border-gray-200 hover:border-gray-300"
                            }`}
                        >
                          <span className="text-[10px] text-gray-600">
                            ↳ Push #{handoff.HandsOffId} to{" "}
                            <strong className="text-gray-800">
                              {getAssigneeName(handoff.TargetStreamId)}
                            </strong>
                          </span>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-600">
                              {handoff.CompletionPct}%
                            </span>
                            {/* <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          handoff.Status === 'Pending' ? 'bg-orange-100 text-orange-600' :
                          handoff.Status === 'Passed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {handoff.Status}
                        </span> */}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 🔥 LIST VIEW (Tester's Incoming Queue) */}
                  {viewMode === "list" && myTestingQueue.length > 0 && (
                    <div className="mt-2 border-t border-blue-100/50 pt-2 ml-1">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                        Testing Queue
                      </span>
                      <ul className="mt-1 flex flex-col gap-1.5">
                        {myTestingQueue.map((handoff) => (
                          <li
                            key={handoff.HandsOffId}
                            // 🔥 SELECT HANDOFF EVENT
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectHandoff(
                                selectedHandoffId === handoff.HandsOffId
                                  ? null
                                  : handoff?.HandsOffId,
                              );
                            }}
                            className={`rounded border p-1.5 shadow-sm cursor-pointer transition-colors ${selectedHandoffId === handoff.HandsOffId
                              ? "bg-blue-50 border-blue-300 ring-1 ring-blue-400"
                              : "bg-white border-gray-200 hover:border-gray-300"
                              }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-semibold text-gray-700">
                                Push #{handoff.HandsOffId} from {handoff.SourceName}
                              </span>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-600">
                                  {handoff.CompletionPct}%
                                </span>
                                {/* <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              handoff.Status === 'Pending' ? 'bg-orange-100 text-orange-600' :
                              handoff.Status === 'Passed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                            }`}>
                              {handoff.Status}
                            </span> */}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* SECTION 4: YOUR FORM ENGINE */}
          <div
            className={`bg-gray-50 border-t border-gray-200 flex flex-col transition-all duration-300 ${showUpdateForm ? "flex-1 min-h-0" : "shrink-0"}`}
          >

          </div>
        </div>

      }

      
      <div className="p-4 bg-white border border-gray-200 shadow-sm rounded-2xl mb-3">
        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">
          Assignee
        </label>

        <Autocomplete
          multiple
          size="small"
          options={repoOptions}
          value={moveToValue}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, value) => {
            return option.value.id.toLowerCase() === value.value.id.toLowerCase();
          }}
          onChange={handleMoveToChange}
          disabled={moveToSaving}
          filterSelectedOptions

          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select Assignee"
              variant="outlined"
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  backgroundColor: "#fff",
                  fontSize: "13px",
                  minHeight: "38px",
                  "& fieldset": {
                    borderColor: "#e5e7eb",
                  },
                  "&:hover fieldset": {
                    borderColor: "#93c5fd",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#3b82f6",
                  },
                },
                "& .MuiAutocomplete-tag": {
                  backgroundColor: "#eff6ff",
                  color: "#2563eb",
                  border: "1px solid #bfdbfe",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 600,
                },
              }}
            />
          )}
          renderOption={(props, option) => (
            <li
              {...props}
              className="text-[13px] px-3 py-2 hover:bg-blue-50 cursor-pointer"
            >
              {option.label}
            </li>
          )}
        />
      </div>
    </>
  );
}

