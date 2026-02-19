import apiClient from "../../../core/api/apiClient"

export const loginApi = async (data) => {
  const response = await apiClient.post("Login", data)
  return response
}
