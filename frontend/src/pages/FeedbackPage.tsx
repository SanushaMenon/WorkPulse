import React, { useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, CircularProgress,
  Collapse, Divider, Stack, TextField, ToggleButton,
  ToggleButtonGroup, Typography,
} from "@mui/material";
import PersonIcon  from "@mui/icons-material/Person";
import GroupsIcon  from "@mui/icons-material/Groups";
import LockIcon    from "@mui/icons-material/Lock";
import { submitFeedback } from "../api";
import { useAuth } from "../auth/AuthContext";

type FeedbackType = "self" | "peer";

const FeedbackPage: React.FC = () => {
  const { user } = useAuth();

  const [feedbackType, setFeedbackType] = useState<FeedbackType>("self");
  const [message, setMessage]           = useState("");
  const [targetName, setTargetName]     = useState("");
  const [targetEmail, setTargetEmail]   = useState("");
  const [loading, setLoading]           = useState(false);
  const [success, setSuccess]           = useState<string | null>(null);
  const [error, setError]               = useState<string | null>(null);

  const handleTypeChange = (_: React.MouseEvent, val: FeedbackType | null) => {
    if (val) { setFeedbackType(val); setSuccess(null); setError(null); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    if (!message.trim()) { setError("Please enter your feedback."); return; }
    if (message.trim().length > 2000) { setError("Feedback must be 2000 characters or fewer."); return; }
    if (feedbackType === "peer") {
      if (!targetName.trim() || !targetEmail.trim()) { setError("Please enter your colleague's name and email."); return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(targetEmail.trim())) { setError("Please enter a valid email address."); return; }
      if (targetEmail.trim().toLowerCase() === user?.email?.toLowerCase()) { setError("You cannot submit a peer review about yourself."); return; }
    }
    try {
      setLoading(true);
      const payload = feedbackType === "peer"
        ? { message: message.trim(), targetName: targetName.trim(), targetEmail: targetEmail.trim() }
        : { message: message.trim() };
      await submitFeedback(payload);
      setSuccess(feedbackType === "peer"
        ? `Your feedback about ${targetName.trim()} has been submitted anonymously.`
        : "Feedback submitted! Our AI is analyzing it for your Growth Roadmap.");
      setMessage(""); setTargetName(""); setTargetEmail("");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth={640} mx="auto">
      <Typography variant="h4" gutterBottom sx={{ color: "#2C3A3A" }}>
        Submit Feedback
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Share how you feel at work, or give a colleague anonymous feedback.
      </Typography>

      {/* Toggle */}
      <ToggleButtonGroup
        value={feedbackType} exclusive onChange={handleTypeChange}
        sx={{ mt: 2, mb: 3 }} size="small"
      >
        {[
          { val: "self", icon: <PersonIcon sx={{ mr: 0.75, fontSize: 17 }} />, label: "My Work Experience" },
          { val: "peer", icon: <GroupsIcon sx={{ mr: 0.75, fontSize: 17 }} />, label: "About a Colleague" },
        ].map(({ val, icon, label }) => (
          <ToggleButton
            key={val} value={val}
            sx={{
              px: 2.5, fontSize: "13px", fontWeight: 600, borderRadius: "10px !important",
              border: "1px solid #D8D2C8 !important",
              color: feedbackType === val ? "#FAF8F4" : "#5A7070",
              backgroundColor: feedbackType === val ? "#3D9E8C" : "transparent",
              "&.Mui-selected": { backgroundColor: "#3D9E8C", color: "#FAF8F4" },
              "&.Mui-selected:hover": { backgroundColor: "#348a7a" },
              "&:hover": { backgroundColor: "rgba(61,158,140,0.08)" },
              mr: 1,
            }}
          >
            {icon}{label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              {success && <Alert severity="success" sx={{ borderRadius: "10px" }}>{success}</Alert>}
              {error   && <Alert severity="error"   sx={{ borderRadius: "10px" }}>{error}</Alert>}

              {/* Submitting as */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "11px" }}>
                  Submitting as
                </Typography>
                <Stack direction="row" spacing={1.5}>
                  <TextField label="Your Name"  value={user?.name  ?? ""} fullWidth disabled size="small" helperText="From your company account" />
                  <TextField label="Your Email" value={user?.email ?? ""} fullWidth disabled size="small" helperText="From your company account" />
                </Stack>
              </Box>

              {/* Peer fields */}
              <Collapse in={feedbackType === "peer"} unmountOnExit>
                <Box>
                  <Divider sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">Colleague (recipient)</Typography>
                  </Divider>
                  <Alert severity="info" icon={<LockIcon fontSize="small" />} sx={{ mb: 2, borderRadius: "10px" }}>
                    Your identity is completely anonymous to your colleague.
                  </Alert>
                  <Stack direction="row" spacing={1.5}>
                    <TextField label="Colleague's Name"       value={targetName}  onChange={e => setTargetName(e.target.value)}  fullWidth required={feedbackType === "peer"} size="small" />
                    <TextField label="Colleague's Work Email" value={targetEmail} onChange={e => setTargetEmail(e.target.value)} fullWidth required={feedbackType === "peer"} size="small" type="email" />
                  </Stack>
                </Box>
              </Collapse>

              {/* Message */}
              <TextField
                label={feedbackType === "peer" ? `Feedback about ${targetName || "your colleague"}` : "How are you feeling at work?"}
                value={message} onChange={e => setMessage(e.target.value)}
                fullWidth required multiline minRows={4}
                inputProps={{ maxLength: 2000 }}
                helperText={`${message.length} / 2000 characters`}
                placeholder={feedbackType === "peer"
                  ? "Share specific observations about their work, collaboration, or impact..."
                  : "Share how you're feeling — workload, team dynamics, career growth..."}
              />

              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  type="submit" variant="contained" color="primary"
                  disabled={loading} size="large"
                  sx={{ px: 3, py: "10px", borderRadius: "10px" }}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
                >
                  {loading ? "Submitting…" : feedbackType === "peer" ? "Send Anonymously" : "Submit Feedback"}
                </Button>
              </Box>
            </Stack>
          </form>
        </CardContent>
      </Card>

      {feedbackType === "self" && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
          💡 Your self-feedback powers your <strong>Growth Plan</strong>. Submit at least 2 to unlock it.
        </Typography>
      )}
    </Box>
  );
};

export default FeedbackPage;