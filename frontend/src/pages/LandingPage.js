import React from 'react';
import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <a href="/" className="navbar-brand">
            <div className="brand-icon">✦</div>
            MeetPilotAI
          </a>
          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
            <Link to="/signup" className="btn btn-primary btn-sm">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <div className="landing-hero-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
            AI-Powered Meeting Intelligence
          </div>
          <h1 className="landing-hero-title">
            Your meetings,<br />
            <span style={{ color: 'var(--primary)' }}>intelligently managed.</span>
          </h1>
          <p className="landing-hero-desc">
            Record, transcribe, and extract actionable insights from every meeting — automatically.
            Let AI handle the notes so you can stay in the conversation.
          </p>
          <div className="landing-hero-actions">
            <Link to="/signup" className="btn btn-primary btn-xl">
              Start Free — No Credit Card
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
            <a href="#how-it-works" className="btn btn-outline btn-xl">See How It Works</a>
          </div>
          <div className="landing-hero-stats">
            <div className="landing-stat">
              <div className="landing-stat-value">500+</div>
              <div className="landing-stat-label">Meetings Processed</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-value">98%</div>
              <div className="landing-stat-label">Transcription Accuracy</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-value">&lt;2min</div>
              <div className="landing-stat-label">Average Processing</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-section" id="features">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <div className="text-caption" style={{ color: 'var(--primary)' }}>FEATURES</div>
            <h2 className="landing-section-title">Everything you need to run smarter meetings</h2>
            <p className="landing-section-desc">From recording to follow-ups, MeetPilotAI automates your entire meeting workflow.</p>
          </div>
          <div className="landing-features-grid">
            <div className="landing-feature-card">
              <div className="landing-feature-icon" style={{ background: 'var(--primary-50)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
              </div>
              <h3>Live Recording</h3>
              <p>Record meetings directly in your browser with real-time waveform visualization and timer.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon" style={{ background: '#EFF6FF' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </div>
              <h3>AI Transcription</h3>
              <p>Powered by Whisper — accurate speech-to-text transcription for any audio file or recording.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon" style={{ background: '#F0FDF4' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><line x1="21" x2="3" y1="6" y2="6"/><line x1="17" x2="7" y1="12" y2="12"/><line x1="19" x2="5" y1="18" y2="18"/></svg>
              </div>
              <h3>Smart Summaries</h3>
              <p>AI extracts key points, decisions, and an executive summary from every meeting.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon" style={{ background: '#FFF7ED' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <h3>Action Item Extraction</h3>
              <p>ML-powered pipeline identifies tasks, assigns owners, and sets priorities automatically.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon" style={{ background: '#FDF2F8' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
              </div>
              <h3>Editable Reports</h3>
              <p>Beautiful meeting reports you can edit and send via email before sharing with your team.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon" style={{ background: '#EFF6FF' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              </div>
              <h3>Smart Reminders</h3>
              <p>Never miss a follow-up. Set reminders linked to specific meetings and action items.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="landing-section landing-section-alt" id="how-it-works">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <div className="text-caption" style={{ color: 'var(--primary)' }}>HOW IT WORKS</div>
            <h2 className="landing-section-title">Three steps to better meetings</h2>
          </div>
          <div className="landing-steps">
            <div className="landing-step">
              <div className="landing-step-number">1</div>
              <h3>Record or Upload</h3>
              <p>Click the mic to record live, or upload any audio/video file. We support MP3, WAV, M4A, MP4, and more.</p>
            </div>
            <div className="landing-step-divider"></div>
            <div className="landing-step">
              <div className="landing-step-number">2</div>
              <h3>AI Processes</h3>
              <p>Our AI transcribes the audio, generates a summary, extracts action items, and creates a shareable report.</p>
            </div>
            <div className="landing-step-divider"></div>
            <div className="landing-step">
              <div className="landing-step-number">3</div>
              <h3>Review & Share</h3>
              <p>Edit the report, track action items, set reminders, and send everything to your team via email.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <div className="landing-cta-inner">
          <h2>Ready to transform your meetings?</h2>
          <p>Join teams who save hours every week with AI-powered meeting intelligence.</p>
          <Link to="/signup" className="btn btn-inverted btn-xl">
            Get Started Free
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <div className="navbar-brand">
              <div className="brand-icon">✦</div>
              MeetPilotAI
            </div>
            <p className="text-body-sm" style={{ color: 'var(--text-muted)', marginTop: 8 }}>AI-powered meeting intelligence for modern teams.</p>
          </div>
          <div className="landing-footer-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <Link to="/login">Sign In</Link>
            <Link to="/signup">Sign Up</Link>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <p>&copy; 2026 MeetPilotAI. Built with AI for smarter meetings.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
