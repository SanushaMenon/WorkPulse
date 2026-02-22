import React, { useEffect, useMemo, useState } from "react";
import { Alert, Box, CircularProgress, Rating, Stack, Typography } from "@mui/material";
import { fetchMyReviews, MyReview } from "../api";

/* ── Colour palette (classic B&W with premium depth) ─────────────────────────────── */
const C = {
    surface: "#ffffff",
    bg: "#F4F1E1",           // Cream
    border: "#597E9420",     // 12% opacity slate
    text: "#597E94",         // Slate Blue
    muted: "#597E94cc",      // 80% opacity slate
    muted2: "#597E9466",     // 40% opacity slate
    pos: "#4CA695",          // Teal for positive
    neu: "#597E94",          // Slate for neutral
    neg: "#EC8C8C",          // Coral Pink for negative
};

const SENT: Record<string, { color: string; bg: string; label: string; dot: string; shadow: string }> = {
    positive: { color: C.pos, bg: "#4CA6951A", label: "Positive", dot: C.pos, shadow: "#4CA69533" }, // 10% and 20% opacity teal
    neutral: { color: C.neu, bg: "#597E941A", label: "Neutral", dot: C.neu, shadow: "#597E9433" },  // 10% and 20% opacity slate
    negative: { color: C.neg, bg: "#EC8C8C1A", label: "Negative", dot: C.neg, shadow: "#EC8C8C33" }, // 10% and 20% opacity coral
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
                background: "rgba(0,0,0,0.3)", backdropFilter: "blur(6px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                p: "24px", animation: "fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
        >
            <Box sx={{
                background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(24px)",
                borderRadius: "24px",
                width: "100%", maxWidth: 680,
                maxHeight: "88vh", overflowY: "auto",
                boxShadow: "0 32px 100px rgba(89, 126, 148, 0.15), 0 0 0 1px rgba(0,0,0,0.05) inset",
                animation: "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            }}>

                {/* Modal header */}
                <Box sx={{
                    p: "28px 32px 24px", borderBottom: `1px solid ${C.border}`,
                    display: "flex", alignItems: "flex-start",
                    justifyContent: "space-between", gap: "16px",
                    position: "sticky", top: 0,
                    background: "linear-gradient(180deg, #fff 0%, #fafafa 100%)", zIndex: 1,
                    borderRadius: "24px 24px 0 0",
                }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <Box sx={{
                            width: 52, height: 52, borderRadius: "14px",
                            background: "linear-gradient(135deg, #4CA695 0%, #597E94 100%)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "16px", fontWeight: 700, color: "#fff",
                            letterSpacing: "1px", flexShrink: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
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
                    <Box sx={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
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
                        <Box onClick={onClose} sx={{
                            width: 36, height: 36, borderRadius: "10px", background: "rgba(0,0,0,0.04)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", fontSize: "20px", color: C.muted, border: "1px solid transparent",
                            "&:hover": { background: "#fff", color: C.text, borderColor: C.border, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
                            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                        }}>
                            ×
                        </Box>
                    </Box>
                </Box>

                {/* Modal body */}
                <Box sx={{ p: "32px" }}>

                    {/* Priority badge */}
                    {review.priority_level && (
                        <Box sx={{ mb: "24px" }}>
                            <Box sx={{
                                display: "inline-flex", alignItems: "center", gap: "6px",
                                border: `1px solid ${review.priority_level === "high" ? "rgba(239, 68, 68, 0.2)" : C.border}`,
                                borderRadius: "999px", px: "14px", py: "6px",
                                background: review.priority_level === "high" ? "rgba(239, 68, 68, 0.08)" : "#fafafa",
                            }}>
                                <Box sx={{ width: 6, height: 6, borderRadius: "50%", background: review.priority_level === "high" ? C.neg : C.muted }} />
                                <Typography sx={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: review.priority_level === "high" ? C.neg : C.muted }}>
                                    {review.priority_level} priority
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {/* Rating */}
                    {review.rating > 0 && (
                        <Box sx={{ mb: "24px" }}>
                            <Typography sx={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, mb: "10px", fontWeight: 700 }}>Rating</Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <Rating value={review.rating} readOnly
                                    sx={{ "& .MuiRating-iconFilled": { color: C.text }, "& .MuiRating-iconEmpty": { color: C.muted2 } }} />
                                <Typography sx={{ fontWeight: 700, fontSize: "15px", color: C.text }}>{review.rating} / 5</Typography>
                            </Box>
                        </Box>
                    )}

                    {/* AI Summary */}
                    <Box sx={{ mb: "28px" }}>
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
                        <Box sx={{ background: "#fafafa", border: `1px solid ${C.border}`, borderRadius: "14px", p: "24px 28px", mb: "24px" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: "10px", mb: "24px" }}>
                                <Typography sx={{ fontSize: "20px" }}>🗺️</Typography>
                                <Typography sx={{ fontWeight: 800, fontSize: "16px", color: C.text }}>
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
                                dotColor="#597E94"
                                bg="#597E940a"
                            />
                            <RoadmapSection
                                title="Long-Term Development (3–12 months)"
                                items={gp.long_term_development ?? []}
                                dotColor="#EC8C8C"
                                bg="#EC8C8C0a"
                            />
                        </Box>
                    )}

                    {/* Topics */}
                    {review.topics && review.topics.length > 0 && (
                        <Box sx={{ mt: "24px" }}>
                            <Typography sx={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, mb: "12px", fontWeight: 700 }}>Topics</Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {review.topics.map((t, i) => (
                                    <Box key={i} sx={{ border: `1px solid ${C.border}`, borderRadius: "999px", px: "14px", py: "6px", fontSize: "13px", color: C.text, background: "#fafafa" }}>
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
                justifyContent: "center", fontSize: "14px", fontWeight: 700, color: "#fff", letterSpacing: "1px"
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
                flexShrink: 0, border: `1px solid ${sent.shadow}`, borderRadius: "999px",
                px: "12px", py: "5px", background: sent.bg,
                display: "flex", alignItems: "center", gap: "6px",
            }}>
                <Box sx={{ width: 6, height: 6, borderRadius: "50%", background: sent.dot, flexShrink: 0, boxShadow: `0 0 6px ${sent.dot}` }} />
                <Typography sx={{ fontSize: "10px", fontWeight: 700, color: sent.dot, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                    {sent.label}
                </Typography>
            </Box>

            <Typography sx={{ color: C.muted2, fontSize: "18px", flexShrink: 0, ml: "4px" }}>→</Typography>
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
        @keyframes slideUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }
        @keyframes skeleton { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        * { font-family: 'Inter', sans-serif; }
        .skeleton {
            background: linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: skeleton 1.5s infinite linear;
            border-radius: 8px;
        }
      `}</style>

            {modal && <ReviewModal review={modal} onClose={() => setModal(null)} />}

            <Box sx={{ color: C.text, maxWidth: 700, mx: "auto" }}>

                {/* Page header */}
                <Box sx={{ mb: "40px", animation: "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both" }}>
                    <Typography sx={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: C.muted, mb: "12px", fontWeight: 700 }}>
                        My Workspace
                    </Typography>
                    <Typography variant="h3" sx={{
                        fontWeight: 800, mb: "8px", letterSpacing: "-0.03em",
                        background: "linear-gradient(135deg, #597E94 0%, #4CA695 100%)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
                    }}>
                        Feedback &amp; Growth Roadmap
                    </Typography>
                    <Typography sx={{ color: C.muted, fontSize: "15px" }}>
                        Click any review card to see your full AI summary, strengths, improvement areas, and personalised growth roadmap.
                    </Typography>
                </Box>

                {loading && (
                    <Box sx={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "20px", p: "24px" }}>
                        <Box sx={{ height: 20, width: 140, mb: "24px", borderRadius: "4px" }} className="skeleton" />
                        <Stack spacing={2}>
                            {[...Array(3)].map((_, i) => <Box key={i} className="skeleton" sx={{ height: 76, borderRadius: "16px" }} />)}
                        </Stack>
                    </Box>
                )}
                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: "10px" }}>{error}</Alert>}

                {data && !loading && (
                    <Box sx={{
                        background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(12px)",
                        border: `1px solid rgba(89, 126, 148, 0.12)`,
                        borderRadius: "24px", p: "28px",
                        animation: "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both",
                        boxShadow: "0 12px 40px rgba(89, 126, 148, 0.05), 0 2px 8px rgba(0,0,0,0.02)",
                        transition: "all 0.3s ease",
                        "&:hover": { boxShadow: "0 20px 50px rgba(89, 126, 148, 0.08)" }
                    }}>
                        <Typography sx={{ fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, color: C.muted, mb: "14px" }}>
                            Reviews about you ({reviews.length})
                        </Typography>
                        <Box sx={{ height: "1px", background: "linear-gradient(90deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 100%)", mb: "24px" }} />

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
