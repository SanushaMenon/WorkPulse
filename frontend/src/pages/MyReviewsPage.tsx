import React, { useEffect, useMemo, useState } from "react";
import {
    Alert, Box, CircularProgress, Collapse, Rating, Stack, Typography,
} from "@mui/material";
import { fetchMyReviews, MyReview, MyReviewsResponse } from "../api";

const P = {
    purple: "#8b5cf6", pink: "#ec4899",
    surface: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.08)",
    text: "rgba(255,255,255,0.92)", muted: "rgba(255,255,255,0.40)", muted2: "rgba(255,255,255,0.12)",
    pos: "#a78bfa", neu: "#c084fc", neg: "#ec4899",
};
const GRAD = `linear-gradient(90deg, ${P.purple}, ${P.pink})`;

const SENT: Record<string, { color: string; bg: string; label: string; icon: string }> = {
    positive: { color: P.pos, bg: "rgba(167,139,250,0.12)", label: "Positive", icon: "✦" },
    neutral: { color: P.neu, bg: "rgba(192,132,252,0.10)", label: "Neutral", icon: "◈" },
    negative: { color: P.neg, bg: "rgba(236,72,153,0.12)", label: "Negative", icon: "▼" },
};

interface EmployeeReview {
    employeeName: string; department: string; rating: number;
    sentiment: string; summary: string; reviewPeriod: string; timestamp: string;
}

function getInitials(name: string) {
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function ReviewCard({ review, idx }: { review: EmployeeReview; idx: number }) {
    const [open, setOpen] = useState(false);
    const sent = SENT[review.sentiment?.toLowerCase()] || SENT.neutral;
    return (
        <Box sx={{
            border: `1px solid ${P.border}`, borderRadius: "14px", overflow: "hidden",
            animation: `slideUp 0.4s ease ${idx * 0.07}s both`,
            transition: "border-color 0.2s, box-shadow 0.2s",
            "&:hover": { borderColor: `${P.purple}55`, boxShadow: `0 4px 24px rgba(139,92,246,0.1)` },
        }}>
            <Box
                onClick={() => setOpen(o => !o)}
                sx={{
                    display: "flex", alignItems: "center", gap: "14px", p: "14px 18px",
                    cursor: "pointer",
                    background: open ? "rgba(139,92,246,0.08)" : P.surface,
                    transition: "background 0.2s",
                    "&:hover": { background: "rgba(139,92,246,0.07)" },
                }}
            >
                <Box sx={{ width: 40, height: 40, borderRadius: "10px", flexShrink: 0, background: GRAD, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "#fff", fontFamily: "monospace" }}>
                    {getInitials(review.employeeName || "?")}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "14px", color: P.text, fontFamily: "monospace" }}>
                        {review.employeeName || "Unknown Employee"}
                    </Typography>
                    <Typography sx={{ fontSize: "11px", color: P.muted, mt: "1px", fontFamily: "monospace" }}>
                        {[review.department, review.reviewPeriod, review.timestamp].filter(Boolean).join(" · ") || "—"}
                    </Typography>
                </Box>
                {review.rating > 0 && (
                    <Box sx={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                        <Rating value={review.rating} readOnly size="small"
                            sx={{ "& .MuiRating-iconFilled": { color: P.purple }, "& .MuiRating-iconEmpty": { color: P.muted2 } }} />
                        <Typography sx={{ fontSize: "10px", color: P.muted, fontFamily: "monospace" }}>{review.rating}/5</Typography>
                    </Box>
                )}
                <Box sx={{ flexShrink: 0, border: `1px solid ${sent.color}40`, borderRadius: "999px", px: "10px", py: "4px", background: sent.bg, display: "flex", alignItems: "center", gap: "5px" }}>
                    <Typography sx={{ fontSize: "10px", color: sent.color }}>{sent.icon}</Typography>
                    <Typography sx={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: sent.color, fontFamily: "monospace", fontWeight: 600 }}>
                        {sent.label}
                    </Typography>
                </Box>
                <Typography sx={{ color: P.muted, fontSize: "14px", flexShrink: 0, transition: "transform 0.25s", transform: open ? "rotate(180deg)" : "rotate(0deg)", userSelect: "none" }}>
                    ▾
                </Typography>
            </Box>
            <Collapse in={open}>
                <Box sx={{ px: "18px", pb: "18px", pt: "2px", borderTop: `1px solid ${P.border}`, background: "rgba(0,0,0,0.2)" }}>
                    <Typography sx={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: P.muted, fontFamily: "monospace", mt: "14px", mb: "10px" }}>
                        AI Summary
                    </Typography>
                    <Typography sx={{ fontSize: "13px", lineHeight: 1.8, color: P.text, fontFamily: "monospace", borderLeft: `3px solid ${sent.color}`, pl: "14px", py: "10px", pr: "14px", background: sent.bg, borderRadius: "0 8px 8px 0" }}>
                        {review.summary || "No AI summary available for this review."}
                    </Typography>
                </Box>
            </Collapse>
        </Box>
    );
}

const MyReviewsPage: React.FC = () => {
    const [data, setData] = useState<MyReviewsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                setData(await fetchMyReviews());
            } catch (err: any) {
                setError(err?.response?.data?.message || "Failed to load your reviews.");
            } finally { setLoading(false); }
        })();
    }, []);

    const reviews: EmployeeReview[] = useMemo(() => {
        if (!data?.reviews) return [];
        return data.reviews.map((r: MyReview) => ({
            employeeName: r.employeeName || "Unknown",
            department: r.department || "",
            rating: r.rating || 0,
            sentiment: r.sentiment || "neutral",
            summary: r.summary || "",
            reviewPeriod: r.reviewPeriod || "",
            timestamp: r.timestamp || "",
        }));
    }, [data]);

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap');
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
            <Box sx={{ color: P.text, maxWidth: 700, mx: "auto" }}>
                <Box sx={{ mb: "36px", animation: "slideUp 0.4s ease both" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mb: "10px" }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: P.purple, animation: "pulse 1.8s ease infinite" }} />
                        <Typography sx={{ fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "monospace", background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            My Reviews
                        </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: "8px", background: `linear-gradient(90deg, #fff 0%, ${P.purple} 50%, ${P.pink} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        Feedback About You
                    </Typography>
                    <Typography sx={{ color: P.muted, fontSize: "13px", fontFamily: "monospace" }}>
                        View performance reviews that were submitted about you.
                    </Typography>
                </Box>

                {loading && <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress sx={{ color: P.purple }} /></Box>}
                {error && <Alert severity="error" sx={{ mb: 3, background: "rgba(236,72,153,0.1)", color: P.pink, border: `1px solid ${P.pink}40`, fontFamily: "monospace" }}>{error}</Alert>}

                {data && !loading && (
                    <Box sx={{
                        background: P.surface, border: `1px solid ${P.border}`, backdropFilter: "blur(20px)",
                        borderRadius: "18px", p: "24px", animation: "slideUp 0.5s ease 0.1s both",
                    }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mb: "6px" }}>
                            <Box sx={{ width: 3, height: 16, borderRadius: "2px", background: GRAD }} />
                            <Typography sx={{ fontFamily: "monospace", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                                Reviews ({reviews.length})
                            </Typography>
                        </Box>
                        <Box sx={{ height: "1px", background: P.border, mb: "20px" }} />
                        {reviews.length === 0
                            ? <Typography sx={{ color: P.muted, fontSize: "13px", fontFamily: "monospace" }}>
                                No reviews found about you yet.
                            </Typography>
                            : <Stack spacing={1.5}>
                                {reviews.map((r, i) => <ReviewCard key={i} review={r} idx={i} />)}
                            </Stack>
                        }
                    </Box>
                )}
            </Box>
        </>
    );
};

export default MyReviewsPage;
