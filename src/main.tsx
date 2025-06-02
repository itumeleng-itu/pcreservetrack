import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AuthPage from "./pages/AuthPage";

createRoot(document.getElementById("root")!).render(
  <Router>
    <Routes>
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/*" element={<AuthPage />} />
    </Routes>
  </Router>
);
