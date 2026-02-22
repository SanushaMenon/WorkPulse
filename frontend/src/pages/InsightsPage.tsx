import React, { useEffect, useMemo, useState } from "react";
import {
  Alert, Box, CircularProgress, Grid, Rating, Stack, Typography,
} from "@mui/material";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Tooltip, Legend, Filler,
} from "chart.js";
import { fetchInsights, InsightsResponse } from "../api";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler);

/* ── Colour palette (classic B&W with premium depth) ───────────────────────────────────────── */
const C = {
  bg: "#F4F1E1",           // Cream
  surface: "#ffffff",      // pure white cards
  border: "#597E9420",     // 12% opacity slate
  text: "#597E94",         // Slate Blue
  muted: "#597E94cc",      // 80% opacity slate
  muted2: "#597E9466",     // 40% opacity slate
  accent: "#4CA695",       // Teal 
  pos: "#4CA695",          // Teal for positive
  neu: "#597E94",          // Slate for neutral
  neg: "#EC8C8C",          // Coral Pink for negative
  amber: "#f59e0b",
  emerald: "#059669",
  sky: "#2563eb",
};

interface EmployeeReview {
  employeeName: string; department: string; rating: number;
  sentiment: string; summary: string; reviewPeriod: string; timestamp: string;
  topics: string[];
  growth_plan?: {
    immediate_actions?: string[];
    short_term_goals?: string[];
    long_term_development?: string[];
  };
}
interface EnrichedInsights extends InsightsResponse { reviews?: EmployeeReview[]; }

const SENT: Record<string, { color: string; bg: string; label: string; dot: string; shadow: string }> = {
  positive: { color: C.pos, bg: "#4CA6951A", label: "Positive", dot: C.pos, shadow: "#4CA69533" }, // 10% and 20% opacity teal
  neutral: { color: C.neu, bg: "#597E941A", label: "Neutral", dot: C.neu, shadow: "#597E9433" },  // 10% and 20% opacity slate
  negative: { color: C.neg, bg: "#EC8C8C1A", label: "Negative", dot: C.neg, shadow: "#EC8C8C33" }, // 10% and 20% opacity coral
  mixed: { color: C.muted, bg: "#597E941A", label: "Mixed", dot: C.muted, shadow: "#597E9433" },
};

/* ── Count-up hook ───────────────────────────────────────────────────────── */
function useCountUp(target: number) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let cur = 0; const step = target / 40;
    const t = setInterval(() => {
      cur += step;
      if (cur >= target) { setVal(target); clearInterval(t); } else setVal(Math.floor(cur));
    }, 20);
    return () => clearInterval(t);
  }, [target]);
  return val;
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

/* ── Roadmap section inside modal ────────────────────────────────────────── */
function RoadmapSection({
  title, items, dotColor, bg,
}: { title: string; items: string[]; dotColor: string; bg: string }) {
  if (!items || items.length === 0) return null;
  return (
    <Box sx={{ mb: "20px" }}>
      <Typography sx={{
        fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase",
        color: C.muted, mb: "10px", fontWeight: 700,
      }}>
        {title}
      </Typography>
      <Stack spacing={1}>
        {items.map((item, i) => (
          <Box key={i} sx={{
            display: "flex", alignItems: "flex-start", gap: "10px",
            p: "10px 14px", background: bg, borderRadius: "8px",
            border: `1px solid ${dotColor}20`,
          }}>
            <Box sx={{
              width: 6, height: 6, borderRadius: "50%", background: dotColor,
              flexShrink: 0, mt: "6px",
            }} />
            <Typography sx={{ fontSize: "13px", lineHeight: 1.7, color: C.text }}>{item}</Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

/* ── Stat Card ───────────────────────────────────────────────────────────── */
function StatCard({ label, value, suffix, delay }: { label: string; value: number; suffix?: string; delay: string }) {
  const count = useCountUp(value);
  return (
    <Box sx={{
      background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(8px)",
      border: `1px solid rgba(89, 126, 148, 0.12)`, borderRadius: "20px",
      p: "24px", animation: `slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay} both`,
      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      boxShadow: "0 8px 32px rgba(89, 126, 148, 0.06), 0 2px 8px rgba(0,0,0,0.02)",
      "&:hover": {
        boxShadow: "0 16px 48px rgba(76, 166, 149, 0.12)",
        transform: "translateY(-4px)",
        borderColor: "rgba(76, 166, 149, 0.3)"
      },
    }}>
      <Typography sx={{
        fontSize: "2.2rem", fontWeight: 800, color: C.text, lineHeight: 1,
        fontFamily: "'Inter', sans-serif", letterSpacing: "-0.03em",
        background: "linear-gradient(135deg, #597E94 0%, #4CA695 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
      }}>
        {count}{suffix || ""}
      </Typography>
      <Typography sx={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, mt: "8px", fontWeight: 600 }}>
        {label}
      </Typography>
    </Box>
  );
}

/* ── Panel wrapper ───────────────────────────────────────────────────────── */
function Panel({ title, children, minH, delay = "0.1s" }: { title: string; children: React.ReactNode; minH?: number; delay?: string }) {
  return (
    <Box sx={{
      background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(12px)",
      border: `1px solid rgba(89, 126, 148, 0.12)`,
      borderRadius: "24px", p: "28px", minHeight: minH,
      animation: `slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay} both`,
      boxShadow: "0 12px 40px rgba(89, 126, 148, 0.05), 0 2px 8px rgba(0,0,0,0.02)",
      transition: "all 0.3s ease",
      "&:hover": { boxShadow: "0 20px 50px rgba(89, 126, 148, 0.08)" }
    }}>
      <Typography sx={{
        fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase",
        fontWeight: 700, color: C.muted, mb: "14px",
      }}>
        {title}
      </Typography>
      <Box sx={{ height: "1px", background: "linear-gradient(90deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 100%)", mb: "20px" }} />
      {children}
    </Box>
  );
}

/* ── Review Detail Modal ─────────────────────────────────────────────────── */
function ReviewModal({ review, onClose }: { review: EmployeeReview; onClose: () => void }) {
  const sent = SENT[review.sentiment?.toLowerCase()] || SENT.neutral;
  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const gp = review.growth_plan || {};
  const hasGrowthPlan = (
    (gp.immediate_actions?.length ?? 0) +
    (gp.short_term_goals?.length ?? 0) +
    (gp.long_term_development?.length ?? 0)
  ) > 0;

  return (
    <Box
      onClick={handleBackdrop}
      sx={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.3)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        p: "24px",
        animation: "fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <Box sx={{
        background: "#fff", borderRadius: "24px", width: "100%", maxWidth: 640,
        maxHeight: "85vh", overflowY: "auto",
        boxShadow: "0 32px 100px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05) inset",
        animation: "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}>
        {/* Modal header */}
        <Box sx={{
          p: "28px 32px 24px", borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px",
          background: "linear-gradient(180deg, #fff 0%, #fafafa 100%)"
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Box sx={{
              width: 52, height: 52, borderRadius: "14px",
              background: "linear-gradient(135deg, #4CA695 0%, #597E94 100%)",
              display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "16px", fontWeight: 700,
              color: "#fff", letterSpacing: "1px", flexShrink: 0,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
            }}>
              {getInitials(review.employeeName || "?")}
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "18px", color: C.text }}>{review.employeeName || "Unknown Employee"}</Typography>
              <Typography sx={{ fontSize: "12px", color: C.muted, mt: "2px" }}>
                {[review.department, review.reviewPeriod, review.timestamp].filter(Boolean).join(" · ") || "—"}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
            {/* Sentiment badge */}
            <Box sx={{
              border: `1px solid ${sent.shadow}`, borderRadius: "999px",
              px: "14px", py: "6px", background: sent.bg,
              display: "flex", alignItems: "center", gap: "6px",
            }}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: sent.dot, boxShadow: `0 0 8px ${sent.dot}` }} />
              <Typography sx={{ fontSize: "11px", fontWeight: 700, color: sent.dot, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {sent.label}
              </Typography>
            </Box>
            {/* Close button */}
            <Box
              onClick={onClose}
              sx={{
                width: 36, height: 36, borderRadius: "10px",
                background: "rgba(0,0,0,0.04)", display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer", fontSize: "20px",
                color: C.muted, border: "1px solid transparent",
                "&:hover": { background: "#fff", color: C.text, borderColor: C.border, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              ×
            </Box>
          </Box>
        </Box>

        {/* Modal body */}
        <Box sx={{ p: "32px" }}>
          {/* Rating */}
          {review.rating > 0 && (
            <Box sx={{ mb: "20px" }}>
              <Typography sx={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, mb: "8px" }}>Rating</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Rating value={review.rating} readOnly
                  sx={{ "& .MuiRating-iconFilled": { color: C.text }, "& .MuiRating-iconEmpty": { color: C.muted2 } }} />
                <Typography sx={{ fontWeight: 700, fontSize: "15px", color: C.text }}>{review.rating} / 5</Typography>
              </Box>
            </Box>
          )}

          {/* AI Summary */}
          <Box sx={{ mb: "24px" }}>
            <Typography sx={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, mb: "12px", fontWeight: 700 }}>AI Summary</Typography>
            <Typography sx={{
              fontSize: "15px", lineHeight: 1.8, color: C.text,
              background: sent.bg, borderLeft: `4px solid ${sent.dot}`,
              pl: "20px", py: "18px", pr: "20px", borderRadius: "0 12px 12px 0",
              boxShadow: "0 2px 10px rgba(0,0,0,0.02) inset"
            }}>
              {review.summary || "No AI summary available for this review."}
            </Typography>
          </Box>

          {/* ── Growth Roadmap ───────────────────────────────────────── */}
          {hasGrowthPlan && (
            <Box sx={{ background: "#fafafa", border: `1px solid ${C.border}`, borderRadius: "14px", p: "20px 24px", mb: "20px" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mb: "20px" }}>
                <Typography sx={{ fontSize: "18px" }}>🗺️</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: "15px", color: C.text }}>
                  Employee Growth Roadmap
                </Typography>
              </Box>
              <RoadmapSection
                title="Immediate Actions (0–30 days)"
                items={gp.immediate_actions ?? []}
                dotColor="#111111"
                bg="#fff"
              />
              <RoadmapSection
                title="Short-Term Goals (1–3 months)"
                items={gp.short_term_goals ?? []}
                dotColor="#597E94"
                bg="#597E940a" // 4% slate
              />
              <RoadmapSection
                title="Long-Term Development (3–12 months)"
                items={gp.long_term_development ?? []}
                dotColor="#EC8C8C"
                bg="#EC8C8C0a" // 4% coral
              />
            </Box>
          )}

          {/* Topics */}
          {review.topics && review.topics.length > 0 && (
            <Box sx={{ mb: "20px" }}>
              <Typography sx={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, mb: "10px" }}>Topics</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {review.topics.map((t, i) => (
                  <Box key={i} sx={{
                    border: `1px solid ${C.border}`, borderRadius: "999px",
                    px: "12px", py: "4px", fontSize: "12px", color: C.text,
                    background: "#fafafa",
                  }}>
                    {t}
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

/* ── Employee Card (clickable → opens modal) ─────────────────────────────── */
function EmployeeCard({ review, idx, onOpen }: { review: EmployeeReview; idx: number; onOpen: () => void }) {
  const sent = SENT[review.sentiment?.toLowerCase()] || SENT.neutral;
  const gp = review.growth_plan || {};
  const roadmapCount = (gp.immediate_actions?.length ?? 0) + (gp.short_term_goals?.length ?? 0) + (gp.long_term_development?.length ?? 0);

  return (
    <Box
      onClick={onOpen}
      sx={{
        border: `1px solid rgba(89, 126, 148, 0.12)`, borderRadius: "20px", overflow: "hidden",
        background: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", gap: "16px", p: "16px 20px",
        cursor: "pointer",
        animation: `slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.05}s both`,
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: "0 4px 16px rgba(89, 126, 148, 0.04)",
        "&:hover": {
          boxShadow: "0 12px 32px rgba(76, 166, 149, 0.12)",
          borderColor: "rgba(76, 166, 149, 0.3)",
          transform: "translateY(-3px)",
        },
      }}
    >
      {/* Avatar */}
      <Box sx={{
        width: 44, height: 44, borderRadius: "12px", flexShrink: 0,
        background: "linear-gradient(135deg, #4CA695 0%, #597E94 100%)", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: "14px", fontWeight: 700,
        color: "#fff", letterSpacing: "1px",
      }}>
        {getInitials(review.employeeName || "?")}
      </Box>

      {/* Name + meta */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: "14px", color: C.text }}>{review.employeeName || "Unknown Employee"}</Typography>
        <Typography sx={{ fontSize: "11px", color: C.muted, mt: "1px" }}>
          {[review.department, review.reviewPeriod].filter(Boolean).join(" · ") || "—"}
        </Typography>
      </Box>

      {/* Growth plan badge */}
      {roadmapCount > 0 && (
        <Box sx={{
          flexShrink: 0, borderRadius: "999px", px: "10px", py: "4px",
          background: "#f5f3ff", border: "1px solid #7c3aed30",
          display: "flex", alignItems: "center", gap: "5px",
        }}>
          <Typography sx={{ fontSize: "12px" }}>🗺️</Typography>
          <Typography sx={{ fontSize: "10px", fontWeight: 600, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Roadmap
          </Typography>
        </Box>
      )}

      {/* Rating */}
      {review.rating > 0 && (
        <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "6px" }}>
          <Rating value={review.rating} readOnly size="small"
            sx={{ "& .MuiRating-iconFilled": { color: C.text }, "& .MuiRating-iconEmpty": { color: C.muted2 } }} />
          <Typography sx={{ fontSize: "11px", color: C.muted }}>{review.rating}/5</Typography>
        </Box>
      )}

      {/* Sentiment badge */}
      <Box sx={{
        flexShrink: 0, border: `1px solid ${sent.shadow}`, borderRadius: "999px",
        px: "12px", py: "5px", background: sent.bg,
        display: "flex", alignItems: "center", gap: "6px",
      }}>
        <Box sx={{ width: 6, height: 6, borderRadius: "50%", background: sent.dot, flexShrink: 0, boxShadow: `0 0 6px ${sent.dot}` }} />
        <Typography sx={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: sent.dot, fontWeight: 700 }}>
          {sent.label}
        </Typography>
      </Box>

      {/* Click hint */}
      <Typography sx={{ color: C.muted2, fontSize: "18px", flexShrink: 0, ml: "4px" }}>→</Typography>
    </Box>
  );
}

/* ── Topic pill ──────────────────────────────────────────────────────────── */
function TopicPill({ topic, count, max, idx }: { topic: string; count: number; max: number; idx: number }) {
  const scale = 0.87 + (count / max) * 0.3;
  return (
    <Box sx={{
      border: `1px solid ${C.border}`, borderRadius: "999px", px: "14px", py: "5px",
      fontSize: `${12 * scale}px`, color: C.text, background: "#fafafa",
      transition: "background 0.15s, border-color 0.15s",
      "&:hover": { background: C.border, borderColor: C.text },
    }}>
      {topic}
    </Box>
  );
}

/* ── Skill pill ──────────────────────────────────────────────────────────── */
function SkillPill({ name, count, idx, color }: { name: string; count: number; idx: number; color: string }) {
  return (
    <Box sx={{
      display: "flex", alignItems: "center", gap: "10px",
      p: "9px 13px", borderRadius: "9px",
      background: "#fafafa", border: `1px solid ${C.border}`,
      animation: `slideUp 0.3s ease ${idx * 0.06}s both`,
    }}>
      <Box sx={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <Typography sx={{ flex: 1, fontSize: "12px", color: C.text }}>{name}</Typography>
      <Typography sx={{ fontSize: "11px", color, fontWeight: 700 }}>{count}</Typography>
    </Box>
  );
}

const tooltipDefaults = {
  backgroundColor: "#fff", borderColor: "#e0e0e0", borderWidth: 1,
  titleColor: "#111", bodyColor: "#666", padding: 10, cornerRadius: 8,
};

/* ── Main Page ───────────────────────────────────────────────────────────── */
const InsightsPage: React.FC = () => {
  const [data, setData] = useState<EnrichedInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modalReview, setModalReview] = useState<EmployeeReview | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setData(await fetchInsights() as EnrichedInsights);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load insights.");
      } finally { setLoading(false); }
    })();
  }, []);

  const total = data?.totalSubmissions ?? 0;
  const sc = data?.sentimentCounts ?? { positive: 0, negative: 0, neutral: 0 };
  const topics = data?.topics ?? [];
  const reviews = data?.reviews ?? [];
  const avgRating = data?.averageRating ?? 0;
  const highPriority = data?.highPriorityCount ?? 0;
  const deptSentiment = data?.departmentSentiment ?? {};
  const topStrengths = data?.topStrengths ?? [];
  const topImprovements = data?.topImprovements ?? [];
  const sentimentTrend = data?.sentimentTrend ?? [];

  const displayReviews: EmployeeReview[] = useMemo(() => {
    if (reviews.length > 0) {
      return reviews.map(r => ({
        employeeName: r.employeeName || "Unknown Employee",
        department: r.department || "",
        rating: r.rating || 0,
        sentiment: r.sentiment || "neutral",
        summary: r.summary || "",
        reviewPeriod: r.reviewPeriod || "",
        timestamp: r.timestamp || "",
        topics: r.topics || [],
        growth_plan: r.growth_plan,
      }));
    }
    if (data?.recentSummaries && data.recentSummaries.length > 0) {
      return data.recentSummaries.map((s, i) => ({
        employeeName: `Employee ${i + 1}`, department: "",
        rating: 0, sentiment: s.sentiment || "neutral", summary: s.summary || "",
        reviewPeriod: "", timestamp: s.timestamp || "", topics: s.topics || [],
      }));
    }
    return (data?.summaries ?? []).map((summary, i) => ({
      employeeName: `Employee ${i + 1}`, department: "",
      rating: 0, sentiment: "neutral", summary, reviewPeriod: "", timestamp: "", topics: [],
    }));
  }, [reviews, data]);

  const filteredReviews = useMemo(() =>
    displayReviews.filter(r =>
      r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      r.department.toLowerCase().includes(search.toLowerCase())
    ), [displayReviews, search]);

  const topicFreq = useMemo(() => {
    const freq: Record<string, number> = {};
    topics.forEach(t => { const k = t.toLowerCase(); freq[k] = (freq[k] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]);
  }, [topics]);
  const maxFreq = topicFreq[0]?.[1] || 1;

  const sentSlices = [
    { name: "Positive", value: sc.positive, color: C.pos },
    { name: "Neutral", value: sc.neutral, color: C.neu },
    { name: "Negative", value: sc.negative, color: C.neg },
  ];

  const doughnutData = {
    labels: sentSlices.map(s => s.name),
    datasets: [{ data: sentSlices.map(s => s.value), backgroundColor: sentSlices.map(s => s.color), borderWidth: 0, hoverOffset: 6 }],
  };
  const barData = {
    labels: sentSlices.map(s => s.name),
    datasets: [{ label: "Count", data: sentSlices.map(s => s.value), backgroundColor: sentSlices.map(s => s.color), borderRadius: 6, borderSkipped: false as const }],
  };
  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: tooltipDefaults },
    scales: {
      x: { grid: { display: false }, ticks: { color: C.muted, font: { size: 11 } } },
      y: { grid: { color: "#f0f0f0" }, ticks: { color: C.muted, font: { size: 11 } }, beginAtZero: true },
    },
  };
  const donutOptions = {
    cutout: "75%",
    responsive: true,
    plugins: { legend: { display: false }, tooltip: tooltipDefaults },
    elements: { arc: { borderJoinStyle: 'round' as const } }
  };

  const trendData = {
    labels: sentimentTrend.map(s => s.month),
    datasets: [
      { label: "Positive %", data: sentimentTrend.map(s => s.positive), borderColor: C.pos, backgroundColor: "url(#posGradient)", fill: true, tension: 0.5, pointRadius: 4, pointBackgroundColor: "#fff", pointBorderWidth: 2 },
      { label: "Neutral %", data: sentimentTrend.map(s => s.neutral), borderColor: C.neu, backgroundColor: "transparent", fill: false, tension: 0.5, pointRadius: 3, borderDash: [5, 5] },
      { label: "Negative %", data: sentimentTrend.map(s => s.negative), borderColor: C.neg, backgroundColor: "transparent", fill: false, tension: 0.5, pointRadius: 3 },
    ],
  };
  const trendOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: C.muted, font: { size: 10 }, usePointStyle: true, pointStyle: "circle" } }, tooltip: tooltipDefaults },
    scales: {
      x: { grid: { display: false }, ticks: { color: C.muted, font: { size: 10 } } },
      y: { grid: { color: "#f0f0f0" }, ticks: { color: C.muted, font: { size: 10 }, callback: (v: any) => v + "%" }, min: 0, max: 100 },
    },
  };

  const deptLabels = Object.keys(deptSentiment);
  const deptBarData = {
    labels: deptLabels,
    datasets: [
      { label: "Positive", data: deptLabels.map(d => deptSentiment[d]?.positive || 0), backgroundColor: C.pos, borderRadius: 4, borderSkipped: false as const },
      { label: "Neutral", data: deptLabels.map(d => deptSentiment[d]?.neutral || 0), backgroundColor: C.neu, borderRadius: 4, borderSkipped: false as const },
      { label: "Negative", data: deptLabels.map(d => deptSentiment[d]?.negative || 0), backgroundColor: C.neg, borderRadius: 4, borderSkipped: false as const },
    ],
  };
  const deptBarOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: C.muted, font: { size: 10 }, usePointStyle: true, pointStyle: "circle" } }, tooltip: tooltipDefaults },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { color: C.muted, font: { size: 10 } } },
      y: { stacked: true, grid: { color: "#f0f0f0" }, ticks: { color: C.muted, font: { size: 10 } }, beginAtZero: true },
    },
  };

  const totCount = useCountUp(total);
  const posPercent = useCountUp(data?.positivePercent ?? 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes slideUp  { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
        @keyframes scaleIn  { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }
        @keyframes pulse    { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
        @keyframes skeleton { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        * { font-family: 'Inter', sans-serif; }
        .skeleton {
            background: linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: skeleton 1.5s infinite linear;
            border-radius: 8px;
        }
      `}</style>

      {/* SVG filter for chart gradient */}
      <svg width="0" height="0">
        <defs>
          <linearGradient id="posGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4CA695" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#4CA695" stopOpacity={0.0} />
          </linearGradient>
        </defs>
      </svg>

      {/* Review detail modal */}
      {modalReview && <ReviewModal review={modalReview} onClose={() => setModalReview(null)} />}

      <Box sx={{ color: C.text }}>
        {/* Page header */}
        <Box sx={{ mb: "40px", animation: "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both" }}>
          <Typography sx={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: C.muted, mb: "12px", fontWeight: 700 }}>
            HR Dashboard
          </Typography>
          <Typography variant="h3" sx={{
            fontWeight: 800, mb: "8px", letterSpacing: "-0.03em",
            background: "linear-gradient(135deg, #111 0%, #444 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>
            WorkPulse Insights
          </Typography>
          <Typography sx={{ color: C.muted, fontSize: "15px", maxWidth: "600px" }}>
            Organization-wide analytics, department health, and employee review summaries in real-time.
          </Typography>
        </Box>

        {loading && (
          <Grid container spacing={2.5}>
            {[...Array(5)].map((_, i) => (
              <Grid item xs={6} sm={4} md={2.4} key={i}>
                <Box className="skeleton" sx={{ height: 110, borderRadius: "16px" }} />
              </Grid>
            ))}
            <Grid item xs={12} md={8}><Box className="skeleton" sx={{ height: 320, borderRadius: "20px" }} /></Grid>
            <Grid item xs={12} md={4}><Box className="skeleton" sx={{ height: 320, borderRadius: "20px" }} /></Grid>
          </Grid>
        )}
        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: "10px" }}>{error}</Alert>}

        {data && !loading && (
          <Grid container spacing={2.5}>

            {/* KPI Cards */}
            <Grid item xs={6} sm={4} md={2.4}><StatCard label="Total Reviews" value={totCount} delay="0s" /></Grid>
            <Grid item xs={6} sm={4} md={2.4}><StatCard label="This Month" value={data?.thisMonth ?? 0} delay="0.07s" /></Grid>
            <Grid item xs={6} sm={4} md={2.4}><StatCard label="Positive %" value={posPercent} suffix="%" delay="0.14s" /></Grid>
            <Grid item xs={6} sm={4} md={2.4}><StatCard label="Avg Rating" value={Math.round(avgRating * 10) / 10} suffix="/5" delay="0.21s" /></Grid>
            <Grid item xs={6} sm={4} md={2.4}><StatCard label="High Priority" value={highPriority} delay="0.28s" /></Grid>

            {/* Sentiment Trend */}
            <Grid item xs={12} md={8}>
              <Panel title="Sentiment Trend">
                <Box sx={{ height: 240 }}>
                  {sentimentTrend.length > 0
                    ? <Line data={trendData} options={trendOptions as any} />
                    : <Typography sx={{ color: C.muted, fontSize: "13px" }}>No trend data available yet.</Typography>
                  }
                </Box>
              </Panel>
            </Grid>

            {/* Sentiment Doughnut */}
            <Grid item xs={12} md={4}>
              <Panel title="Sentiment Distribution">
                <Box sx={{ position: "relative", maxWidth: 200, mx: "auto", mb: 2 }}>
                  <Doughnut data={doughnutData} options={donutOptions} />
                  <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
                    <Typography sx={{ fontSize: "1.8rem", fontWeight: 800, color: C.text, lineHeight: 1 }}>{total}</Typography>
                    <Typography sx={{ fontSize: "9px", color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>total</Typography>
                  </Box>
                </Box>
                <Stack spacing={1.2}>
                  {sentSlices.map(s => (
                    <Box key={s.name} sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                      <Typography sx={{ fontSize: "11px", color: C.muted, flex: 1 }}>{s.name}</Typography>
                      <Box sx={{ flex: 2, height: 3, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                        <Box sx={{ height: "100%", background: s.color, borderRadius: 2, width: `${total > 0 ? (s.value / total) * 100 : 0}%`, transition: "width 1s ease" }} />
                      </Box>
                      <Typography sx={{ fontSize: "11px", color: C.text, fontWeight: 700, width: 14 }}>{s.value}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Panel>
            </Grid>

            {/* Department Sentiment */}
            <Grid item xs={12} md={6}>
              <Panel title="Department Sentiment" delay="0.2s">
                <Box sx={{ height: 250 }}>
                  {deptLabels.length > 0
                    ? <Bar data={deptBarData} options={deptBarOptions as any} />
                    : <Typography sx={{ color: C.muted, fontSize: "13px" }}>No department data yet.</Typography>
                  }
                </Box>
              </Panel>
            </Grid>

            {/* Sentiment Volume */}
            <Grid item xs={12} md={6}>
              <Panel title="Sentiment Volume" delay="0.2s">
                <Box sx={{ height: 250 }}><Bar data={barData} options={barOptions as any} /></Box>
              </Panel>
            </Grid>

            {/* Top Strengths */}
            <Grid item xs={12} md={4}>
              <Panel title="Top Strengths (Org-wide)" delay="0.3s">
                {topStrengths.length === 0
                  ? <Typography sx={{ color: C.muted, fontSize: "13px" }}>No strengths data yet.</Typography>
                  : <Stack spacing={1}>{topStrengths.map(([name, count], i) => <SkillPill key={name} name={name} count={count} idx={i} color={C.emerald} />)}</Stack>
                }
              </Panel>
            </Grid>

            {/* Top Improvements */}
            <Grid item xs={12} md={4}>
              <Panel title="Top Improvements (Org-wide)" delay="0.3s">
                {topImprovements.length === 0
                  ? <Typography sx={{ color: C.muted, fontSize: "13px" }}>No improvements data yet.</Typography>
                  : <Stack spacing={1}>{topImprovements.map(([name, count], i) => <SkillPill key={name} name={name} count={count} idx={i} color={C.amber} />)}</Stack>
                }
              </Panel>
            </Grid>

            {/* Topic Cloud */}
            <Grid item xs={12} md={4}>
              <Panel title="Topic Cloud" minH={100} delay="0.3s">
                {topicFreq.length === 0
                  ? <Typography sx={{ color: C.muted, fontSize: "13px" }}>No topics yet.</Typography>
                  : <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                    {topicFreq.map(([topic, count], i) => <TopicPill key={topic} topic={topic} count={count} max={maxFreq} idx={i} />)}
                  </Box>
                }
              </Panel>
            </Grid>

            {/* Employee Reviews — clickable cards */}
            <Grid item xs={12}>
              <Panel title={`Employee Reviews (${filteredReviews.length}) — click any card to expand`} delay="0.4s">
                <Box
                  component="input"
                  placeholder="Search by name or department…"
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                  sx={{
                    width: "100%", mb: "16px", display: "block",
                    background: "#F4F1E1", border: `1px solid ${C.border}`,
                    borderRadius: "9px", p: "10px 16px",
                    color: C.text, fontSize: "13px", outline: "none",
                    transition: "border-color 0.2s",
                    "&:focus": { borderColor: C.text },
                  }}
                />
                {filteredReviews.length === 0
                  ? <Typography sx={{ color: C.muted, fontSize: "13px" }}>
                    {displayReviews.length === 0 ? "No reviews yet — submit some feedback first." : "No results match your search."}
                  </Typography>
                  : <Stack spacing={1.5}>
                    {filteredReviews.map((r, i) => (
                      <EmployeeCard key={i} review={r} idx={i} onOpen={() => setModalReview(r)} />
                    ))}
                  </Stack>
                }
              </Panel>
            </Grid>

          </Grid>
        )}
      </Box>
    </>
  );
};

export default InsightsPage;
