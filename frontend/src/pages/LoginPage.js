import React from "react";
import "../styles/LoginPage.css";
import { useNavigate } from "react-router-dom";

function LoginPage() {
    const navigate = useNavigate();
    
  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="title">MeetPilotAI</h1>
        <p className="subtitle">AI Meeting Minutes Generator</p>

        <form className="login-form">
          <label>Email</label>
          <input type="email" placeholder="Enter your email" />

          <label>Password</label>
          <input type="password" placeholder="Enter your password" />

          <button type="submit">Login</button>
        </form>

        <p className="signup-text">
            Don't have an account? 
            <span onClick={() => navigate("/signup")}> Sign up</span>
            </p>
      </div>
    </div>
  );
}

export default LoginPage;