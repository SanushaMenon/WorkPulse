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

/* ── Colours (B&W) ───────────────────────────────────────────────────────── */
const C = {
  text: "#111111",
  muted: "#666666",
  muted2: "#999999",
  border: "#e0e0e0",
  bg: "#fafafa",
};

const inputSx = {
  "& .MuiOutlinedInput-root": {
    background: "#fff",
    borderRadius: "10px",
    fontSize: "14px",
    color: C.text,
    "& fieldset": { borderColor: C.border },
    "&:hover fieldset": { borderColor: "#999" },
    "&.Mui-focused fieldset": { borderColor: C.text },
  },
  "& .MuiInputLabel-root": { color: C.muted, fontSize: "13px" },
  "& .MuiInputLabel-root.Mui-focused": { color: C.text },
};

const menuProps = {
  PaperProps: {
    sx: {
      background: "#fff",
      border: `1px solid ${C.border}`,
      borderRadius: "10px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
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
  borderRadius: "10px",
  background: "#fff",
  fontSize: "13px",
  color: C.text,
  "& .MuiOutlinedInput-notchedOutline": { borderColor: C.border },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#999" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: C.text },
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
        <Typography sx={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: C.muted, mb: "8px", textAlign: "center" }}>
          Submit Review
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: "6px", textAlign: "center", color: C.text, letterSpacing: "-0.02em" }}>
          Performance Review
        </Typography>
        <Typography sx={{ color: C.muted2, fontSize: "13px", textAlign: "center", mb: "32px" }}>
          Submit a structured review for a team member. Your identity is auto-filled from login.
        </Typography>

        {/* Form card */}
        <Box sx={{
          background: "#fff",
          border: `1px solid ${C.border}`,
          borderRadius: "16px",
          p: { xs: "24px", md: "32px" },
          display: "flex", flexDirection: "column", gap: "20px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
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
                  "& .MuiRating-iconFilled": { color: C.text },
                  "& .MuiRating-iconEmpty": { color: "#ddd" },
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
            sx={{
              mt: "4px", py: "14px", borderRadius: "12px",
              background: C.text,
              color: "#fff", fontWeight: 700, fontSize: "14px",
              letterSpacing: "0", textTransform: "none",
              transition: "background 0.2s, transform 0.2s",
              "&:hover": { background: "#333", transform: "translateY(-1px)" },
              "&:disabled": { background: "#ccc", color: "#fff" },
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
