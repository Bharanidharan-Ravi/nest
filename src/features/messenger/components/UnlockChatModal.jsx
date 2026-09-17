import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import { CHAT_IDENTITY_STATUS, useChatIdentityStore } from "../e2ee/chatIdentityStore";

const MODE = { PASSWORD: "password", RECOVERY: "recovery" };

function describeError(err, mode) {
  switch (err?.name) {
    case "WrongSecretError":
      return mode === MODE.PASSWORD
        ? "That password didn't unlock chat. If you've reset your password since setting up chat, use your recovery code instead."
        : "That recovery code doesn't match this account. Check it and try again.";
    case "InvalidRecoveryCodeError":
    case "NoChatKeyError":
    case "MissingPasswordError":
      return err.message;
    default:
      return "Couldn't unlock chat. Check your connection and try again.";
  }
}

/**
 * Unlocks chat in this browser.
 * - LOCKED_NEED_RECOVERY: the password was reset — enter the recovery code; the key is
 *   re-wrapped under the current password.
 * - LOCKED_NEED_PASSWORD: the key isn't in this browser (e.g. site data cleared) — enter
 *   the password, or switch to the recovery code.
 * Closes only via "Not now" or a successful unlock.
 */
export default function UnlockChatModal() {
  const open = useChatIdentityStore((s) => s.unlockOpen);
  const status = useChatIdentityStore((s) => s.status);

  const isLocked =
    status === CHAT_IDENTITY_STATUS.LOCKED_NEED_PASSWORD ||
    status === CHAT_IDENTITY_STATUS.LOCKED_NEED_RECOVERY;

  return (
    <Dialog open={open && isLocked} maxWidth="xs" fullWidth>
      {/* Mounted fresh each time the dialog opens, so the form always starts empty */}
      {open && isLocked && (
        <UnlockChatForm
          key={status}
          needsRecovery={status === CHAT_IDENTITY_STATUS.LOCKED_NEED_RECOVERY}
        />
      )}
    </Dialog>
  );
}

function UnlockChatForm({ needsRecovery }) {
  const hasLoginPassword = useChatIdentityStore((s) => s.hasLoginPassword);
  const closeUnlock = useChatIdentityStore((s) => s.closeUnlock);
  const unlockWithPassword = useChatIdentityStore((s) => s.unlockWithPassword);
  const unlockWithRecoveryCode = useChatIdentityStore((s) => s.unlockWithRecoveryCode);

  const [mode, setMode] = useState(needsRecovery ? MODE.RECOVERY : MODE.PASSWORD);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Recovery re-wraps under the current password; ask for it when it wasn't kept from login
  const askNewPassword = mode === MODE.RECOVERY && !hasLoginPassword;
  const passwordsMismatch = confirmPassword.length > 0 && confirmPassword !== password;

  const canSubmit =
    !busy &&
    (mode === MODE.PASSWORD
      ? password.length > 0
      : recoveryCode.trim().length > 0 &&
        (!askNewPassword || (password.length > 0 && password === confirmPassword)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setError(null);
    try {
      if (mode === MODE.PASSWORD) {
        await unlockWithPassword(password);
      } else {
        await unlockWithRecoveryCode(recoveryCode, askNewPassword ? password : undefined);
      }
    } catch (err) {
      setError(describeError(err, mode));
    } finally {
      // On success the store closes the dialog and this form unmounts
      setBusy(false);
    }
  };

  const switchMode = (next) => {
    setMode(next);
    setError(null);
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <DialogTitle>Unlock secure chat</DialogTitle>

      <DialogContent>
        {mode === MODE.PASSWORD ? (
          <>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Enter your WGNest password to unlock your encrypted messages in this browser.
            </Typography>
            <TextField
              autoFocus
              fullWidth
              margin="dense"
              type="password"
              label="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
            />
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={() => switchMode(MODE.RECOVERY)}
              disabled={busy}
            >
              Reset your password? Use your recovery code
            </Link>
          </>
        ) : (
          <>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {needsRecovery
                ? "Your password has changed, so your encrypted messages are locked. Enter the recovery code you saved when you set up chat."
                : "Enter the recovery code you saved when you set up chat."}
            </Typography>
            <TextField
              autoFocus
              fullWidth
              margin="dense"
              label="Recovery code"
              placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
              autoComplete="off"
              spellCheck={false}
              inputProps={{ style: { fontFamily: "monospace", letterSpacing: "0.05em" } }}
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value)}
              disabled={busy}
            />

            {askNewPassword && (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                  Chat will be re-locked with your current WGNest password.
                </Typography>
                <TextField
                  fullWidth
                  margin="dense"
                  type="password"
                  label="Current password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                />
                <TextField
                  fullWidth
                  margin="dense"
                  type="password"
                  label="Confirm current password"
                  autoComplete="current-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={passwordsMismatch}
                  helperText={passwordsMismatch ? "Passwords don't match" : " "}
                  disabled={busy}
                />
              </>
            )}

            {!needsRecovery && (
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => switchMode(MODE.PASSWORD)}
                disabled={busy}
              >
                Use your password instead
              </Link>
            )}
          </>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {busy && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">
              Unlocking… this can take a few seconds.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={closeUnlock} disabled={busy}>
          Not now
        </Button>
        <Button type="submit" variant="contained" disabled={!canSubmit}>
          Unlock
        </Button>
      </DialogActions>
    </Box>
  );
}
