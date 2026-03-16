import React from "react";
import "../styles/SignUpPage.css";

function SignupPage() {
  return (
    <div className="signup-container">
      <div className="signup-card">

        <h1 className="title">Create Account</h1>
        <p className="subtitle">Join MeetAI</p>

        <form className="signup-form">

          <label>Name</label>
          <input type="text" placeholder="Enter your name" />

          <label>Email</label>
          <input type="email" placeholder="Enter your email" />

          <label>Password</label>
          <input type="password" placeholder="Enter password" />

          <button type="submit">Sign Up</button>

        </form>

        <p className="login-text">
          Already have an account? <span>Login</span>
        </p>

      </div>
    </div>
  );
}

export default SignupPage;