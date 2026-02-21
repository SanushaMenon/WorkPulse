import React, { useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Card, CardContent, Chip, CircularProgress,
  Divider, Grid, LinearProgress, Paper, Stack, Typography,
} from "@mui/material";
import LockIcon                  from "@mui/icons-material/Lock";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import SentimentDissatisfiedIcon from "@mui/icons-material/SentimentDissatisfied";
import SentimentNeutralIcon      from "@mui/icons-material/SentimentNeutral";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  LineElement, PointElement, Tooltip, Legend, Filler,
} from "chart.js";
import { fetchInsights, InsightsResponse } from "../api";
import { useAuth } from "../auth/AuthContext";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend, Filler);

function scoreColor(score: number) {
  if (score >= 70) return "#3D9E8C";
  if (score >= 40) return "#E8A838";
  return "#E8857A";
}

function scoreLabel(score: number) {
  if (score >= 70) return "Healthy 🟢";
  if (score >= 40) return "Needs Attention 🟠";
  return "Critical 🔴";
}

const ManagerDashboardPage: React.FC = () => {
  const { user, roleName } = useAuth();
  const [data, setData]       = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setData(await fetchInsights());
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load team data.");
      } finally { setLoading(false); }
    })();
  }, []);

  const teamScore = useMemo(() => {
    if (!data?.sentimentCounts) return 0;
    const { positive, negative, neutral } = data.sentimentCounts;
    const total = positive + negative + neutral;
    return total > 0 ? Math.round((positive / total) * 100) : 0;
  }, [data]);

  const topicFreq = useMemo(() => {
    const freq: Record<string, number> = {};
    (data?.topics ?? []).forEach(t => { const k = t.toLowerCase(); freq[k] = (freq[k] || 0) + 1; });
    return Object.entries(freq).sort(([, a], [, b]) => b - a).slice(0, 8);
  }, [data]);

  const trendChartData = useMemo(() => {
    const trend = data?.monthlyTrend ?? [];
    return {
      labels: trend.map(m => m.month),
      datasets: [
        { label: "Positive", data: trend.map(m => m.positive), borderColor: "#3D9E8C", backgroundColor: "rgba(61,158,140,0.10)", fill: true, tension: 0.4 },
        { label: "Negative", data: trend.map(m => m.negative), borderColor: "#E8857A", backgroundColor: "rgba(232,133,122,0.10)", fill: true, tension: 0.4 },
      ],
    };
  }, [data]);

  const dept = data?.scopedToDepartment;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
        <Typography variant="h4" fontWeight={800} sx={{ color: "#2C3A3A", letterSpacing: "-0.02em" }}>
          Team Dashboard
        </Typography>
        <Chip label={roleName} size="small"
          sx={{ backgroundColor: "rgba(61,158,140,0.12)", color: "#3D9E8C", fontWeight: 700 }} />
        {dept && (
          <Chip label={dept.charAt(0).toUpperCase() + dept.slice(1)} size="small" variant="outlined"
            sx={{ borderRadius: "8px", borderColor: "#4F6E84", color: "#4F6E84" }} />
        )}
        <Chip icon={<LockIcon sx={{ fontSize: 14 }} />} label="Anonymous" size="small"
          variant="outlined" color="success" sx={{ borderRadius: "8px" }} />
      </Box>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Sentiment, themes, and AI summaries for your team. All data is anonymised — requires at least{" "}
        {data?.minimumGroupSize ?? 5} submissions.
      </Typography>

      {loading && <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress sx={{ color: "#3D9E8C" }} /></Box>}
      {error   && <Alert severity="error" sx={{ mt: 2, borderRadius: "10px" }}>{error}</Alert>}

      {/* Threshold not met */}
      {data && !data.minimumThresholdMet && !loading && (
        <Alert severity="info" sx={{ mt: 3, borderRadius: "10px" }}>
          <Typography variant="body1" fontWeight={600}>Not enough submissions yet</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Your team has {data.totalSubmissions} submission{data.totalSubmissions === 1 ? "" : "s"} — you need at least{" "}
            {data.minimumGroupSize} to protect anonymity and display insights.
          </Typography>
        </Alert>
      )}

      {data?.minimumThresholdMet && !loading && (
        <Box sx={{ mt: 3 }}>

          {/* Team Health Score + Sentiment Bars */}
          <Paper elevation={0} sx={{
            p: 3, mb: 3, borderRadius: "14px",
            backgroundColor: "#FAF8F4", border: "1px solid #E8E2D9",
            position: "relative", overflow: "hidden",
            "&::after": { content: '""', position: "absolute", top: 0, left: 0, right: 0, height: "3px", backgroundColor: scoreColor(teamScore) },
          }}>
            <Grid container spacing={3} alignItems="center">
              {/* Score */}
              <Grid item xs={12} sm={6}>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: "0.1em", fontSize: "11px" }}>
                  Team Health Score
                </Typography>
                <Typography variant="h2" fontWeight={800}
                  sx={{ color: scoreColor(teamScore), lineHeight: 1.1, mt: 0.5, letterSpacing: "-0.03em" }}>
                  {teamScore}
                  <Typography component="span" variant="h5" sx={{ color: "#9AADA8" }}>/100</Typography>
                </Typography>
                <Typography variant="body1" fontWeight={700} sx={{ color: scoreColor(teamScore), mt: 0.5 }}>
                  {scoreLabel(teamScore)}
                </Typography>
              </Grid>

              {/* Sentiment bars */}
              <Grid item xs={12} sm={6}>
                <Stack spacing={1.5}>
                  {[
                    { icon: <SentimentSatisfiedAltIcon sx={{ color: "#3D9E8C" }} />, label: "Positive", count: data.sentimentCounts?.positive ?? 0, color: "#3D9E8C" },
                    { icon: <SentimentDissatisfiedIcon sx={{ color: "#E8857A" }} />, label: "Negative", count: data.sentimentCounts?.negative ?? 0, color: "#E8857A" },
                    { icon: <SentimentNeutralIcon      sx={{ color: "#4F6E84" }} />, label: "Neutral",  count: data.sentimentCounts?.neutral  ?? 0, color: "#4F6E84" },
                  ].map(({ icon, label, count, color }) => (
                    <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {icon}
                      <Typography variant="body2" sx={{ minWidth: 60, color: "#2C3A3A", fontWeight: 500 }}>{label}</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(count / (data.totalSubmissions || 1)) * 100}
                        sx={{
                          flexGrow: 1, height: 8, borderRadius: 4,
                          backgroundColor: "#E8E2D9",
                          "& .MuiLinearProgress-bar": { backgroundColor: color },
                        }}
                      />
                      <Typography variant="caption" fontWeight={700} sx={{ minWidth: 24, color: "#5A7070" }}>
                        {count}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {/* Trend + Topics */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={7}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: "#2C3A3A" }}>
                    📈 Trend Over Time
                  </Typography>
                  {(data.monthlyTrend?.length ?? 0) === 0 ? (
                    <Typography color="text.secondary">Not enough historical data yet.</Typography>
                  ) : (
                    <Box sx={{ height: 250 }}>
                      <Line data={trendChartData} options={{
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { position: "top" } },
                        scales: {
                          y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: "#EDE9E0" } },
                          x: { grid: { color: "#EDE9E0" } },
                        },
                      }} />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={5}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: "#2C3A3A" }}>
                    🔖 Top Topics
                  </Typography>
                  {topicFreq.length === 0 ? (
                    <Typography color="text.secondary">No topics yet.</Typography>
                  ) : (
                    <Stack spacing={1.2}>
                      {topicFreq.map(([topic, count], idx) => (
                        <Box key={topic}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
                            <Typography variant="body2" sx={{ textTransform: "capitalize", color: "#2C3A3A" }}>
                              {idx + 1}. {topic}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">{count}x</Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={(count / (topicFreq[0][1] || 1)) * 100}
                            sx={{
                              height: 6, borderRadius: 4, backgroundColor: "#E8E2D9",
                              "& .MuiLinearProgress-bar": { backgroundColor: "#3D9E8C" },
                            }}
                          />
                        </Box>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* AI Summaries */}
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <Typography variant="h6" fontWeight={700} sx={{ color: "#2C3A3A" }}>📝 AI Summaries</Typography>
                <Chip icon={<LockIcon sx={{ fontSize: 13 }} />} label="Anonymous" size="small"
                  color="success" variant="outlined" sx={{ borderRadius: "8px" }} />
              </Box>
              {(data.summaries?.length ?? 0) === 0 ? (
                <Typography color="text.secondary">No summaries yet.</Typography>
              ) : (
                <Stack spacing={2} divider={<Divider sx={{ borderColor: "#E8E2D9" }} />}>
                  {data.summaries!.map((item, idx) => (
                    <Typography key={idx} variant="body2"
                      sx={{ borderLeft: "3px solid #4F6E84", pl: 1.5, color: "#2C3A3A" }}>
                      {item.summary}
                    </Typography>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default ManagerDashboardPage;