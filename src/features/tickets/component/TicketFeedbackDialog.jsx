import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { Star, MessageSquare, History, X } from "lucide-react";
import { executeApi } from "../../../core/api/executor";
import { useTicketFeedbacks } from "../hooks/useTicketFeedbacks"; 
import { queryKeys } from "../../../core/query/queryKeys";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

export default function TicketFeedbackDialog({
  open,
  onClose,
  ticket,
  involvedUsers = [],
}) {
    console.log("feedbackmodalinvolvedusers", involvedUsers);
  const queryClient = useQueryClient();
  const ticketId = ticket?.issueId || ticket?.navId || ticket?.id || ticket?.Issue_Id || ticket?.Id;
  const repoId = ticket?.repoId || ticket?.RepoId || ticket?.Repo_Id;

  const [activeTab, setActiveTab] = useState("give");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: feedbacks = [], isLoading, refetch } = useTicketFeedbacks(ticketId, true);

  const toggleUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === involvedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(involvedUsers.map((u) => u.id));
    }
  };

  useEffect(()=> {
    if (open){
        setActiveTab("give");
        setSelectedUsers([]);
        setComment("");
        setRating(3);
        setHoverRating(0);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (selectedUsers.length === 0) {
      toast.warning("Please select at least one member.");
      return;
    }

    try {
      setIsSubmitting(true);
      await executeApi({
        url: "/TicketFeedback/FeedbackPost",
        method: "POST",
        payload: {
          ticketId,
          repoId,
          userIds: selectedUsers,
          rating,
          comment: comment.trim() || null,
        },
      });

      setSelectedUsers([]);
      setComment("");
      setRating(5);
      onClose();
      
      toast.success("Feedback submitted successfully!");

      await Promise.all([
      refetch(),
      queryClient.invalidateQueries({
        queryKey: queryKeys.ticket.feedbacks(ticketId),
        refetchType:"all",
      }),
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.ticket.history(ticketId),
        refetchType:"all",
       }),
    ]);

      
    } catch (err) {
      toast.error(err.message || "Failed to submit feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle className="p-0 border-b border-slate-100">
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-500" />
            <span className="font-semibold text-slate-800 text-base">Ticket Feedback</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex border-t border-slate-100 px-5 gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("give")}
            className={`py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "give"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Give Feedback</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "history"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History ({feedbacks.length})</span>
          </button>
        </div>
      </DialogTitle>

      <DialogContent className="p-5 flex flex-col gap-4">
        {activeTab === "give" ? (
          <>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Select Member(s) ({selectedUsers.length}/{involvedUsers.length})
                </label>
                {involvedUsers.length > 1 && (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    {selectedUsers.length === involvedUsers.length ? "Deselect All" : "Select All"}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {involvedUsers.map((u) => {
                  const active = selectedUsers.includes(u.id);
                  return (
                    <button
                      type="button"
                      key={u.id}
                      onClick={() => toggleUser(u.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        active
                          ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {u.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Rating
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        (hoverRating || rating) >= star
                          ? "text-amber-400 fill-amber-400"
                          : "text-gray-200"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs font-bold text-slate-600">
                  {hoverRating || rating} / 5 Stars
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Feedback Note
              </label>
              <textarea
                rows={3}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                placeholder="Share feedback on resolution quality, speed, or coordination..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading history...</div>
            ) : feedbacks.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 italic">
                No feedback recorded for this ticket yet.
              </div>
            ) : (
              feedbacks.map((fb) => (
                <div
                  key={fb.FeedbackId}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex flex-col gap-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">
                      {fb.EmployeeName || "Assigned Member"}
                    </span>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(fb.Rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  {fb.Comment && (
                    <p className="text-slate-600 m-0 italic bg-white p-2 rounded border border-slate-100">
                      "{fb.Comment}"
                    </p>
                  )}
                  <span className="text-[10px] text-slate-400 pt-0.5">
                    {formatDate(fb.CreatedAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </DialogContent>

      {activeTab === "give" && (
        <DialogActions className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-white transition-colors"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
            onClick={handleSubmit}
            disabled={isSubmitting || selectedUsers.length === 0}
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </button>
        </DialogActions>
      )}
    </Dialog>
  );
}
