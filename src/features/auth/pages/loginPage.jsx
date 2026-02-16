// import { TextField } from "@mui/material";
import Bowser from "bowser";
import { useEffect, useRef, useState } from "react";
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

const YellowButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#f1c40f",
  color: "#000",
  fontWeight: "bold",
  textTransform: "none",
  "&:hover": {
    backgroundColor: "#d4ac0d",
  },
}));

const LoginPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    remember: false,
  });
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

    // Check length limit
    if (value.length <= characterLimit) {
      setValue(value);
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
      setError("");
      setShakeField({ ...shakeField, [name]: false }); // stop shaking if valid
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
      console.log("data", data.Data);
      loginStore(data.Data); // store token
      navigate("/dashboard");
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
    // const result = await loginThunk(body);
    mutate(body);
    // if (result) {
    //   onLogin(result);
    // }
  };

  return (
    <Box
      className="login-container"
      // sx={{
      //   background: 'linear-gradient(135deg, #000000, #1c1c1c)',
      //   height: '100vh',
      //   display: 'flex',
      //   alignItems: 'center',
      //   justifyContent: 'center',
      // }}
    >
      <Container component="main" maxWidth="xs">
        <Paper
          elevation={10}
          className="login-paper"
          // sx={{
          //   p: 4,
          //   borderRadius: 4,
          //   backgroundColor: '#121212',
          //   color: '#fff',
          // }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: "#f1c40f" }}>
              <LockOutlinedIcon sx={{ color: "#000" }} />
            </Avatar>
            <Typography
              component="h1"
              variant="h5"
              sx={{ fontWeight: "bold", mb: 2 }}
            >
              Sign In
            </Typography>

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
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

              {/* <FormControlLabel
                  control={
                    <Checkbox
                      name="remember"
                      color="default"
                      checked={formData.remember}
                      onChange={handleChange}
                      sx={{
                        color: '#f1c40f',
                        '&.Mui-checked': { color: '#f1c40f' },
                      }}
                    />
                  }
                  label="Remember me"
                /> */}
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
