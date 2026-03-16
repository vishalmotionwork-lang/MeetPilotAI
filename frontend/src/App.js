import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
// import UploadMeeting from "./pages/UploadMeeting";
import SummaryPage from "./pages/SummaryPage";
// import SummaryPage from "./pages/SummaryPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignUpPage";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<UploadMeeting />} />*/
        <Route path="/summary" element={<SummaryPage />} /> }
        <Route path="/upload" element={<UploadMeeting />} />
        <Route path="/summary" element={<SummaryPage />} /> */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;