import React, { useEffect, useState } from "react";
import {
  Alert, Box, Card, CardContent, Chip, CircularProgress,
  Divider, Stack, Typography,
} from "@mui/material";
import LockIcon                    from "@mui/icons-material/Lock";
import SentimentSatisfiedAltIcon   from "@mui/icons-material/SentimentSatisfiedAlt";
import SentimentDissatisfiedIcon   from "@mui/icons-material/SentimentDissatisfied";
import SentimentNeutralIcon        from "@mui/icons-material/SentimentNeutral";
import InboxIcon                   from "@mui/icons-material/Inbox";
import { fetchMyReviews, ReviewItem } from "../api";

function SentimentChip({ value }: { value: string | null }) {
  if (!value) return null;
  const cfg: Record<string, { color: "success" | "error" | "warning"; icon: React.ReactElement }> = {
    positive: { color: "success", icon: <SentimentSatisfiedAltIcon fontSize="small" /> },
    negative: { color: "error",   icon: <SentimentDissatisfiedIcon fontSize="small" /> },
    neutral:  { color: "warning", icon: <SentimentNeutralIcon      fontSize="small" /> },
  };
  const c = cfg[value.toLowerCase()] ?? cfg.neutral;
  return (
    <Chip
      icon={c.icon} label={value.charAt(0).toUpperCase() + value.slice(1)}
      color={c.color} size="small" variant="outlined"
      sx={{ borderRadius: "8px" }}
    />
  );
}

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return iso.slice(0, 10); }
}

const MyReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchMyReviews();
        setReviews(data.reviews);
        setTotal(data.totalReviews);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load reviews.");
      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <Box maxWidth={760} mx="auto">
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
        <Typography variant="h4" sx={{ color: "#2C3A3A" }}>Feedback About Me</Typography>
        {!loading && total > 0 && (
          <Chip label={`${total} review${total === 1 ? "" : "s"}`} size="small"
            sx={{ backgroundColor: "rgba(61,158,140,0.12)", color: "#3D9E8C", fontWeight: 700 }} />
        )}
        <Chip
          icon={<LockIcon sx={{ fontSize: 14 }} />} label="Submitters are anonymous"
          size="small" variant="outlined" color="success" sx={{ borderRadius: "8px" }}
        />
      </Box>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Anonymous peer feedback your colleagues have submitted about you.
      </Typography>

      <Alert severity="info" icon={<LockIcon fontSize="small" />} sx={{ mt: 2, mb: 3, borderRadius: "10px" }}>
        All feedback is fully anonymous. The AI analysis is shown — the submitter's identity is never revealed.
      </Alert>

      {loading && <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress sx={{ color: "#3D9E8C" }} /></Box>}
      {error   && <Alert severity="error" sx={{ borderRadius: "10px" }}>{error}</Alert>}

      {!loading && !error && reviews.length === 0 && (
        <Card sx={{ textAlign: "center", py: 6 }}>
          <InboxIcon sx={{ fontSize: 56, color: "#C8D4D0", mb: 1 }} />
          <Typography variant="h6" color="text.secondary">No reviews yet</Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
            When a colleague submits feedback about you, it will appear here.
          </Typography>
        </Card>
      )}

      {!loading && reviews.length > 0 && (
        <Stack spacing={2}>
          {reviews.map((review, idx) => (
            <Card key={review.feedbackId ?? idx}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">{formatDate(review.timestamp)}</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <SentimentChip value={review.sentiment} />
                    <Chip
                      icon={<LockIcon sx={{ fontSize: 12 }} />} label="Anonymous" size="small"
                      variant="outlined" sx={{ fontSize: "0.65rem", color: "text.secondary", borderRadius: "8px" }}
                    />
                  </Box>
                </Box>

                {review.summary ? (
                  <Typography variant="body1" sx={{
                    borderLeft: "3px solid #3D9E8C", pl: 1.5, mb: 1.5,
                    fontStyle: "italic", color: "#2C3A3A",
                  }}>
                    {review.summary}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    AI analysis is being processed…
                  </Typography>
                )}

                {review.topics.length > 0 && (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {review.topics.map(topic => (
                      <Chip key={topic} label={topic} size="small" variant="outlined"
                        sx={{ fontSize: "0.7rem", textTransform: "capitalize", borderRadius: "8px",
                          borderColor: "#D8D2C8", color: "#4F6E84" }} />
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default MyReviewsPage;