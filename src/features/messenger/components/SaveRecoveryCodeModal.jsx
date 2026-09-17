import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import { useChatIdentityStore } from "../e2ee/chatIdentityStore";

/**
 * Shown once, right after the chat key is created. The code can't be shown
 * again, so the dialog can't be dismissed until the user has copied it and
 * confirmed they saved it.
 */
export default function SaveRecoveryCodeModal() {
  const code = useChatIdentityStore((s) => s.pendingRecoveryCode);
  const acknowledge = useChatIdentityStore((s) => s.acknowledgeRecoveryCode);

  return (
    <Dialog open={!!code} disableEscapeKeyDown maxWidth="xs" fullWidth>
      {/* keyed so a different code always starts with nothing copied or confirmed */}
      {code && <RecoveryCodeContent key={code} code={code} onDone={acknowledge} />}
    </Dialog>
  );
}

function RecoveryCodeContent({ code, onDone }) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setCopyFailed(false);
    } catch {
      setCopyFailed(true);
    }
  };

  return (
    <>
      <DialogTitle>Save your chat recovery code</DialogTitle>

      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Your messages are end-to-end encrypted. If you forget or reset your WGNest password,
          this code is the only way to unlock your chat history. We can't recover it for you.
        </Typography>

        <Box
          sx={{
            fontFamily: "monospace",
            fontSize: "1.25rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textAlign: "center",
            py: 2,
            px: 1,
            borderRadius: 1,
            bgcolor: "grey.100",
            border: "1px dashed",
            borderColor: "grey.400",
            userSelect: "all",
            wordBreak: "break-all",
          }}
        >
          {code}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "center", mt: 1.5 }}>
          <Button
            variant={copied ? "outlined" : "contained"}
            color={copied ? "success" : "primary"}
            startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
            onClick={handleCopy}
          >
            {copied ? "Copied" : "Copy code"}
          </Button>
        </Box>

        {copyFailed && (
          <Alert severity="warning" sx={{ mt: 1.5 }}>
            Couldn't copy automatically. Select the code above and copy it manually.
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Store it somewhere safe, like a password manager. This is the only time it will be shown.
        </Typography>

        <FormControlLabel
          sx={{ mt: 1 }}
          control={<Checkbox checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />}
          label="I have saved my recovery code"
        />
      </DialogContent>

      <DialogActions>
        <Button
          variant="contained"
          disabled={!(confirmed && (copied || copyFailed))}
          onClick={onDone}
        >
          Done
        </Button>
      </DialogActions>
    </>
  );
}
