import axios from "axios";
import { useUIStore } from "../state/useUIStore";
// import { useCustomStore } from "../store"

// const API_URL = "https://crm.canarahydraulics.com:8088/api";
const API_URL = import.meta.env.VITE_API_BASE_URL;
const environment = import.meta.env.VITE_ENVIRONMENT;
console.log("api :", API_URL, environment);

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 100000,
  headers: {
    "Content-Type": "application/json",
    
  },
});

let activeRequests = 0;
let loaderTimer = null;

const showLoader = () => {
  activeRequests++;
  
  if (activeRequests === 1) {
    // 🔥 Lowered from 300ms to 50ms so it shows up almost immediately
    loaderTimer = setTimeout(() => {
      useUIStore.getState().setLoading(true);
    }, 50); 
  }
};

const hideLoader = () => {
  activeRequests--;
  if (activeRequests <= 0) {
    activeRequests = 0;

    // If the request finished BEFORE 300ms, cancel the timer.
    // The loader will never flash on the screen!
    if (loaderTimer) {
      clearTimeout(loaderTimer);
      loaderTimer = null;
    }

    // Add a tiny 100ms buffer before telling the UI to hide it.
    // This ensures if a retry fires immediately, the loader doesn't flicker.
    setTimeout(() => {
      if (activeRequests === 0) {
        useUIStore.getState().setLoading(false);
      }
    }, 100);
  }
};

apiClient.interceptors.request.use(
  (config) => {
    // const { setGlobalLoading } = useCustomStore.getState();
    // if (!config._silent) setGlobalLoading(true);
    if (!config._silent) {
      showLoader();
      useUIStore.getState().clearMessages();
    }
    const userData = sessionStorage.getItem("user");

    const parsedUserData = userData ? JSON.parse(userData) : null;

    if (parsedUserData) {
      // config.headers["wg_token"] = parsedUserData;
       config.headers.Authorization = `Bearer ${parsedUserData}`;
    }
    // config.headers['wg_token'] = "x8m0nLLDf7Yc7AK7k/RocuFxxeNs5zN9KYZFwfoBZGr2N76UxEkMbjTc8JgI+ACdbCRBtWfUMOfG599LFMJZmbVyv1zS8NOXqM2PM69aOCOJ6/9DAAHtZvGBZqJaH+nLjkkvZnG9Gsf+oYpubRAZWtjsoPuaH94jkHj2f503eHJxnTWWJ4Lf6cCMct3/+8fIjsNbGb/yGIgaBbmSCXdUgKcRBIG0zOcFVs3HvxIjQS4gvAob1A/5/y7w0KPY7Y7ivVS/VGRv+lNafeQsDrnhBy620xICH2RwT6EfJmkpJ8UaigTmbOeU4uJ5F1iK0BRhRcxtYRcl33u1vlHPhtsw/4JvrluKxn0WHtI7/CmhGrrZTZJ1eYpISjUrs3K6GNJRxK/M/TddFFa4fCyzBQNqivs2a1dfIAHvW7rVpECOKfUijQ4qr74AAO1QIax8rzxm7mR2BPCUOFbcSxbxF7p0RztqvetN4px2p2ANjFnEoxIRpx78apCh4ZFqylbFV67gE+DEu73pqVz6E9BiHi/q3B6JjepJpble4NI+Tgte/lZCILgssO1M17wp6fxz8lXJgL9C1++yojQ8xgRMXZ1njIIbrP8R8r0yHJTi9ciZ7Tav9ohtAt9tLl2plFmEDD07"
    return config;
  },
  (error) => {
    hideLoader();
    useUIStore.getState().setError("Request initialization failed");
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response) => {
    if (!response.config._silent) hideLoader();
    // const { setGlobalLoading, setGlobalSuccess } = useCustomStore.getState();
    // setGlobalLoading(false);
    // const { code = 200, message = '', Data = null } = response?.data ?? {};
    // const method = response?.config?.method?.toUpperCase();
    const respData = response?.data ?? {};
    const code = respData.code ?? 200;
    const message = respData.message ?? "";
    const data = respData.Res ?? (respData.Res || null) ?? (respData.Data || null); // fallback to either Data or data

    const method = response?.config?.method?.toUpperCase();
    // console.log("response data :", response, data, respData);

    if (code >= 200 && code < 300) {
      if (
        message &&
        (method === "POST" || method === "PUT" || method === "DELETE") &&
        message !== "NO"
      ) {
        useUIStore.getState().setSuccess(message);
      }

      return data;
    }
    useUIStore.getState().setError(message || "An unexpected error occurred");
    return Promise.reject(new Error(message));
  },
  (error) => {
    console.log("error :", error.response);
    if (!error.config?._silent) hideLoader();

    const responseData = error.response?.data;
    let extractedErrorMessage = null;

    // 🔥 1. Try to parse the NEW nested Sync API error format dynamically
    if (responseData?.Res && typeof responseData.Res === "object") {
      // Loop through dynamic keys (like "ProjectListss")
      for (const [configKey, item] of Object.entries(responseData.Res)) {
        if (item?.Ok === false && item?.Err) {
          // Format it to show the Code, the Key, and the Message
          // Output example: "INVALID_CONFIG_KEY [ProjectListss]: Unknown key: ProjectListss"
          //   extractedErrorMessage = `${item.Err.C} [${configKey}]: ${item.Err.M}`;
          extractedErrorMessage = `${item.Err.M}`;
          break; // Stop at the first error found
        }
      }
    }

    // 🔥 2. Safely fallback to OLD error formats if the new one isn't found
    const errorMsg =
      extractedErrorMessage ||
      responseData?.message ||
      error.message ||
      "Something went wrong";
    useUIStore.getState().setError(errorMsg);
    return Promise.reject(error);
  },
);

export default apiClient;
