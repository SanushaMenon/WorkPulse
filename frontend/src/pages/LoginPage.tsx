import React, { useState } from "react";
import {
  Alert, Box, Button, CircularProgress, Stack, TextField, Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const LoginPage: React.FC = () => {
  const { signIn, confirmNewPassword } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [needsNewPassword, setNeedsNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn(username.trim(), password);
      if (result.needsNewPassword) setNeedsNewPassword(true);
      else navigate("/", { replace: true });
    } catch (err: any) {
      setError(err?.message ?? "Sign in failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await confirmNewPassword(newPassword);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err?.message ?? "Failed to set new password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", backgroundColor: "#F0EDE6",
    }}>
      <Box sx={{ width: "100%", maxWidth: 420, mx: 2 }}>

        {/* Logo */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box sx={{
            width: 52, height: 52, borderRadius: "14px",
            backgroundColor: "#3D9E8C",
            display: "flex", alignItems: "center", justifyContent: "center",
            mx: "auto", mb: 2,
            boxShadow: "0 4px 16px rgba(61,158,140,0.3)",
          }}>
            <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "22px" }}>WP</Typography>
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: "22px", color: "#2C3A3A", letterSpacing: "-0.02em" }}>
            WorkPulse
          </Typography>
          <Typography sx={{ fontSize: "14px", color: "#5A7070", mt: 0.5 }}>
            {needsNewPassword ? "Set a new password to continue" : "Employee feedback, simplified."}
          </Typography>
        </Box>

        {/* Card */}
        <Box sx={{
          backgroundColor: "#FAF8F4",
          border: "1px solid #E8E2D9",
          borderRadius: "18px",
          p: "32px",
          boxShadow: "0 2px 16px rgba(44,58,58,0.07)",
        }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: "10px", fontSize: "13px" }}>
              {error}
            </Alert>
          )}

          {!needsNewPassword ? (
            <form onSubmit={handleSignIn}>
              <Stack spacing={2}>
                <TextField
                  label="Email / Username" value={username}
                  onChange={e => setUsername(e.target.value)}
                  fullWidth required autoFocus autoComplete="username"
                />
                <TextField
                  label="Password" type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  fullWidth required autoComplete="current-password"
                />
                <Button
                  type="submit" variant="contained" color="primary"
                  size="large" fullWidth disabled={loading}
                  sx={{ mt: 0.5, py: "12px", borderRadius: "10px", fontSize: "14px" }}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
                >
                  {loading ? "Signing in…" : "Sign In"}
                </Button>
              </Stack>
            </form>
          ) : (
            <form onSubmit={handleNewPassword}>
              <Stack spacing={2}>
                <TextField
                  label="New Password" type="password" value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  fullWidth required autoFocus autoComplete="new-password"
                  helperText="Min. 12 chars — uppercase, number, and symbol required."
                />
                <Button
                  type="submit" variant="contained" color="primary"
                  size="large" fullWidth disabled={loading}
                  sx={{ py: "12px", borderRadius: "10px", fontSize: "14px" }}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
                >
                  {loading ? "Setting password…" : "Set Password & Continue"}
                </Button>
              </Stack>
            </form>
          )}
        </Box>

        <Typography sx={{ textAlign: "center", fontSize: "12px", color: "#9AADA8", mt: 3 }}>
          Secured by AWS Cognito
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginPage;