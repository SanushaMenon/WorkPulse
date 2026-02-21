import React, { useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Card, CardContent, Chip, CircularProgress,
  Divider, Grid, LinearProgress, Paper, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from "@mui/material";
import LockIcon        from "@mui/icons-material/Lock";
import TrendingUpIcon  from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Tooltip, Legend, Filler,
} from "chart.js";
import { fetchInsights, InsightsResponse, DepartmentScore } from "../api";
import { useAuth } from "../auth/AuthContext";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Filler);

function scoreColor(score: number): "success" | "warning" | "error" {
  return score >= 70 ? "success" : score >= 40 ? "warning" : "error";
}
function scoreLabel(score: number) {
  return score >= 70 ? "Healthy" : score >= 40 ? "At Risk" : "Critical";
}

const InsightsPage: React.FC = () => {
  const { roleName } = useAuth();
  const [data, setData]     = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setData(await fetchInsights());
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load insights.");
      } finally { setLoading(false); }
    })();
  }, []);

  const topicFreq = useMemo(() => {
    const freq: Record<string, number> = {};
    (data?.topics ?? []).forEach(t => { const k = t.toLowerCase(); freq[k] = (freq[k] || 0) + 1; });
    return Object.entries(freq).sort(([, a], [, b]) => b - a).slice(0, 10);
  }, [data]);

  const trendChartData = useMemo(() => {
    const trend = data?.monthlyTrend ?? [];
    return {
      labels: trend.map(m => m.month),
      datasets: [
        { label: "Positive", data: trend.map(m => m.positive), borderColor: "#3D9E8C", backgroundColor: "rgba(61,158,140,0.08)", fill: true, tension: 0.4 },
        { label: "Negative", data: trend.map(m => m.negative), borderColor: "#E8857A", backgroundColor: "rgba(232,133,122,0.08)", fill: true, tension: 0.4 },
        { label: "Neutral",  data: trend.map(m => m.neutral),  borderColor: "#4F6E84", backgroundColor: "rgba(79,110,132,0.08)",  fill: true, tension: 0.4 },
      ],
    };
  }, [data]);

  const { orgScore, mostAtRisk, trendingUp } = useMemo(() => {
    const scores  = data?.departmentScores ?? {};
    const entries = Object.entries(scores) as [string, DepartmentScore][];
    const total   = data?.totalSubmissions ?? 0;
    const pos     = data?.sentimentCounts?.positive ?? 0;
    const org     = total > 0 ? Math.round((pos / total) * 100) : 0;
    const sorted  = [...entries].sort(([, a], [, b]) => a.score - b.score);
    const atRisk  = sorted[0];
    const up      = [...entries].sort(([, a], [, b]) => b.score - a.score)[0];
    return {
      orgScore:   org,
      mostAtRisk: atRisk ? { name: atRisk[0], score: atRisk[1].score } : null,
      trendingUp: up    ? { name: up[0],    score: up[1].score }    : null,
    };
  }, [data]);

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
        <Typography variant="h4" sx={{ color: "#2C3A3A" }}>AI Insights Dashboard</Typography>
        <Chip label={roleName} size="small"
          sx={{ backgroundColor: "rgba(61,158,140,0.12)", color: "#3D9E8C", fontWeight: 700 }} />
        <Chip icon={<LockIcon sx={{ fontSize: 14 }} />} label="Anonymous" size="small"
          variant="outlined" color="success" sx={{ borderRadius: "8px" }} />
      </Box>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Organisation-wide sentiment trends, department health, and AI summaries. All data is anonymised.
      </Typography>

      {loading && <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress sx={{ color: "#3D9E8C" }} /></Box>}
      {error   && <Alert severity="error" sx={{ mt: 2, borderRadius: "10px" }}>{error}</Alert>}

      {data && !loading && !data.minimumThresholdMet && (
        <Alert severity="info" sx={{ mt: 3, borderRadius: "10px" }}>
          Not enough submissions yet to display anonymised insights.
        </Alert>
      )}

      {data?.minimumThresholdMet && !loading && (
        <Box sx={{ mt: 3 }}>

          {/* KPI Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: "Total Submissions",        value: data.totalSubmissions, sub: "All time",           color: "#3D9E8C" },
              { label: "Org Sentiment Score",       value: `${orgScore}/100`,     sub: orgScore >= 70 ? "Healthy 🟢" : orgScore >= 40 ? "At Risk 🟠" : "Critical 🔴", color: orgScore >= 70 ? "#3D9E8C" : orgScore >= 40 ? "#E8A838" : "#E8857A" },
              { label: "Most At-Risk Dept",         value: mostAtRisk?.name ?? "—", sub: mostAtRisk ? `Score: ${mostAtRisk.score}/100` : "No data", color: "#E8857A", icon: <TrendingDownIcon fontSize="small" /> },
              { label: "Highest Performing Dept",   value: trendingUp?.name ?? "—", sub: trendingUp ? `Score: ${trendingUp.score}/100` : "No data", color: "#3D9E8C", icon: <TrendingUpIcon  fontSize="small" /> },
            ].map(kpi => (
              <Grid item xs={12} sm={6} md={3} key={kpi.label}>
                <Card sx={{ height: "100%", position: "relative", overflow: "hidden",
                  "&::after": { content: '""', position: "absolute", top: 0, left: 0, right: 0, height: "3px", backgroundColor: kpi.color } }}>
                  <CardContent>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, fontSize: "10px" }}>
                      {kpi.label}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                      {kpi.icon && <Box sx={{ color: kpi.color }}>{kpi.icon}</Box>}
                      <Typography variant="h5" fontWeight={800} sx={{ color: kpi.color, letterSpacing: "-0.02em" }}>
                        {kpi.value}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{kpi.sub}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Trend line chart */}
          {(data.monthlyTrend?.length ?? 0) > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  📈 Sentiment Trend — Last {data.monthlyTrend!.length} Months
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Line data={trendChartData} options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: "top" } },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: "#EDE9E0" } }, x: { grid: { color: "#EDE9E0" } } },
                  }} />
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Dept scorecard + Topics */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {data.departmentScores && Object.keys(data.departmentScores).length > 0 && (
              <Grid item xs={12} md={7}>
                <Card sx={{ height: "100%" }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} gutterBottom>🏢 Department Health</Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {["Department", "Submissions", "Health Score", "Status"].map(h => (
                            <TableCell key={h} sx={{ fontWeight: 700, color: "#5A7070", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(data.departmentScores).sort(([, a], [, b]) => a.score - b.score).map(([dept, scores]) => (
                          <TableRow key={dept} sx={{ "&:hover": { backgroundColor: "rgba(61,158,140,0.04)" } }}>
                            <TableCell sx={{ textTransform: "capitalize", fontWeight: 500 }}>{dept}</TableCell>
                            <TableCell>{scores.total}</TableCell>
                            <TableCell sx={{ minWidth: 150 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <LinearProgress variant="determinate" value={scores.score}
                                  color={scoreColor(scores.score)}
                                  sx={{ flexGrow: 1, height: 8, borderRadius: 4, backgroundColor: "#E8E2D9" }} />
                                <Typography variant="caption" fontWeight={700}>{scores.score}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip label={scoreLabel(scores.score)} color={scoreColor(scores.score)}
                                size="small" variant="outlined" sx={{ borderRadius: "8px" }} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </Grid>
            )}

            <Grid item xs={12} md={data.departmentScores ? 5 : 12}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>🔖 Top Topics</Typography>
                  {topicFreq.length === 0 ? (
                    <Typography color="text.secondary">No topics yet.</Typography>
                  ) : (
                    <Stack spacing={1}>
                      {topicFreq.map(([topic, count], idx) => (
                        <Box key={topic}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
                            <Typography variant="body2" sx={{ textTransform: "capitalize", color: "#2C3A3A" }}>
                              {idx + 1}. {topic}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">{count}x</Typography>
                          </Box>
                          <LinearProgress variant="determinate"
                            value={(count / (topicFreq[0][1] || 1)) * 100}
                            sx={{ height: 6, borderRadius: 4, backgroundColor: "#E8E2D9",
                              "& .MuiLinearProgress-bar": { backgroundColor: "#3D9E8C" } }} />
                        </Box>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* AI summaries */}
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>📝 AI Summaries</Typography>
                <Chip icon={<LockIcon sx={{ fontSize: 13 }} />} label="Anonymous" size="small"
                  color="success" variant="outlined" sx={{ borderRadius: "8px" }} />
              </Box>
              {(data.summaries?.length ?? 0) === 0 ? (
                <Typography color="text.secondary">No summaries yet.</Typography>
              ) : (
                <Stack spacing={2} divider={<Divider sx={{ borderColor: "#E8E2D9" }} />}>
                  {data.summaries!.map((item, idx) => (
                    <Box key={idx}>
                      <Typography variant="body2" sx={{ borderLeft: "3px solid #3D9E8C", pl: 1.5, color: "#2C3A3A" }}>
                        {item.summary}
                      </Typography>
                      <Chip label={item.department} size="small" variant="outlined"
                        sx={{ mt: 0.5, ml: 1.5, fontSize: "0.65rem", textTransform: "capitalize",
                          borderRadius: "8px", borderColor: "#4F6E84", color: "#4F6E84" }} />
                    </Box>
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

export default InsightsPage;