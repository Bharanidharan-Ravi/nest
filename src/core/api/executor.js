import apiClient from "./apiClient"
import { createApiExecutor } from "./createApiExecutor"
import { createSyncBatcher } from "./syncBatcher"

// /sync/v2 calls made at the same moment go out as one request (see syncBatcher)
export const executeApi = createSyncBatcher(createApiExecutor(apiClient))
