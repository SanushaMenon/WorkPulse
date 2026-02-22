import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
  Navigate
} from "react-router-dom";
import {
  AppBar,
  Box,
  Container,
  Toolbar,
  Typography,
  Button
} from "@mui/material";

import FeedbackPage from "./pages/FeedbackPage";
import InsightsPage from "./pages/InsightsPage";
import MyReviewsPage from "./pages/MyReviewsPage";
import Login from "./Login";
import RequireAuth from "./RequireAuth";
import { isAuthenticated, isHr, signOut } from "./auth";

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [authed, setAuthed] = useState(false);
  const [hr, setHr] = useState(false);

  useEffect(() => {
    setAuthed(isAuthenticated());
    setHr(isHr());
  }, [location]);

  const handleLogout = () => {
    signOut();
    setAuthed(false);
    setHr(false);
    navigate("/login");
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "radial-gradient(circle at 15% 50%, #F4F1E1, #e8eceb)", display: "flex", flexDirection: "column" }}>

      {/* Navbar */}
      {authed && (
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            top: 0,
            background: "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(89, 126, 148, 0.1)",
            zIndex: 1100,
          }}
        >
          <Toolbar>
            {/* Logo mark */}
            <Box sx={{
              width: 36, height: 36, borderRadius: "10px",
              background: "linear-gradient(135deg, #4CA695 0%, #3A8576 100%)",
              display: "flex", alignItems: "center",
              justifyContent: "center", mr: 1.5, flexShrink: 0,
              boxShadow: "0 4px 12px rgba(76, 166, 149, 0.25)"
            }}>
              <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "16px", fontFamily: "monospace", letterSpacing: "1px" }}>W</Typography>
            </Box>

            <Typography
              variant="h6"
              sx={{
                flexGrow: 1,
                fontWeight: 700,
                color: "#597E94",
                letterSpacing: "-0.02em",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              WorkPulse
            </Typography>

            {/* Employee nav */}
            {!hr && (
              <>
                <Button
                  component={Link}
                  to="/"
                  sx={{
                    color: location.pathname === "/" ? "#4CA695" : "#597E94",
                    fontWeight: location.pathname === "/" ? 700 : 500,
                    mr: 1,
                    textTransform: "none",
                    fontSize: "14px",
                    borderBottom: location.pathname === "/" ? "2px solid #4CA695" : "2px solid transparent",
                    borderRadius: 0,
                    pb: "2px",
                  }}
                >
                  Submit Feedback
                </Button>
                <Button
                  component={Link}
                  to="/my-reviews"
                  sx={{
                    color: location.pathname === "/my-reviews" ? "#4CA695" : "#597E94",
                    fontWeight: location.pathname === "/my-reviews" ? 700 : 500,
                    mr: 1,
                    textTransform: "none",
                    fontSize: "14px",
                    borderBottom: location.pathname === "/my-reviews" ? "2px solid #4CA695" : "2px solid transparent",
                    borderRadius: 0,
                    pb: "2px",
                  }}
                >
                  My Reviews
                </Button>
              </>
            )}

            {/* HR nav */}
            {hr && (
              <Button
                component={Link}
                to="/insights"
                sx={{
                  color: "#4CA695",
                  fontWeight: 700,
                  mr: 1,
                  textTransform: "none",
                  fontSize: "14px",
                  borderBottom: "2px solid #4CA695",
                  borderRadius: 0,
                  pb: "2px",
                }}
              >
                HR Dashboard
              </Button>
            )}

            <Button
              onClick={handleLogout}
              variant="outlined"
              size="small"
              sx={{
                color: "#597E94",
                borderColor: "rgba(89, 126, 148, 0.3)",
                borderRadius: "8px",
                textTransform: "none",
                fontSize: "13px",
                fontWeight: 600,
                px: 2,
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                "&:hover": {
                  borderColor: "#597E94",
                  background: "#597E940a",
                  transform: "translateY(-1px)",
                  boxShadow: "0 2px 8px rgba(89, 126, 148, 0.1)",
                },
              }}
            >
              Sign out
            </Button>
          </Toolbar>
        </AppBar>
      )}

      {/* Pages */}
      <Box sx={{ flexGrow: 1 }}>
        <Container sx={{ py: 5 }}>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <RequireAuth>
                  {hr ? <Navigate to="/insights" /> : <FeedbackPage />}
                </RequireAuth>
              }
            />

            <Route
              path="/my-reviews"
              element={
                hr ? (
                  <Navigate to="/insights" />
                ) : (
                  <RequireAuth>
                    <MyReviewsPage />
                  </RequireAuth>
                )
              }
            />

            <Route
              path="/insights"
              element={
                hr ? (
                  <RequireAuth>
                    <InsightsPage />
                  </RequireAuth>
                ) : (
                  <Navigate to="/" />
                )
              }
            />
          </Routes>
        </Container>
      </Box>

      {/* Footer */}
      {authed && (
        <Box
          component="footer"
          sx={{
            py: 2.5,
            textAlign: "center",
            background: "#fff",
            borderTop: "1px solid #e0e0e0",
          }}
        >
          <Typography sx={{ color: "#999", fontSize: "12px" }}>
            WorkPulse · Powered by AWS Bedrock &amp; Serverless
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default App;
