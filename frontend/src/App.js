import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
// import UploadMeeting from "./pages/UploadMeeting";
// import SummaryPage from "./pages/SummaryPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<UploadMeeting />} />
        <Route path="/summary" element={<SummaryPage />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;