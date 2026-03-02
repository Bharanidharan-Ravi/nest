import { useNavigate, useParams } from "react-router-dom";
import { useThreadMaster } from "../hooks/useTicketThread";
import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
import { ListCardView } from "../../../packages/ui-List/components/ListCardView";
import { ThreadListConfig, ThreadParentConfig } from "../config/ThreadUI.Config";
import { ListLayout } from "../../../packages/ui-List/components/ListLayout";
import { ThreadFieldConfig } from "../config/Thread.config";
import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
import { ThreadFormConfig } from "../config/ThreadForm.config";
import { useTicketMaster } from "../hooks/useTicketMaster";
import React from "react";
import FloatingArrowScroll from "../../../app/shared/Component/FloatingArrowScroll";



const TicketDetailPage = () => {
  const { ticketId } = useParams();
  console.log("ticketId",ticketId)
  const navigate = useNavigate();
  const { data: ThreadsList } = useThreadMaster(ticketId);
  const { data: ticketMasterData } = useTicketMaster();
  console.log("ticketMasterData",ticketMasterData);
  

  const threads = ThreadsList?.ThreadsList?.Data || [];
  const normalizeThread = (thread) => ({
    Id: thread.Issue_Id,
    ThreadId: thread.ThreadId,
    description: thread.HtmlDesc,
    Hours: thread.Hours,
    createdAt: thread.CreatedAt,
    CreatedBy: thread.CreatedBy,
    UpdatedAt: thread.UpdatedAt,
    UpdatedBy: thread.UpdatedBy,
  });

  const rawList = threads.map(normalizeThread);

  // Prepare UI data for the parent (issue)
  const IssueParentData = React.useMemo(() => {
    if (!ticketMasterData) return [];
    const parent = ticketMasterData.find(issue => issue.Issue_Id === ticketId);
    console.log("parent",parent);
    
    return parent ? [{
      id: parent.Issue_Id,
      title: parent.Title,
      description:parent.HtmlDesc || parent.Description,
      label: parent.Labels_JSON,
      project :parent. Project_Id,
      assginedTo: parent.Assignee_Name  ,
      estimateHours:parent.hours,
      status: parent.Status,
      DueDate: parent.Due_Date,
      UpdatedAt: parent.UpdatedAt,
      UpdatedBy: parent.UpdatedBy,
    }] : [];
  }, [ticketMasterData]);
  console.log("IssueParentData",IssueParentData);
 const listConfigWithEdit ={...ThreadListConfig,
  onEditClick:(item)=>{
    // navigate(`/tickets`);
  }
 }
  return (
    < >
      {/* Display Parent Data List */}
      <div className="mb-4">
        <ListProvider config={ThreadParentConfig} data={IssueParentData}>
          <ListLayout />
        </ListProvider>
      </div>

      {/* Display Threads List */}
      <div className="mb-8">
        <ListProvider config={listConfigWithEdit} data={rawList}>
          <ListLayout />
        </ListProvider>
      </div>

      {/* Thread Form */}
      <div className="mt-2" id="bottomSection">
        <EntityFormPage
          mode="Create"
          config={{
            ...ThreadFormConfig,
            fields: ThreadFieldConfig(ticketId)
          }}
          module="Thread"
        />
      </div>
      <FloatingArrowScroll targetId="bottomSection" />
    </>
  );
};

export default TicketDetailPage;