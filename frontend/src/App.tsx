import React from "react";
import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import {
  AppBar, Box, Button, Chip, Container, Divider, Toolbar, Typography,
} from "@mui/material";

import FeedbackPage        from "./pages/FeedbackPage";
import InsightsPage        from "./pages/InsightsPage";
import ManagerDashboardPage from "./pages/ManagerDashboardPage";
import MyReviewsPage       from "./pages/MyReviewsPage";
import LoginPage           from "./pages/LoginPage";
import GrowthRoadmapPage   from "./pages/GrowthRoadmapPage";
import { ProtectedRoute }  from "./auth/ProtectedRoute";
import { useAuth }         from "./auth/AuthContext";

const AppContent: React.FC = () => {
  const location = useLocation();
  const { user, can, roleName, signOut } = useAuth();

  const navBtn = (label: string, to: string) => {
    const active = location.pathname === to;
    return (
      <Button
        key={to}
        component={Link}
        to={to}
        size="small"
        sx={{
          color: active ? "#3D9E8C" : "#5A7070",
          backgroundColor: active ? "rgba(61,158,140,0.1)" : "transparent",
          borderRadius: "8px",
          fontWeight: active ? 700 : 500,
          fontSize: "13px",
          px: 1.5,
          "&:hover": { backgroundColor: "rgba(61,158,140,0.08)", color: "#3D9E8C" },
        }}
      >
        {label}
      </Button>
    );
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#F0EDE6" }}>
      {user && (
        <AppBar
          position="static"
          elevation={0}
          sx={{
            backgroundColor: "#FAF8F4",
            borderBottom: "1px solid #E8E2D9",
          }}
        >
          <Toolbar sx={{ gap: 0.5 }}>
            {/* Logo */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mr: 3 }}>
              <Box sx={{
                width: 34, height: 34, borderRadius: "10px",
                backgroundColor: "#3D9E8C",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "15px" }}>WP</Typography>
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: "15px", color: "#2C3A3A", letterSpacing: "-0.02em" }}>
                WorkPulse
              </Typography>
            </Box>

            {/* Nav links */}
            {navBtn("Feedback", "/")}
            {navBtn("My Reviews", "/my-reviews")}
            {navBtn("Growth Plan", "/roadmap")}
            {can.viewTeamDashboard && navBtn("Team Dashboard", "/team-dashboard")}
            {can.viewInsights && navBtn("Insights", "/insights")}

            <Box sx={{ flexGrow: 1 }} />

            {/* Role + user */}
            <Chip
              label={roleName}
              size="small"
              sx={{ backgroundColor: "rgba(61,158,140,0.12)", color: "#3D9E8C", fontWeight: 600, fontSize: "11px", mr: 1 }}
            />
            <Typography sx={{ fontSize: "13px", color: "#5A7070", mr: 1.5, display: { xs: "none", sm: "block" } }}>
              {user.name}
            </Typography>
            <Divider orientation="vertical" flexItem sx={{ borderColor: "#E8E2D9", mr: 1.5 }} />
            <Button
              size="small"
              onClick={signOut}
              sx={{
                color: "#E8857A", fontSize: "13px", fontWeight: 600,
                "&:hover": { backgroundColor: "rgba(232,133,122,0.08)" },
              }}
            >
              Sign Out
            </Button>
          </Toolbar>
        </AppBar>
      )}

      <Container maxWidth="lg" sx={{ flexGrow: 1, py: 5 }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><FeedbackPage /></ProtectedRoute>} />
          <Route path="/my-reviews" element={<ProtectedRoute><MyReviewsPage /></ProtectedRoute>} />
          <Route path="/roadmap" element={<ProtectedRoute><GrowthRoadmapPage /></ProtectedRoute>} />
          <Route path="/team-dashboard" element={
            <ProtectedRoute>
              {can.viewTeamDashboard ? <ManagerDashboardPage /> : <Navigate to="/" replace />}
            </ProtectedRoute>
          } />
          <Route path="/insights" element={
            <ProtectedRoute>
              {can.viewInsights ? <InsightsPage /> : <Navigate to="/" replace />}
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>

      {user && (
        <Box component="footer" sx={{ py: 2.5, textAlign: "center", borderTop: "1px solid #E8E2D9", backgroundColor: "#FAF8F4" }}>
          <Typography sx={{ fontSize: "12px", color: "#9AADA8" }}>
            Powered by Amazon Bedrock &amp; AWS Serverless
          </Typography>
        </Box>
      )}
    </Box>
  );
};

const App: React.FC = () => <AppContent />;
export default App;