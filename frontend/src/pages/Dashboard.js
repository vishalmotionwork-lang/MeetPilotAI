import React from "react";
import "./Dashboard.css";

function Dashboard() {

  const username = "User";

  return (
    <div className="dashboard">

      {/* Navbar */}
      <div className="navbar">
        <h2 className="logo">AI Meeting Minutes</h2>
        <button className="logout">Logout</button>
      </div>

      {/* Hero Section */}
      <div className="hero">

        <div className="hero-text">
          <h1>Welcome, {username} 👋</h1>
          <p>
            Upload meeting audio and let AI generate structured
            meeting minutes, summaries and key action items.
          </p>

          <button className="primary-btn">
            Upload Meeting Audio
          </button>
        </div>

        {/* AI Illustration */}
        <div className="hero-illustration">
          <div className="circle big"></div>
          <div className="circle medium"></div>
          <div className="circle small"></div>
        </div>

      </div>

      {/* Features */}
      <div className="stats-container">

       <div className="stat-card">
        <h3>12</h3>
        <p>Meetings Uploaded</p>
       </div>

       <div className="stat-card">
        <h3>10</h3>
        <p>Minutes Generated</p>
       </div>

       <div className="stat-card">
         <h3>34</h3>
         <p>Action Items</p>
       </div>

       <div className="stat-card">
         <h3>8</h3>
         <p>Files Uploaded</p>
       </div>

      </div>

      {/* Recent Meetings */}
      <div className="recent">

        <h2>Recent Meetings</h2>

        <div className="meeting">
          <span>Team Sync Meeting</span>
          <button>View</button>
        </div>

        <div className="meeting">
          <span>Client Discussion</span>
          <button>View</button>
        </div>

        <div className="meeting">
          <span>Project Planning</span>
          <button>View</button>
        </div>

      </div>

    </div>
  );
}

export default Dashboard;