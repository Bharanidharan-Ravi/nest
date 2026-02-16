import { useNavigate, useParams } from "react-router-dom"
import { useTicketMaster } from "../hooks/useTicketMaster";

export default function TicketsPage() {
  const { repoId } = useParams()
  const navigate = useNavigate()

  const { data, isLoading } = useTicketMaster(repoId)
  const isRepoScoped = !!repoId

  const handleCreate = () => {
    if (isRepoScoped) {
      navigate(`/repository/${repoId}/t/create`)
    } else {
      navigate(`/tickets/create`)
    }
  }

  const handleView = (ticketId) => {
    if (isRepoScoped) {
      navigate(`/repository/${repoId}/t/${ticketId}`)
    } else {
      navigate(`/tickets/${ticketId}`)
    }
  }

  if (isLoading) return <p>Loading tickets...</p>

  return (
    <div>
      <h3>
        {isRepoScoped
          ? `Tickets for Repo ${repoId}`
          : "All Tickets"}
      </h3>

      {/* 🔥 Create Button */}
      <button onClick={handleCreate}>
        Create Ticket
      </button>

      <hr />

      <ul>
        {data?.Data?.map(ticket => (
          <li
            key={ticket.Issue_Id}
            style={{ cursor: "pointer" }}
            onClick={() => handleView(ticket.Issue_Id)}
          >
            {ticket.Issue_Title} (Repo: {ticket.Repo_Id})
          </li>
        ))}
      </ul>
    </div>
  )
}