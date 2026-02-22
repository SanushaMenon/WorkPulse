import React, { useEffect, useMemo, useState } from "react";
import { Alert, Box, CircularProgress, Rating, Stack, Typography } from "@mui/material";
import { fetchMyReviews, MyReview } from "../api";

/* ── Colour palette (B&W to match App theme) ─────────────────────────────── */
const C = {
    surface: "#ffffff",
    bg: "#f5f5f5",
    border: "#e0e0e0",
    text: "#111111",
    muted: "#666666",
    muted2: "#cccccc",
    pos: "#2d6a4f",
    neu: "#555555",
    neg: "#b91c1c",
};

const SENT: Record<string, { color: string; bg: string; label: string; dot: string }> = {
    positive: { color: C.pos, bg: "#f0fdf4", label: "Positive", dot: "#16a34a" },
    neutral: { color: C.neu, bg: "#f5f5f5", label: "Neutral", dot: "#888888" },
    negative: { color: C.neg, bg: "#fef2f2", label: "Negative", dot: "#dc2626" },
};

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

/* ── Review detail modal ─────────────────────────────────────────────────── */
function ReviewModal({ review, onClose }: { review: MyReview; onClose: () => void }) {
    const sent = SENT[review.sentiment?.toLowerCase()] || SENT.neutral;

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

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
                background: "rgba(0,0,0,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                p: "24px", animation: "fadeIn 0.18s ease",
            }}
        >
            <Box sx={{
                background: "#fff", borderRadius: "18px",
                width: "100%", maxWidth: 680,
                maxHeight: "88vh", overflowY: "auto",
                boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
                animation: "scaleIn 0.2s ease",
            }}>

                {/* Modal header */}
                <Box sx={{
                    p: "24px 28px 20px", borderBottom: `1px solid ${C.border}`,
                    display: "flex", alignItems: "flex-start",
                    justifyContent: "space-between", gap: "16px",
                    position: "sticky", top: 0, background: "#fff", zIndex: 1,
                    borderRadius: "18px 18px 0 0",
                }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <Box sx={{
                            width: 48, height: 48, borderRadius: "12px", background: C.text,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "16px", fontWeight: 700, color: "#fff", fontFamily: "monospace", flexShrink: 0,
                        }}>
                            {getInitials(review.employeeName || "?")}
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: "18px", color: C.text }}>
                                {review.employeeName || "Unknown Employee"}
                            </Typography>
                            <Typography sx={{ fontSize: "12px", color: C.muted, mt: "2px" }}>
                                {[review.department, review.reviewPeriod, review.timestamp].filter(Boolean).join(" · ") || "—"}
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                        <Box sx={{
                            border: `1px solid ${sent.dot}40`, borderRadius: "999px",
                            px: "12px", py: "4px", background: sent.bg,
                            display: "flex", alignItems: "center", gap: "6px",
                        }}>
                            <Box sx={{ width: 7, height: 7, borderRadius: "50%", background: sent.dot }} />
                            <Typography sx={{ fontSize: "11px", fontWeight: 600, color: sent.color, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                {sent.label}
                            </Typography>
                        </Box>
                        <Box onClick={onClose} sx={{
                            width: 32, height: 32, borderRadius: "8px", background: "#f5f5f5",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", fontSize: "20px", color: C.muted, lineHeight: 1,
                            "&:hover": { background: "#e0e0e0", color: C.text }, transition: "background 0.15s",
                        }}>
                            ×
                        </Box>
                    </Box>
                </Box>

                {/* Modal body */}
                <Box sx={{ p: "24px 28px" }}>

                    {/* Priority badge */}
                    {review.priority_level && (
                        <Box sx={{ mb: "20px" }}>
                            <Box sx={{
                                display: "inline-flex", alignItems: "center", gap: "6px",
                                border: `1px solid ${review.priority_level === "high" ? "#dc2626" : C.border}`,
                                borderRadius: "999px", px: "12px", py: "5px",
                                background: review.priority_level === "high" ? "#fef2f2" : "#f5f5f5",
                            }}>
                                <Box sx={{ width: 6, height: 6, borderRadius: "50%", background: review.priority_level === "high" ? "#dc2626" : C.muted }} />
                                <Typography sx={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: review.priority_level === "high" ? "#b91c1c" : C.muted }}>
                                    {review.priority_level} priority
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {/* Rating */}
                    {review.rating > 0 && (
                        <Box sx={{ mb: "20px" }}>
                            <Typography sx={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, mb: "8px", fontWeight: 700 }}>Rating</Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <Rating value={review.rating} readOnly
                                    sx={{ "& .MuiRating-iconFilled": { color: C.text }, "& .MuiRating-iconEmpty": { color: C.muted2 } }} />
                                <Typography sx={{ fontWeight: 700, fontSize: "15px", color: C.text }}>{review.rating} / 5</Typography>
                            </Box>
                        </Box>
                    )}

                    {/* AI Summary */}
                    <Box sx={{ mb: "24px" }}>
                        <Typography sx={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, mb: "10px", fontWeight: 700 }}>AI Summary</Typography>
                        <Typography sx={{
                            fontSize: "14px", lineHeight: 1.9, color: C.text,
                            background: sent.bg, borderLeft: `3px solid ${sent.dot}`,
                            pl: "16px", py: "14px", pr: "16px", borderRadius: "0 10px 10px 0",
                        }}>
                            {review.summary || "No AI summary available for this review."}
                        </Typography>
                    </Box>

                    {/* Strengths & Improvements */}
                    {(review.strengths?.length > 0 || review.improvements?.length > 0) && (
                        <Box sx={{ display: "flex", gap: "16px", mb: "24px", flexWrap: "wrap" }}>
                            {review.strengths?.length > 0 && (
                                <Box sx={{ flex: 1, minWidth: 220 }}>
                                    <Typography sx={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, mb: "10px", fontWeight: 700 }}>Strengths</Typography>
                                    <Stack spacing={1}>
                                        {review.strengths.map((s, i) => (
                                            <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: "8px", p: "8px 12px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #16a34a20" }}>
                                                <Box sx={{ width: 5, height: 5, borderRadius: "50%", background: "#16a34a", flexShrink: 0, mt: "7px" }} />
                                                <Typography sx={{ fontSize: "12px", color: C.text, lineHeight: 1.6 }}>{s}</Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            )}
                            {review.improvements?.length > 0 && (
                                <Box sx={{ flex: 1, minWidth: 220 }}>
                                    <Typography sx={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, mb: "10px", fontWeight: 700 }}>Areas to Improve</Typography>
                                    <Stack spacing={1}>
                                        {review.improvements.map((s, i) => (
                                            <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: "8px", p: "8px 12px", background: "#fff7ed", borderRadius: "8px", border: "1px solid #ea580c20" }}>
                                                <Box sx={{ width: 5, height: 5, borderRadius: "50%", background: "#ea580c", flexShrink: 0, mt: "7px" }} />
                                                <Typography sx={{ fontSize: "12px", color: C.text, lineHeight: 1.6 }}>{s}</Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* ── Growth Roadmap ───────────────────────────────────────── */}
                    {hasGrowthPlan && (
                        <Box sx={{ background: "#fafafa", border: `1px solid ${C.border}`, borderRadius: "14px", p: "20px 24px", mb: "8px" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mb: "20px" }}>
                                <Typography sx={{ fontSize: "18px" }}>🗺️</Typography>
                                <Typography sx={{ fontWeight: 700, fontSize: "15px", color: C.text }}>
                                    Your Growth Roadmap
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
                                dotColor="#2563eb"
                                bg="#eff6ff"
                            />
                            <RoadmapSection
                                title="Long-Term Development (3–12 months)"
                                items={gp.long_term_development ?? []}
                                dotColor="#7c3aed"
                                bg="#f5f3ff"
                            />
                        </Box>
                    )}

                    {/* Topics */}
                    {review.topics && review.topics.length > 0 && (
                        <Box sx={{ mt: "20px" }}>
                            <Typography sx={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, mb: "10px", fontWeight: 700 }}>Topics</Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {review.topics.map((t, i) => (
                                    <Box key={i} sx={{ border: `1px solid ${C.border}`, borderRadius: "999px", px: "12px", py: "4px", fontSize: "12px", color: C.text, background: "#fafafa" }}>
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

/* ── Review list card (clickable) ────────────────────────────────────────── */
function ReviewCard({ review, idx, onOpen }: { review: MyReview; idx: number; onOpen: () => void }) {
    const sent = SENT[review.sentiment?.toLowerCase()] || SENT.neutral;
    const gp = review.growth_plan || {};
    const roadmapCount = (gp.immediate_actions?.length ?? 0) + (gp.short_term_goals?.length ?? 0) + (gp.long_term_development?.length ?? 0);

    return (
        <Box
            onClick={onOpen}
            sx={{
                border: `1px solid ${C.border}`, borderRadius: "12px",
                background: C.surface, display: "flex", alignItems: "center",
                gap: "14px", p: "14px 18px", cursor: "pointer",
                animation: `slideUp 0.4s ease ${idx * 0.06}s both`,
                transition: "box-shadow 0.2s, border-color 0.2s, transform 0.15s",
                "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.1)", borderColor: C.text, transform: "translateY(-1px)" },
            }}
        >
            {/* Avatar */}
            <Box sx={{
                width: 40, height: 40, borderRadius: "10px", flexShrink: 0,
                background: C.text, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "#fff", fontFamily: "monospace",
            }}>
                {getInitials(review.employeeName || "?")}
            </Box>

            {/* Meta */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "14px", color: C.text }}>
                    {review.employeeName || "Unknown Employee"}
                </Typography>
                <Typography sx={{ fontSize: "11px", color: C.muted, mt: "1px" }}>
                    {[review.department, review.reviewPeriod, review.timestamp].filter(Boolean).join(" · ") || "—"}
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
                <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "5px" }}>
                    <Rating value={review.rating} readOnly size="small"
                        sx={{ "& .MuiRating-iconFilled": { color: C.text }, "& .MuiRating-iconEmpty": { color: C.muted2 } }} />
                    <Typography sx={{ fontSize: "11px", color: C.muted }}>{review.rating}/5</Typography>
                </Box>
            )}

            {/* Sentiment */}
            <Box sx={{
                flexShrink: 0, border: `1px solid ${sent.dot}30`, borderRadius: "999px",
                px: "10px", py: "4px", background: sent.bg,
                display: "flex", alignItems: "center", gap: "5px",
            }}>
                <Box sx={{ width: 6, height: 6, borderRadius: "50%", background: sent.dot, flexShrink: 0 }} />
                <Typography sx={{ fontSize: "10px", fontWeight: 600, color: sent.color, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {sent.label}
                </Typography>
            </Box>

            <Typography sx={{ color: C.muted2, fontSize: "16px", flexShrink: 0 }}>›</Typography>
        </Box>
    );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
const MyReviewsPage: React.FC = () => {
    const [data, setData] = useState<{ count: number; reviews: MyReview[] } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modal, setModal] = useState<MyReview | null>(null);

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

    const reviews = useMemo(() => data?.reviews ?? [], [data]);

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.96); } to { opacity:1; transform:scale(1); } }
        * { font-family: 'Inter', sans-serif; }
      `}</style>

            {modal && <ReviewModal review={modal} onClose={() => setModal(null)} />}

            <Box sx={{ color: C.text, maxWidth: 700, mx: "auto" }}>

                {/* Page header */}
                <Box sx={{ mb: "32px", animation: "slideUp 0.4s ease both" }}>
                    <Typography sx={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: C.muted, mb: "8px" }}>
                        My Workspace
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: C.text, mb: "6px", letterSpacing: "-0.02em" }}>
                        Feedback &amp; Growth Roadmap
                    </Typography>
                    <Typography sx={{ color: C.muted, fontSize: "13px" }}>
                        Click any review card to see your full AI summary, strengths, improvement areas, and personalised growth roadmap.
                    </Typography>
                </Box>

                {loading && <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress sx={{ color: C.text }} /></Box>}
                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: "10px" }}>{error}</Alert>}

                {data && !loading && (
                    <Box sx={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "14px", p: "24px", animation: "slideUp 0.5s ease 0.1s both" }}>
                        <Typography sx={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, color: C.muted, mb: "12px" }}>
                            Reviews about you ({reviews.length})
                        </Typography>
                        <Box sx={{ height: "1px", background: C.border, mb: "20px" }} />

                        {reviews.length === 0
                            ? <Typography sx={{ color: C.muted, fontSize: "13px" }}>No reviews found about you yet.</Typography>
                            : <Stack spacing={1.5}>
                                {reviews.map((r, i) => (
                                    <ReviewCard key={r.feedbackId || i} review={r} idx={i} onOpen={() => setModal(r)} />
                                ))}
                            </Stack>
                        }
                    </Box>
                )}
            </Box>
        </>
    );
};

export default MyReviewsPage;
