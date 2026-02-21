import axios from "axios";
import { fetchAuthSession } from "aws-amplify/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use(async (config) => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // unauthenticated — API Gateway will 401
  }
  return config;
});

// ── Types ────────────────────────────────────────────────────────────────────────

export interface FeedbackPayload {
  message: string;
  // Peer review fields — both required together if submitting about a colleague
  targetName?: string;
  targetEmail?: string;
}

export interface SummaryItem {
  summary: string;
  department: string;
}

export interface MonthlyTrendItem {
  month: string; // "YYYY-MM"
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}

export interface DepartmentScore {
  positive: number;
  negative: number;
  neutral: number;
  total: number;
  score: number; // 0-100 — % positive
}

export interface InsightsResponse {
  minimumThresholdMet: boolean;
  minimumGroupSize: number;
  totalSubmissions: number;
  role: string;
  scopedToDepartment: string | null;
  sentimentCounts?: { positive: number; negative: number; neutral: number };
  summaries?: SummaryItem[];
  topics?: string[];
  monthlyTrend?: MonthlyTrendItem[];
  departmentScores?: Record<string, DepartmentScore>; // hr-admins only
}

export interface ReviewItem {
  feedbackId: string;
  timestamp: string;
  sentiment: string | null;
  summary: string | null;
  topics: string[];
}

export interface MyReviewsResponse {
  reviews: ReviewItem[];
  totalReviews: number;
}

export interface FocusArea {
  area: string;
  reason: string;
  action: string;
}

export interface RoadmapResponse {
  hasEnoughData: boolean;
  totalSubmissions: number;
  analyzedSubmissions?: number;
  message?: string;
  currentState?: {
    dominantSentiment: string;
    trend: string;
    recurringTopics: string[];
    summary: string;
  };
  focusAreas?: FocusArea[];
  plan?: { thirtyDays: string; sixtyDays: string; ninetyDays: string };
  encouragement?: string;
}

// ── API calls ─────────────────────────────────────────────────────────────────────

export async function submitFeedback(payload: FeedbackPayload) {
  const res = await api.post("/feedback", payload);
  return res.data;
}

export async function fetchInsights(): Promise<InsightsResponse> {
  const res = await api.get("/insights");
  return res.data;
}

export async function fetchMyReviews(): Promise<MyReviewsResponse> {
  const res = await api.get("/my-reviews");
  return res.data;
}

export async function fetchRoadmap(): Promise<RoadmapResponse> {
  const res = await api.get("/my-roadmap");
  return res.data;
}
