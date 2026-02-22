import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { signIn } from "./auth";

const Login: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(username.trim(), password);
      navigate("/");
    } catch (e: any) {
      setError(e?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="80vh"
      sx={{ background: "transparent" }}
    >
      <Box
        sx={{
          width: 380,
          background: "#fff",
          border: "1px solid #e0e0e0",
          borderRadius: "16px",
          p: "40px 36px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
        }}
      >
        {/* Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: "10px", mb: "32px" }}>
          <Box sx={{
            width: 38, height: 38, borderRadius: "10px",
            background: "#111", display: "flex", alignItems: "center",
            justifyContent: "center",
          }}>
            <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "16px", fontFamily: "monospace" }}>W</Typography>
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: "18px", color: "#111", letterSpacing: "-0.02em" }}>
            WorkPulse
          </Typography>
        </Box>

        <Typography sx={{ fontWeight: 700, fontSize: "22px", color: "#111", mb: "6px" }}>
          Sign in
        </Typography>
        <Typography sx={{ fontSize: "13px", color: "#888", mb: "28px" }}>
          Enter your credentials to access your workspace.
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2.5, fontSize: "13px", borderRadius: "10px" }}
          >
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Email"
          type="email"
          variant="outlined"
          margin="normal"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "10px",
              "&:hover fieldset": { borderColor: "#111" },
              "&.Mui-focused fieldset": { borderColor: "#111" },
            },
            "& label.Mui-focused": { color: "#111" },
          }}
        />

        <TextField
          fullWidth
          label="Password"
          type="password"
          variant="outlined"
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "10px",
              "&:hover fieldset": { borderColor: "#111" },
              "&.Mui-focused fieldset": { borderColor: "#111" },
            },
            "& label.Mui-focused": { color: "#111" },
          }}
        />

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleLogin}
          disabled={loading}
          sx={{
            mt: 3,
            py: 1.5,
            background: "#111",
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "15px",
            letterSpacing: "0",
            "&:hover": { background: "#333" },
            "&.Mui-disabled": { background: "#ccc", color: "#fff" },
          }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </Box>
    </Box>
  );
};

export default Login;
