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
    <Box sx={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", flexDirection: "column" }}>

      {/* Navbar */}
      {authed && (
        <AppBar
          position="static"
          elevation={1}
          sx={{
            background: "#fff",
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          <Toolbar>
            {/* Logo mark */}
            <Box sx={{
              width: 32, height: 32, borderRadius: "8px",
              background: "#111", display: "flex", alignItems: "center",
              justifyContent: "center", mr: 1.5, flexShrink: 0,
            }}>
              <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "14px", fontFamily: "monospace" }}>W</Typography>
            </Box>

            <Typography
              variant="h6"
              sx={{
                flexGrow: 1,
                fontWeight: 700,
                color: "#111",
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
                    color: location.pathname === "/" ? "#111" : "#666",
                    fontWeight: location.pathname === "/" ? 700 : 400,
                    mr: 1,
                    textTransform: "none",
                    fontSize: "14px",
                    borderBottom: location.pathname === "/" ? "2px solid #111" : "2px solid transparent",
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
                    color: location.pathname === "/my-reviews" ? "#111" : "#666",
                    fontWeight: location.pathname === "/my-reviews" ? 700 : 400,
                    mr: 1,
                    textTransform: "none",
                    fontSize: "14px",
                    borderBottom: location.pathname === "/my-reviews" ? "2px solid #111" : "2px solid transparent",
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
                  color: "#111",
                  fontWeight: 700,
                  mr: 1,
                  textTransform: "none",
                  fontSize: "14px",
                  borderBottom: "2px solid #111",
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
                color: "#111",
                borderColor: "#ccc",
                textTransform: "none",
                fontSize: "13px",
                "&:hover": { borderColor: "#111", background: "#f5f5f5" },
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
