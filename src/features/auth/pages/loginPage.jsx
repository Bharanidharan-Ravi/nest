// import { TextField } from "@mui/material";
import Bowser from "bowser";
import { useState, useRef } from "react";
import "./loginPage.css";
import {
  Avatar,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  Container,
  Paper,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { styled } from "@mui/material/styles";
import { useMutation } from "@tanstack/react-query";
import { useAppStore } from "../../../core/state/useAppStore";
import { loginApi } from "../api/login.api";
import { useNavigate } from "react-router-dom";
import { ROLES } from "../../../core/auth/permissions";
import { jwtDecode } from "jwt-decode";

const YellowButton = styled(Button)(() => ({
  backgroundColor: "#f1c40f",
  color: "#000",
  fontWeight: "bold",
  textTransform: "none",
  "&:hover": {
    backgroundColor: "#d4ac0d",
  },
}));

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    remember: false,
  });
  const hasTyped = useRef(false);
  const navigate = useNavigate();
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [shakeField, setShakeField] = useState({
    username: false,
    password: false,
  });
  const userAgent = window.navigator.userAgent;
  const loginStore = useAppStore((s) => s.login);
  const syncClass = ()=>{
    const el = document.querySelector(".login-container");
    if (!el) return;
    if(hasTyped.current){
      el.classList.add("is-typing");
    }else {
      el.classList.remove("is-typing");
    }
  };
  
  const handleChange = (e, setValue, setError, fieldName, characterLimit) => {
    const { name, value, type, checked } = e.target;

    // Check length limit
    if (value.length <= characterLimit) {
      setValue(value);
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
      setError("");
      setShakeField({ ...shakeField, [name]: false }); // stop shaking if valid
      const u = name === "username" ? value : formData.username;
      const p = name === "password" ? value : formData.password;
      hasTyped.current = u.trim().length > 0 || p.trim().length > 0;
      syncClass();
    } else {
      setError(
        `Maximum ${characterLimit} characters allowed for ${fieldName}.`,
      );
      setShakeField({ ...shakeField, [name]: true }); // trigger shake
      setTimeout(() => setShakeField({ ...shakeField, [name]: false }), 300);
    }
  };
  const { mutate, isPending } = useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      loginStore(data);
      const encoded = jwtDecode(data);
      const role = encoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      if (Number(role) === ROLES.VIEWER) {
        navigate("/tickets");
      } else {
        navigate("/dashboard?module=dash_tickets");
      }
    },
  });
  //   onSuccess: (data) => {      
  //     loginStore(data); // store token
  //     navigate("/dashboard?module=dash_tickets");
  //   },
  // });

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
    // const result = await loginThunk(body);
    mutate(body);
    // if (result) {
    //   onLogin(result);
    // }
  };

  return (
    <Box
      className="login-container">
      <div className="login-panel login-panel--top-a" />
      <div className="login-panel login-panel--top-b" />
      <div className="login-panel login-panel--top-a" />
      <div className="login-panel login-panel--top-b" />

      <Container component="main" maxWidth="xs" className="login-center">
        <Paper
          elevation={10}
          className="login-paper">
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Box className="login-logo">
              <img src="/WORKGLOW LOGO.png" alt="logo-wg" className="login-logo-img" />
            </Box>

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: "100%" }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                className={shakeField.username ? "shake" : ""}
                value={formData.username}
                onChange={(e) =>
                  handleChange(
                    e,
                    (v) => setFormData({ ...formData, username: v }),
                    setUsernameError,
                    "Username",
                    20,
                  )
                }
                error={!!usernameError}
                helperText={usernameError}
                InputLabelProps={{ style: { color: "#000" } }}
                InputProps={{
                  style: { color: "#000", borderColor: "#f1c40f" },
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                className={shakeField.password ? "shake" : ""}
                autoComplete="current-password"
                value={formData.password}
                onChange={(e) =>
                  handleChange(
                    e,
                    (v) => setFormData({ ...formData, password: v }),
                    setPasswordError,
                    "Password",
                    30,
                  )
                }
                error={!!passwordError}
                helperText={passwordError}
                InputLabelProps={{ style: { color: "#000" } }}
                InputProps={{
                  style: { color: "#000", borderColor: "#f1c40f" },
                }}
              />
              <YellowButton
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.2, borderRadius: 2 }}
                disabled={isPending}
              >
                Sign In
              </YellowButton>

              <Grid container className="forgotpassword">
                <Grid size="grow">
                  <Typography variant="body2" sx={{ cursor: "pointer" }}>
                    Forgot password?
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;
