import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

import { useAppStore } from "../../../core/state/useAppStore";
import { handleLogout } from "../../Hooks/Logout";
import dayjs from "dayjs";

export default function VersionUpdateDialog() {
  const versionModal = useAppStore((s) => s.versionModal);

  const handleReload = async () => {
    try {
      if ("caches" in window) {
        const keys = await caches.keys();

        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch (error) {
      console.error(error);
    }

    window.location.reload();
  };

  return (
    <Dialog open={versionModal.open} disableEscapeKeyDown>
      <DialogTitle>New Version Available</DialogTitle>

      <DialogContent>
        <Typography>
          Current Version: {versionModal.currentVersion}
        </Typography>

        <Typography>
          Latest Version: {versionModal.latestVersion.Version}
        </Typography>
         <Typography>
          Deployed At: {dayjs(versionModal.latestVersion.DeployedAt).format("DD MMM YYYY")}
        </Typography>

        <Typography sx={{ mt: 2 }}>
          A new version has been deployed. Please reload the application.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button color="error" onClick={handleLogout}>
          Logout
        </Button>

        <Button variant="contained" onClick={handleReload}>
          Reload
        </Button>
      </DialogActions>
    </Dialog>
  );
}
