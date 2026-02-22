import axios from "axios";
import { getAccessToken, getStoredSession } from "./auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const session = getStoredSession();
  const token = session?.idToken;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = token;
  }
  return config;
});

export interface FeedbackPayload {
  message: string;
  employeeName: string;
  employeeEmail: string;
  department?: string;
  reviewPeriod?: string;
  rating?: number;
}

export interface InsightsResponse {
  totalSubmissions: number;
  thisMonth?: number;
  positivePercent?: number;
  topTopic?: string;
  sentimentCounts: {
    positive: number;
    negative: number;
    neutral: number;
  };
  summaries?: string[];
  recentSummaries?: Array<{
    summary: string;
    sentiment: string;
    topics: string[];
    timestamp: string;
  }>;
  reviews?: Array<{
    employeeName: string;
    department: string;
    reviewPeriod: string;
    rating: number;
    sentiment: string;
    summary: string;
    topics: string[];
    growth_plan?: {
      immediate_actions?: string[];
      short_term_goals?: string[];
      long_term_development?: string[];
    };
    timestamp: string;
  }>;
  topTopics?: Array<{ topic: string; count: number }>;
  sentimentTrend?: Array<{
    month: string;
    positive: number;
    negative: number;
    neutral: number;
  }>;
  topics: string[];
  // Executive metrics (HR only)
  averageRating?: number;
  highPriorityCount?: number;
  departmentSentiment?: Record<string, { positive: number; neutral: number; negative: number }>;
  topStrengths?: Array<[string, number]>;
  topImprovements?: Array<[string, number]>;
}

export interface MyReview {
  feedbackId: string;
  employeeName: string;
  employeeEmail: string;
  department: string;
  reviewPeriod: string;
  rating: number;
  sentiment: string;
  summary: string;
  topics: string[];
  strengths: string[];
  improvements: string[];
  priority_level: string;
  growth_plan: {
    immediate_actions?: string[];
    short_term_goals?: string[];
    long_term_development?: string[];
  };
  timestamp: string;
  aiProcessed: boolean;
}

export interface MyReviewsResponse {
  count: number;
  reviews: MyReview[];
}

export async function submitFeedback(payload: FeedbackPayload) {
  const res = await api.post(`/feedback`, payload);
  return res.data;
}

export async function fetchInsights(): Promise<InsightsResponse> {
  const res = await api.get(`/insights`);
  return res.data;
}

export async function fetchMyReviews(): Promise<MyReviewsResponse> {
  const res = await api.get(`/my-reviews`);
  return res.data;
}
