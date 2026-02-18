import { useNavigate, useParams } from "react-router-dom"
import { useMasterData } from "../../../core/master/useMasterData";

export default function RepositoryPage() {
// const { data, isLoading } = useRepoMaster();
 const { data, isLoading } = useMasterData();
const navigate = useNavigate();
  // if (isLoading) return <p>Loading repo details...</p>

  return (
    <div>
      <h2>Repository</h2>
      <button onClick={() => navigate("/repository/create")}>Create New Repository</button>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
