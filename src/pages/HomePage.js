import React from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="home-page">
      <nav className="navbar">
        <div className="nav-container">
          <h1 className="logo">AI Rookie</h1>
          <div className="nav-links">
            <Link to="/experts" className="nav-link">Find Experts</Link>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link btn-primary">Sign Up</Link>
          </div>
        </div>
      </nav>

      <main className="hero-section">
        <div className="hero-container">
          <h1 className="hero-title">
            Connect with AI Experts Tailored to Your Level
          </h1>
          <p className="hero-subtitle">
            The marketplace for AI learning - find independent experts in your domain
          </p>
          
          <div className="value-props">
            <div className="value-prop-card">
              <h3>For AI Novices</h3>
              <p className="value-prop-text">Bliv uundværlig på fremtidens arbejdsmarked</p>
              <p>Learn AI skills from experts who understand your starting point and industry needs</p>
              <Link to="/register" className="cta-button">Start Learning</Link>
            </div>
            
            <div className="value-prop-card">
              <h3>For Organizations</h3>
              <p className="value-prop-text">Boost jeres forretningsværdi med AI‑kompetencer</p>
              <p>Upskill your team with domain-specific AI expertise tailored to your business</p>
              <Link to="/register" className="cta-button">Find Experts</Link>
            </div>
          </div>

          <div className="features-section">
            <h2>How It Works</h2>
            <div className="features-grid">
              <div className="feature">
                <h4>1. Browse Experts</h4>
                <p>Find AI experts in your specific domain with the right expertise level</p>
              </div>
              <div className="feature">
                <h4>2. Book Sessions</h4>
                <p>Schedule one-on-one sessions or workshops that fit your schedule</p>
              </div>
              <div className="feature">
                <h4>3. Learn & Apply</h4>
                <p>Get practical AI knowledge you can immediately apply to your work</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default HomePage;