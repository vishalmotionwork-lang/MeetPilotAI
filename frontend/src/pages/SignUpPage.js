import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { signup } from '../services/api';

function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await signup(name, email, password);
      const user = res.data;
      localStorage.setItem('user', JSON.stringify({
        id: user.id,
        name: user.name || name,
        email: user.email || email,
      }));
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Sign up failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" data-page="login" style={{ display: 'flex' }}>
      <div className="login-split">
        {/* Brand Side */}
        <div className="login-brand">
          <div className="login-brand-content">
            <div className="login-brand-logo">
              <div className="login-brand-logo-icon">&#10022;</div>
              MeetPilotAI
            </div>
            <h1>Your meetings,<br />intelligently managed.</h1>
            <p>Record, transcribe, and extract actionable insights from every meeting — automatically. Let AI handle the notes so you can stay in the conversation.</p>
            <div className="login-features">
              <div className="login-feature">
                <div className="login-feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <span>Real-time transcription with speaker detection</span>
              </div>
              <div className="login-feature">
                <div className="login-feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </div>
                <span>AI-generated summaries, reports, and action items</span>
              </div>
              <div className="login-feature">
                <div className="login-feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <span>Cross-meeting task tracking and smart reminders</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Side */}
        <div className="login-form-side">
          <div className="login-card">
            <h2>Create account</h2>
            <p className="login-subtitle">Start transforming your meetings today</p>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Full name</label>
                <div className="input-with-icon">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Email address</label>
                <div className="input-with-icon">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Password</label>
                <div className="input-with-icon password-group">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="input-action"
                    onClick={() => setShowPassword(prev => !prev)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Confirm password</label>
                <div className="input-with-icon password-group">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <p className="login-footer">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;
