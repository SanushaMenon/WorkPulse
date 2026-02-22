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
          width: 400,
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.4)",
          borderRadius: "24px",
          p: "48px 40px",
          boxShadow: "0 24px 48px rgba(89, 126, 148, 0.08), 0 4px 12px rgba(0,0,0,0.03)",
        }}
      >
        {/* Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: "12px", mb: "36px" }}>
          <Box sx={{
            width: 42, height: 42, borderRadius: "12px",
            background: "linear-gradient(135deg, #4CA695 0%, #3A8576 100%)", display: "flex", alignItems: "center",
            justifyContent: "center", boxShadow: "0 6px 16px rgba(76, 166, 149, 0.25)"
          }}>
            <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "20px", fontFamily: "monospace", letterSpacing: "1px" }}>W</Typography>
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: "20px", color: "#597E94", letterSpacing: "-0.03em" }}>
            WorkPulse
          </Typography>
        </Box>

        <Typography sx={{ fontWeight: 800, fontSize: "28px", color: "#597E94", mb: "8px", letterSpacing: "-0.04em", lineHeight: 1.2 }}>
          Welcome back
        </Typography>
        <Typography sx={{ fontSize: "14px", color: "#597E9499", mb: "32px", fontWeight: 500 }}>
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
              borderRadius: "12px",
              background: "#fafafa",
              transition: "all 0.2s ease",
              "&:hover": { background: "#fff" },
              "&.Mui-focused": { background: "#fff", boxShadow: "0 0 0 3px rgba(76, 166, 149, 0.15)" },
              "&:hover fieldset": { borderColor: "#4CA695" },
              "&.Mui-focused fieldset": { borderColor: "#4CA695" },
            },
            "& label.Mui-focused": { color: "#4CA695", fontWeight: 600 },
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
              borderRadius: "12px",
              background: "#fafafa",
              transition: "all 0.2s ease",
              "&:hover": { background: "#fff" },
              "&.Mui-focused": { background: "#fff", boxShadow: "0 0 0 3px rgba(76, 166, 149, 0.15)" },
              "&:hover fieldset": { borderColor: "#4CA695" },
              "&.Mui-focused fieldset": { borderColor: "#4CA695" },
            },
            "& label.Mui-focused": { color: "#4CA695", fontWeight: 600 },
          }}
        />

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleLogin}
          disabled={loading}
          sx={{
            mt: 4,
            py: 1.6,
            background: "linear-gradient(135deg, #4CA695 0%, #3A8576 100%)",
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 700,
            fontSize: "15px",
            letterSpacing: "0.5px",
            boxShadow: "0 8px 20px rgba(76, 166, 149, 0.25)",
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            "&:hover": {
              background: "linear-gradient(135deg, #3A8576 0%, #2A6E60 100%)",
              transform: "translateY(-2px)",
              boxShadow: "0 12px 24px rgba(76, 166, 149, 0.35)",
            },
            "&.Mui-disabled": { background: "#ccc", color: "#fff", boxShadow: "none", transform: "none" },
          }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </Box>
    </Box>
  );
};

export default Login;
