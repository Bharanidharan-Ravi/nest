// NEW FILE  (same folder as loginPage.jsx)
// Error / success messages are shown by apiClient as toasts, so nothing to handle here.
import { useEffect, useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";

const RESEND_COOLDOWN_SEC = 30;

const fmt = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

// The parent gives this component a new `key` whenever a new code is sent,
// so the timers and the input reset by themselves.
export default function OtpStep({
  maskedEmail,
  expiresInSeconds,
  onVerify,
  onResend,
  onBack,
  isVerifying,
  isResending,
}) {
  const [otp, setOtp] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(expiresInSeconds || 300);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SEC);

  useEffect(() => {
    const t = setInterval(() => {
      setSecondsLeft((s) => Math.max(s - 1, 0));
      setCooldown((c) => Math.max(c - 1, 0));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const expired = secondsLeft === 0;

  // digits only, max 6
  
  const handleChange = (e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otp.length === 6 && !expired) onVerify(otp);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} className="wg-form">
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
        Verify it's you
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
        We sent a 6-digit code to {maskedEmail}.
      </Typography>

      <TextField
        autoFocus
        fullWidth
        variant="standard"
        label="Enter OTP"
        value={otp}
        onChange={handleChange}
        autoComplete="one-time-code"
        inputProps={{
          inputMode: "numeric",
          maxLength: 6,
          style: { letterSpacing: "0.5em", fontSize: "1.4rem", textAlign: "center" },
        }}
      />

      <Typography
        variant="caption"
        sx={{ display: "block", mt: 1, mb: 2, color: expired ? "error.main" : "text.secondary" }}
      >
        {expired ? "Code expired. Please request a new one." : `Code expires in ${fmt(secondsLeft)}`}
      </Typography>

      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={isVerifying || expired || otp.length !== 6}
        sx={{
          backgroundColor: "#f1c40f",
          color: "#000",
          fontWeight: 700,
          textTransform: "none",
          fontSize: "0.95rem",
          boxShadow: "none",
          "&:hover": { backgroundColor: "#d4ac0d", boxShadow: "none" },
        }}
      >
        {isVerifying ? "Verifying…" : "Verify & Sign In"}
      </Button>

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
        <Button size="small" onClick={onResend} disabled={cooldown > 0 || isResending} sx={{ textTransform: "none" }}>
          {isResending ? "Sending…" : cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
        </Button>
        <Button size="small" onClick={onBack} sx={{ textTransform: "none" }}>
          Back to login
        </Button>
      </Box>
    </Box>
  );
}
