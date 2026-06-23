import { executeApi } from "../../core/api/executor";
import { useAppStore } from "../../core/state/useAppStore";
import { APP_VERSION } from "../shared/Version";

 const AppVersionApi = async () => {
    return await executeApi({
      url: "/Version/app-version",
      method: "GET"
    });
  }

export const CheckVersion = async () => {
  const response = await AppVersionApi();
  return response;
};


export const versionChecker = async () => {
  try {
    const latestVersion = await CheckVersion();
    if (
      latestVersion !== APP_VERSION
    ) {

      useAppStore
        .getState()
        .showVersionModal({
          currentVersion:
            APP_VERSION,
          latestVersion,
        });

      return false;
    }

    return true;

  } catch (error) {

    console.error(
      "Version Check Failed",
      error
    );

    return true;
  }
};