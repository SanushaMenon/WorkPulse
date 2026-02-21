import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";

import "./auth/amplify-config";
import { AuthProvider } from "./auth/AuthContext";
import App from "./App";

const theme = createTheme({
  palette: {
    mode: "light",
    primary:    { main: "#3D9E8C", contrastText: "#ffffff" },   // teal
    secondary:  { main: "#4F6E84", contrastText: "#ffffff" },   // slate blue
    error:      { main: "#E8857A" },                             // coral
    background: { default: "#F0EDE6", paper: "#FAF8F4" },       // beige
    text:       { primary: "#2C3A3A", secondary: "#5A7070" },
  },
  typography: {
    fontFamily: "'DM Sans', sans-serif",
    h4: { fontWeight: 800, letterSpacing: "-0.02em" },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#FAF8F4",
          border: "1px solid #E8E2D9",
          boxShadow: "0 1px 4px rgba(44,58,58,0.06)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, textTransform: "none", fontWeight: 600 },
        containedPrimary: {
          background: "#3D9E8C",
          "&:hover": { background: "#348a7a" },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#F5F2EC",
            "& fieldset": { borderColor: "#D8D2C8" },
            "&:hover fieldset": { borderColor: "#3D9E8C" },
            "&.Mui-focused fieldset": { borderColor: "#3D9E8C" },
          },
          "& .MuiInputLabel-root.Mui-focused": { color: "#3D9E8C" },
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);