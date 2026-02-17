import { useParams } from "react-router-dom"
import { useApiQuery } from "../../../core/query/useApiQuery"
import { queryKeys } from "../../../core/query/queryKeys"
import { useRepoMaster } from "../hooks/useRepoMaster";

export default function RepositoryPage() {
const { data, isLoading } = useRepoMaster();
  // if (isLoading) return <p>Loading repo details...</p>

  return (
    <div>
      <h2>Repository</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
