import React, { useEffect, useState } from "react";
import {
  Alert, Box, Card, CardContent, Chip, CircularProgress,
  Divider, Paper, Stack, Step, StepContent, StepLabel,
  Stepper, Typography,
} from "@mui/material";
import TrendingUpIcon   from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import EmojiObjectsIcon from "@mui/icons-material/EmojiObjects";
import FavoriteIcon     from "@mui/icons-material/Favorite";
import { fetchRoadmap, RoadmapResponse } from "../api";
import { useAuth } from "../auth/AuthContext";

const SENTIMENT_COLOR: Record<string, "success" | "error" | "warning"> = {
  positive: "success", negative: "error", neutral: "warning",
};

const TREND_ICON: Record<string, React.ReactNode> = {
  improving: <TrendingUpIcon   fontSize="small" sx={{ color: "#3D9E8C" }} />,
  declining: <TrendingDownIcon fontSize="small" sx={{ color: "#E8857A" }} />,
  stable:    <TrendingFlatIcon fontSize="small" sx={{ color: "#4F6E84" }} />,
};

const TREND_LABEL: Record<string, string> = {
  improving: "Improving ↑", declining: "Declining ↓", stable: "Stable →",
};

const GrowthRoadmapPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData]     = useState<RoadmapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setData(await fetchRoadmap());
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load your growth roadmap.");
      } finally { setLoading(false); }
    })();
  }, []);

  const currentState  = data?.currentState;
  const focusAreas    = data?.focusAreas ?? [];
  const plan          = data?.plan;
  const encouragement = data?.encouragement;

  return (
    <Box maxWidth={800} mx="auto">
      <Typography variant="h4" gutterBottom sx={{ color: "#2C3A3A" }}>My Growth Roadmap</Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Based on your feedback history, our AI has crafted a personalised development plan just for you,{" "}
        {user?.name?.split(" ")[0] ?? "there"}.
      </Typography>

      {loading && <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress sx={{ color: "#3D9E8C" }} /></Box>}
      {error   && <Alert severity="error" sx={{ mt: 2, borderRadius: "10px" }}>{error}</Alert>}

      {data && !loading && !data.hasEnoughData && (
        <Alert severity="info" sx={{ mt: 3, borderRadius: "10px" }}>
          <Typography variant="body1" fontWeight={600}>Not enough data yet</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>{data.message}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            You have submitted {data.totalSubmissions} {data.totalSubmissions === 1 ? "entry" : "entries"} so far.
          </Typography>
        </Alert>
      )}

      {data?.hasEnoughData && !loading && (
        <Stack spacing={3} sx={{ mt: 3 }}>

          {/* Current State */}
          {currentState ? (
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>📍 Where You Are Now</Typography>
                <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ mb: 2 }}>
                  <Chip
                    label={(currentState.dominantSentiment ?? "neutral").charAt(0).toUpperCase() + (currentState.dominantSentiment ?? "neutral").slice(1)}
                    color={SENTIMENT_COLOR[currentState.dominantSentiment ?? "neutral"] ?? "default"}
                    size="small" sx={{ borderRadius: "8px" }}
                  />
                  <Chip
                    icon={<Box sx={{ display: "flex", pl: 0.5 }}>{TREND_ICON[currentState.trend ?? "stable"]}</Box>}
                    label={TREND_LABEL[currentState.trend ?? "stable"] ?? currentState.trend}
                    variant="outlined" size="small"
                    sx={{ borderRadius: "8px", borderColor: "#D8D2C8" }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
                    Based on {data.analyzedSubmissions} submissions
                  </Typography>
                </Stack>

                <Typography variant="body1" sx={{ mb: 2 }}>{currentState.summary}</Typography>

                {(currentState.recurringTopics?.length ?? 0) > 0 && (
                  <>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}
                      sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Recurring Themes
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.75 }}>
                      {currentState.recurringTopics.map(topic => (
                        <Chip key={topic} label={topic} size="small" variant="outlined"
                          sx={{ borderRadius: "8px", borderColor: "#3D9E8C", color: "#3D9E8C" }} />
                      ))}
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Alert severity="warning" sx={{ borderRadius: "10px" }}>
              AI could not generate your current state analysis. Try again soon.
            </Alert>
          )}

          {/* Focus Areas */}
          {focusAreas.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <EmojiObjectsIcon sx={{ color: "#E8857A" }} /> Focus Areas
                </Typography>
                <Stack spacing={2} divider={<Divider sx={{ borderColor: "#E8E2D9" }} />}>
                  {focusAreas.map((area, idx) => (
                    <Box key={idx}>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ color: "#2C3A3A" }}>{area.area}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{area.reason}</Typography>
                      <Paper variant="outlined" sx={{ p: 1.5, mt: 1, bgcolor: "rgba(61,158,140,0.05)", borderColor: "rgba(61,158,140,0.2)", borderRadius: "10px" }}>
                        <Typography variant="body2">
                          <strong>This week:</strong> {area.action}
                        </Typography>
                      </Paper>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* 30-60-90 Day Plan */}
          {plan && (
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>📅 Your 30-60-90 Day Plan</Typography>
                <Stepper orientation="vertical" nonLinear>
                  {[
                    { label: "First 30 Days",  content: plan.thirtyDays,  color: "#3D9E8C" },
                    { label: "Days 31–60",      content: plan.sixtyDays,   color: "#4F6E84" },
                    { label: "By Day 90",       content: plan.ninetyDays,  color: "#E8857A" },
                  ].map(step => (
                    <Step key={step.label} active expanded>
                      <StepLabel StepIconProps={{ sx: { color: `${step.color} !important` } }}>
                        <Typography variant="subtitle1" fontWeight={600}>{step.label}</Typography>
                      </StepLabel>
                      <StepContent>
                        <Typography variant="body2" color="text.secondary">{step.content}</Typography>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              </CardContent>
            </Card>
          )}

          {/* Encouragement */}
          {encouragement && (
            <Paper elevation={0} sx={{
              p: 2.5, bgcolor: "rgba(61,158,140,0.07)",
              border: "1px solid rgba(61,158,140,0.25)", borderRadius: "12px",
              display: "flex", alignItems: "flex-start", gap: 1.5,
            }}>
              <FavoriteIcon sx={{ color: "#3D9E8C", mt: 0.25, flexShrink: 0 }} />
              <Typography variant="body1" fontStyle="italic" color="text.primary">{encouragement}</Typography>
            </Paper>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default GrowthRoadmapPage;
