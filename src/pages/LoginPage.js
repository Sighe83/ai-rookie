import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login attempt:', { email, password });
  };

  return (
    <div className="auth-page">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="logo">AI Rookie</Link>
          <div className="nav-links">
            <Link to="/experts" className="nav-link">Find Experts</Link>
            <Link to="/register" className="nav-link btn-primary">Sign Up</Link>
          </div>
        </div>
      </nav>

      <div className="auth-container">
        <div className="auth-form">
          <h2>Welcome Back</h2>
          <p>Sign in to your AI Rookie account</p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
              />
            </div>
            
            <button type="submit" className="auth-button">
              Sign In
            </button>
          </form>
          
          <p className="auth-link">
            Don't have an account? <Link to="/register">Sign up here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;