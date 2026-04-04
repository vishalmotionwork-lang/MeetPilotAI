import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import Dashboard from "./pages/Dashboard";
import RecordPage from "./pages/RecordPage";
import MeetingsPage from "./pages/MeetingsPage";
import MeetingDetailPage from "./pages/MeetingDetailPage";
import ReportPage from "./pages/ReportPage";
import ActionItemsPage from "./pages/ActionItemsPage";
import RemindersPage from "./pages/RemindersPage";
import ProfilePage from "./pages/ProfilePage";

function AppLayout() {
  const location = useLocation();
  const hideNavbar = ["/", "/login", "/signup"].includes(location.pathname);

  return (
    <div className={hideNavbar ? "" : "app-shell"}>
      {!hideNavbar && <Navbar />}
      <div className={hideNavbar ? "" : "app-body"}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/record"
            element={
              <ProtectedRoute>
                <RecordPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meetings"
            element={
              <ProtectedRoute>
                <MeetingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meeting/:id"
            element={
              <ProtectedRoute>
                <MeetingDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report/:meetingId"
            element={
              <ProtectedRoute>
                <ReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/action-items"
            element={
              <ProtectedRoute>
                <ActionItemsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reminders"
            element={
              <ProtectedRoute>
                <RemindersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
