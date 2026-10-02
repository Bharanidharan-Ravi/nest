import apiClient from "../../../core/api/apiClient"

export const loginApi = async (data) => {
  const response = await apiClient.post("Login", data, { _anonymous: true })
  return response
}
