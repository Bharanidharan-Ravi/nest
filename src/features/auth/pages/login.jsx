import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { loginApi } from "../api/login.api";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../../core/state/useAppStore";
import Bowser from "bowser";

export default function Login() {
  const navigate = useNavigate();
  const loginStore = useAppStore((s) => s.login);
  const userAgent = window.navigator.userAgent;

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
        loginStore(data); // store token
        navigate("/dashboard?module=tickets");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const browser = Bowser.getParser(userAgent);
    const body = {
      username: form.username,
      password: form.password,
      DeviceInfo: JSON.stringify(browser.parsedResult),
    };
    mutate(body);
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Username"
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button disabled={isPending}>Login</button>
      </form>
    </div>
  );
}
