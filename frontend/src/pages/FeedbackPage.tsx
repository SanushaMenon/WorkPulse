import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Rating,
  Select,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { submitFeedback } from "../api";

const DEPARTMENTS = ["Engineering", "Product", "Design", "Marketing", "Sales", "HR", "Finance", "Operations"];
const REVIEW_PERIODS = ["Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025", "Q1 2026", "Q2 2026"];

const C = {
  text: "#597E94",
  muted: "#597E94cc", // 80% opacity slate
  muted2: "#597E9499", // 60% opacity slate
  border: "#597E9433", // 20% opacity slate
  bg: "#F4F1E1", // Cream
};

const inputSx = {
  "& .MuiOutlinedInput-root": {
    background: "#fafafa",
    borderRadius: "12px",
    fontSize: "14px",
    color: C.text,
    transition: "all 0.2s ease",
    "& fieldset": { borderColor: C.border },
    "&:hover": { background: "#fff" },
    "&:hover fieldset": { borderColor: "#4CA695" },
    "&.Mui-focused": { background: "#fff", boxShadow: "0 0 0 3px rgba(76, 166, 149, 0.15)" },
    "&.Mui-focused fieldset": { borderColor: "#4CA695" },
  },
  "& .MuiInputLabel-root": { color: C.muted, fontSize: "13px" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#4CA695", fontWeight: 600 },
};

const menuProps = {
  PaperProps: {
    sx: {
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(16px)",
      border: `1px solid rgba(89, 126, 148, 0.15)`,
      borderRadius: "12px",
      boxShadow: "0 12px 40px rgba(89, 126, 148, 0.12)",
      "& .MuiMenuItem-root": {
        fontSize: "13px",
        color: C.text,
        "&:hover": { background: "#f5f5f5" },
        "&.Mui-selected": { background: "#f0f0f0", fontWeight: 600 },
      },
    },
  },
};

const selectSx = {
  borderRadius: "12px",
  background: "#fafafa",
  fontSize: "13px",
  color: C.text,
  transition: "all 0.2s ease",
  "& .MuiOutlinedInput-notchedOutline": { borderColor: C.border },
  "&:hover": { background: "#fff" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#4CA695" },
  "&.Mui-focused": { background: "#fff", boxShadow: "0 0 0 3px rgba(76, 166, 149, 0.15)" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#4CA695" },
  "& .MuiSvgIcon-root": { color: C.muted },
};

function SectionLabel({ text }: { text: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <Box sx={{ width: 3, height: 14, borderRadius: "2px", background: C.text }} />
      <Typography sx={{
        fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase",
        color: C.muted, fontWeight: 700,
      }}>
        {text}
      </Typography>
    </Box>
  );
}

const FeedbackPage: React.FC = () => {
  const [form, setForm] = useState({
    employeeName: "", employeeEmail: "",
    department: "", reviewPeriod: "", rating: 3, strengths: "", improvements: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    if (!form.employeeName || !form.strengths) {
      setError("Please fill in all required fields.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const message = `Employee: ${form.employeeName}. Department: ${form.department || "N/A"}. Period: ${form.reviewPeriod || "N/A"}. Rating: ${form.rating}/5. Strengths: ${form.strengths}. Areas for improvement: ${form.improvements || "None specified."}`;
      await submitFeedback({
        employeeName: form.employeeName,
        employeeEmail: form.employeeEmail,
        department: form.department,
        reviewPeriod: form.reviewPeriod,
        rating: form.rating,
        message,
      });
      setSuccess(true);
      setForm({ employeeName: "", employeeEmail: "", department: "", reviewPeriod: "", rating: 3, strengths: "", improvements: "" });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        * { font-family: 'Inter', sans-serif; }
      `}</style>

      <Box sx={{ maxWidth: 580, mx: "auto", animation: "slideUp 0.4s ease both" }}>

        {/* Header */}
        <Typography sx={{ fontSize: "12px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#4CA695", mb: "10px", textAlign: "center", fontWeight: 800 }}>
          Submit Review
        </Typography>
        <Typography variant="h3" sx={{
          fontWeight: 800, mb: "8px", textAlign: "center",
          letterSpacing: "-0.03em",
          background: "linear-gradient(135deg, #597E94 0%, #4CA695 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
        }}>
          Performance Review
        </Typography>
        <Typography sx={{ color: C.muted2, fontSize: "14px", textAlign: "center", mb: "36px", fontWeight: 500 }}>
          Submit a structured review for a team member. Your identity is auto-filled from login.
        </Typography>

        {/* Form card */}
        <Box sx={{
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(16px)",
          border: `1px solid rgba(255,255,255,0.4)`,
          borderRadius: "24px",
          p: { xs: "24px", md: "40px" },
          display: "flex", flexDirection: "column", gap: "24px",
          boxShadow: "0 24px 48px rgba(89, 126, 148, 0.08), 0 4px 12px rgba(0,0,0,0.03)",
        }}>
          <SectionLabel text="Employee Being Reviewed" />

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <TextField
              label="Employee Name *" value={form.employeeName}
              onChange={e => set("employeeName", e.target.value)}
              fullWidth sx={inputSx} placeholder="Full name"
            />
            <TextField
              label="Employee Email" value={form.employeeEmail}
              onChange={e => set("employeeEmail", e.target.value)}
              fullWidth sx={inputSx} placeholder="employee@company.com"
            />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <Select
              value={form.department} onChange={e => set("department", e.target.value)}
              displayEmpty fullWidth MenuProps={menuProps}
              sx={{ ...selectSx, color: form.department ? C.text : C.muted2 }}
              renderValue={v => v || <span style={{ color: C.muted2, fontSize: "13px" }}>Department</span>}
            >
              {DEPARTMENTS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </Select>
            <Select
              value={form.reviewPeriod} onChange={e => set("reviewPeriod", e.target.value)}
              displayEmpty fullWidth MenuProps={menuProps}
              sx={{ ...selectSx, color: form.reviewPeriod ? C.text : C.muted2 }}
              renderValue={v => v || <span style={{ color: C.muted2, fontSize: "13px" }}>Review Period</span>}
            >
              {REVIEW_PERIODS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </Select>
          </Box>

          <Box sx={{ height: "1px", background: C.border }} />
          <SectionLabel text="Review Details" />

          <Box>
            <Typography sx={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, mb: "10px", fontWeight: 700 }}>
              Overall Performance Rating
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Rating
                value={form.rating} onChange={(_, v) => set("rating", v || 1)}
                sx={{
                  "& .MuiRating-iconFilled": { color: "#4CA695" },
                  "& .MuiRating-iconEmpty": { color: C.border },
                }}
              />
              <Typography sx={{ fontSize: "13px", color: C.muted, fontWeight: 600 }}>{form.rating} / 5</Typography>
            </Box>
          </Box>

          <TextField
            label="Key Strengths *" value={form.strengths}
            onChange={e => set("strengths", e.target.value)}
            multiline rows={3} fullWidth sx={inputSx}
            placeholder="What does this employee do exceptionally well?"
          />

          <TextField
            label="Areas for Improvement" value={form.improvements}
            onChange={e => set("improvements", e.target.value)}
            multiline rows={3} fullWidth sx={inputSx}
            placeholder="What should this employee focus on developing?"
          />

          {error && (
            <Alert severity="error" sx={{ borderRadius: "10px", fontSize: "13px" }}>
              {error}
            </Alert>
          )}

          <Button
            onClick={handleSubmit} disabled={loading} fullWidth
            variant="contained"
            size="large"
            sx={{
              mt: "12px", py: 1.6, borderRadius: "12px",
              background: "linear-gradient(135deg, #4CA695 0%, #3A8576 100%)",
              color: "#fff", fontWeight: 700, fontSize: "15px",
              letterSpacing: "0.5px", textTransform: "none",
              boxShadow: "0 8px 20px rgba(76, 166, 149, 0.25)",
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              "&:hover": {
                background: "linear-gradient(135deg, #3A8576 0%, #2A6E60 100%)",
                transform: "translateY(-2px)",
                boxShadow: "0 12px 24px rgba(76, 166, 149, 0.35)",
              },
              "&:disabled": { background: "#ccc", color: "#fff", boxShadow: "none", transform: "none" },
            }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Submit Review"}
          </Button>
        </Box>
      </Box>

      <Snackbar open={success} autoHideDuration={4000} onClose={() => setSuccess(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity="success" sx={{ borderRadius: "10px" }}>
          Review submitted successfully! AI analysis will begin shortly.
        </Alert>
      </Snackbar>
    </>
  );
};

export default FeedbackPage;
