import Bowser from "bowser";
import { useState } from "react";
import "./loginPage.css";
import {
  Button,
  TextField,
  Box,
  Typography,
  Container,
  Paper,
  IconButton,
  InputAdornment,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { styled } from "@mui/material/styles";
import { useMutation } from "@tanstack/react-query";
import { useAppStore } from "../../../core/state/useAppStore";
import { loginApi } from "../api/login.api";
import { useNavigate } from "react-router-dom";
import { ROLES } from "../../../core/auth/permissions";
import { jwtDecode } from "jwt-decode";
import { useChatIdentityStore } from "../../messenger/e2ee/chatIdentityStore";

const YellowButton = styled(Button)(() => ({
  backgroundColor: "#f1c40f",
  color: "#000",
  fontWeight: 700,
  textTransform: "none",
  fontSize: "0.95rem",
  boxShadow: "none",
  "&:hover": {
    backgroundColor: "#d4ac0d",
    boxShadow: "none",
  },
}));

const tickets = [
  { id: "#1039", title: "Login issue has been resolved", status: "resolved" },
  { id: "#1041", title: "Dashboard widget overlaps on mobile", status: "progress" },
  { id: "#1042", title: "Add-on has been deployed in live.", status: "open" },
];

const statusLabel = {
  open: "Open",
  progress: "In progress",
  resolved: "Resolved",
};

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    remember: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [shakeField, setShakeField] = useState({
    username: false,
    password: false,
  });
  const userAgent = window.navigator.userAgent;
  const loginStore = useAppStore((s) => s.login);

  const handleChange = (e, setValue, setError, fieldName, characterLimit) => {
    const { name, value, type, checked } = e.target;

    if (value.length <= characterLimit) {
      setValue(value);
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
      setError("");
      setShakeField((prev) => ({ ...prev, [name]: false }));
    } else {
      setError(`Maximum ${characterLimit} characters allowed for ${fieldName}.`);
      setShakeField((prev) => ({ ...prev, [name]: true }));
      setTimeout(() => setShakeField((prev) => ({ ...prev, [name]: false })), 300);
    }
  };

  const { mutate, isPending } = useMutation({
    mutationFn: loginApi,
    onSuccess: (data, variables) => {
      loginStore(data);
      const encoded = jwtDecode(data);
      const role = encoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      const userId = encoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
      if (userId) {
        useChatIdentityStore.getState().initializeAfterLogin({ userId, password: variables.password });
      }
      if (Number(role) === ROLES.VIEWER) {
        navigate("/tickets");
      } else {
        navigate("/dashboard?module=dash_tickets");
      }
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    let hasError = false;

    if (!formData.username.trim()) {
      setUsernameError("Username is required.");
      hasError = true;
    } else {
      setUsernameError("");
    }

    if (!formData.password.trim()) {
      setPasswordError("Password is required.");
      hasError = true;
    } else {
      setPasswordError("");
    }

    if (hasError) return;

    const browser = Bowser.getParser(userAgent);
    const body = {
      username: formData.username,
      password: formData.password,
      DeviceInfo: JSON.stringify(browser.parsedResult),
    };
    mutate(body);
  };

  return (
    <Box className="wg-page">
      {/* Left hero panel */}
      <Box className="wg-hero">
        <Box className="wg-hero-mark">
          <span className="wg-hero-wordmark"></span>
        </Box>

        <Box className="wg-hero-copy">
          <Typography component="h1" className="wg-hero-heading">
            Task management designed for seamless collaboration.
          </Typography>
          <Typography className="wg-hero-sub">
            Track, assign, and resolve issues without losing the thread.
          </Typography>
        </Box>

        <Box className="wg-ticket-stack" aria-hidden="true">
          {tickets.map((t, i) => (
            <Box key={t.id} className={`wg-ticket-card wg-ticket-card--${i}`}>
              <Box className="wg-ticket-row">
                <span className="wg-ticket-id">{t.id}</span>
                <span className={`wg-status wg-status--${t.status}`}>
                  {t.status === "progress" && <span className="wg-status-dot" />}
                  {statusLabel[t.status]}
                </span>
              </Box>
              <Box className="wg-ticket-title">{t.title}</Box>
            </Box>
          ))}
        </Box>

        <Typography className="wg-hero-footer">
          © {new Date().getFullYear()} WorkGlow Solutions. Every ticket, tracked.
        </Typography>
      </Box>

      {/* Right form panel */}
      <Box className="wg-form-panel">
        <Container component="main" maxWidth="xs" className="wg-form-container">
          <Paper elevation={0} className="wg-form-paper">
            <Box className="wg-mobile-mark">
              <span className="wg-owl wg-owl--dark" aria-hidden="true">
                <span className="wg-owl-eye" />
                <span className="wg-owl-eye" />
              </span>
              <span className="wg-mobile-wordmark">WorkGlow</span>
            </Box>

            <Box className="login-logo">
              <img src="/WORKGLOW LOGO.png" alt="logo-wg" className="login-logo-img" />
            </Box>
            <Box className="login-logo-divider" />

            <Box component="form" onSubmit={handleSubmit} className="wg-form">
              <TextField
                variant="standard"
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                className={`wg-field ${shakeField.username ? "shake" : ""}`}
                value={formData.username}
                onChange={(e) =>
                  handleChange(
                    e,
                    (v) => setFormData((prev) => ({ ...prev, username: v })),
                    setUsernameError,
                    "Username",
                    20,
                  )
                }
                error={!!usernameError}
                helperText={usernameError}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon className="wg-field-icon" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                variant="standard"
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                id="password"
                className={`wg-field ${shakeField.password ? "shake" : ""}`}
                autoComplete="current-password"
                value={formData.password}
                onChange={(e) =>
                  handleChange(
                    e,
                    (v) => setFormData((prev) => ({ ...prev, password: v })),
                    setPasswordError,
                    "Password",
                    30,
                  )
                }
                error={!!passwordError}
                helperText={passwordError}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon className="wg-field-icon" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? (
                          <VisibilityOffIcon className="wg-field-icon" fontSize="small" />
                        ) : (
                          <VisibilityIcon className="wg-field-icon" fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <YellowButton
                type="submit"
                fullWidth
                variant="contained"
                className="wg-submit"
                disabled={isPending}
              >
                {isPending ? "Signing in…" : "Sign In"}
              </YellowButton>

              {/* <Box className="wg-forgot-row">
                <Typography variant="body2" className="wg-forgot">
                  Forgot password?
                </Typography>
              </Box> */}
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default LoginPage;