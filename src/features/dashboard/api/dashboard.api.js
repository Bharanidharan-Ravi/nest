import apiClient from "../../../core/api/apiClient"

export const fetchDashboardData = async (endpoint) => {
  const response = await apiClient.get(endpoint)
  return response.data
}
