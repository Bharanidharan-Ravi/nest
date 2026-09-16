export const isAllowedToView = (item, userId) => {
    const normalizedUserId = String(userId ?? "").toLowerCase().trim();
    if (!item?.privateTicket && Number(item?.statusId) !== 19) {
      return true;
    }
    // Public items or items not in restricted status are visible to everyone.
    const assignedTo = String(item?.assignedTo ?? "")
      .toLowerCase()
      .trim();
    if (assignedTo === normalizedUserId) return true;
  
    if (!userId) return false;
    // Allow multi assignees.
    if (Array.isArray(item?.multiAssignees)) {
      return item.multiAssignees.some((assignee) => {
        const assigneeId = String(assignee?.Assignee_Id ?? "")
          .toLowerCase()
          .trim();
  
        const assigneeName = String(assignee?.Assignee_Name ?? "")
          .toLowerCase()
          .trim();
  
        return (
          assigneeId === normalizedUserId ||
          assigneeName === normalizedUserId
        );
      });
    }
  
    return false;
  };