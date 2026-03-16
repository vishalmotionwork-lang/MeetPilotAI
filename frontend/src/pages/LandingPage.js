import React from "react";
import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div>
      <h1>AI Meeting Minutes Generator</h1>
      <p>
        Convert meeting transcripts into smart summaries. This is our final
        year project.
      </p>

      <button onClick={() => navigate("/login")}>
        Login
      </button>
    </div>
  );
}

export default LandingPage;