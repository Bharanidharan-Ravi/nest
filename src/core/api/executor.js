import apiClient from "./apiClient"
import { createApiExecutor } from "./createApiExecutor"

export const executeApi = createApiExecutor(apiClient)
