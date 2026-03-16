import React from "react";

function Dashboard() {

  const username = "User";

  return (
    <div style={{ padding: "40px" }}>
      <h2>Welcome, {username} 👋</h2>

      <h1>AI Meeting Minutes Dashboard</h1>

      <hr />

      <h3>Upload Meeting Audio</h3>
      <input type="file" />
      <br />
      <br />
      <button>Upload</button>

      <hr />

      <h3>Previous Meetings</h3>

      <ul>
        <li>Team Meeting - View Summary</li>
        <li>Client Meeting - View Summary</li>
        <li>Project Review - View Summary</li>
      </ul>

      <hr />

      <button>Download Minutes</button>
    </div>
  );
}

export default Dashboard;