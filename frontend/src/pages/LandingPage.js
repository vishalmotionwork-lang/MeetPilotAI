import React from "react";
import { useNavigate } from "react-router-dom";

function LandingPage() {

  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>

      <h1>AI Meeting Minutes</h1>

      <p>Convert meeting audio into structured meeting minutes</p>

      <button onClick={() => navigate("/dashboard")}>
        Go to Dashboard
      </button>

    </div>
  );
}

export default LandingPage;