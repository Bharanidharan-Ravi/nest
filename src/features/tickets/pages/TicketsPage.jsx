import { useNavigate, useParams } from "react-router-dom";
import { useTicketMaster } from "../hooks/useTicketMaster";
import "../css/ViewTickets.css";
import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
import { ListLayout } from "../../../packages/ui-List/components/ListLayout";
import { repoListConfig } from "../config/Ticket.Config";

export default function TicketsPage() {
  const { repoId, projectId, projId } = useParams();
  const navigate = useNavigate();
  const activeProjectId = projectId ?? projId;

  const { data, isLoading } = useTicketMaster({
    repoId,
    projectId: activeProjectId,
  });

  const ticketList = Array.isArray(data)
    ? data
    : Array.isArray(data?.Data)
    ? data.Data
    : Array.isArray(data?.TicketsList?.Data)
    ? data.TicketsList.Data
    : [];

  const isRepoScoped = !!repoId;
  //  const data = queryClient.getQueryData(queryKeys.ticket.list(repoId));
  const handleCreate = () => {
    if (isRepoScoped) {
      navigate(`/repository/${repoId}/t/create`);
    } else {
      navigate(`/tickets/create`);
    }
  };

  const handleView = (ticketId) => {
    if (isRepoScoped) {
      navigate(`/repository/${repoId}/t/${ticketId}`);
    } else {
      navigate(`/tickets/${ticketId}`);
    }
  };

  if (isLoading) return <p>Loading tickets...</p>;

  return (
    <div>
      {/* <h3>{isRepoScoped ? `Tickets for Repo ${repoId}` : "All Tickets"}</h3> */}

      {/* 🔥 Create Button */}
      <button onClick={handleCreate}>Create Ticket</button>

      <hr />

      <div className="tickets-container container">
        {/* <div className="repo-header">
          <SearchDiv
            searchValue={searchTerm}
            onChange={fetchFilterTickets}
            openModal={openModal}
            placeholder={"Tickets"}
          />
        </div> */}

        <div className="flex-1 min-h-0">
          <ListProvider config={repoListConfig} data={ticketList}>
            <ListLayout />
          </ListProvider>
        </div>
        <ul className="ticket-list">
          {ticketList.length > 0 ? (
            ticketList.map((ticket) => (
              <li
                key={ticket.Issue_Id}
                className={`ticket ${ticket.Status}`}
                onClick={() => handleView(ticket.Issue_Id)}
              >
                {/* <Link to={`${ticket.issue_Id}`} className="ticket-link"> */}
                <div className="ticket-header">
                  <span className="ticket-title">{ticket.Issue_Title}</span>
                  <span className={`ticket-status ${ticket.Status}`}>
                    {ticket.Status}
                  </span>
                </div>
                <div className="ticket-details">
                  <span className="ticket-assignee">
                    Assigned to: {ticket.Assignee_Name}
                  </span>
                  <span className="ticket-created">
                    Created: {ticket.CreatedAt}
                  </span>
                  {/* <span className="ticket-comments">{ticket.comments} comments</span> */}
                </div>
                <div className="ticket-labels">
                  {/* 1. Check if JSON exists, then Parse & Map immediately */}
                  {ticket.Labels_JSON
                    ? JSON.parse(ticket.Labels_JSON).map((label, index) => (
                        <span
                          key={label.LABEL_ID || index} // Use ID if available, fallback to index
                          className="ticket-label"
                          style={{
                            backgroundColor: label.LABEL_COLOR, // Apply color from DB
                            color: "#fff", // Text color (white usually looks best on colored tags)
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            marginRight: "4px",
                          }}
                        >
                          {label.LABEL_TITLE}
                        </span>
                      ))
                    : null}
                </div>
                {/* </Link> */}
              </li>
            ))
          ) : (
            <p className="no-results">No tickets found.</p>
          )}
        </ul>
      </div>
    </div>
  );
}
