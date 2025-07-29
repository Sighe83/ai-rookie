import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    userType: 'learner',
    domain: ''
  });

  const domains = ["Marketing", "Healthcare", "Finance", "Technology", "Education", "Manufacturing", "Other"];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Registration attempt:', formData);
  };

  return (
    <div className="auth-page">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="logo">AI Rookie</Link>
          <div className="nav-links">
            <Link to="/experts" className="nav-link">Find Experts</Link>
            <Link to="/login" className="nav-link">Login</Link>
          </div>
        </div>
      </nav>

      <div className="auth-container">
        <div className="auth-form">
          <h2>Join AI Rookie</h2>
          <p>Start your AI learning journey today</p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="userType">I am a...</label>
              <select
                id="userType"
                name="userType"
                value={formData.userType}
                onChange={handleChange}
                className="form-input"
              >
                <option value="learner">AI Learner</option>
                <option value="expert">AI Expert</option>
                <option value="organization">Organization</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="domain">Domain/Industry</label>
              <select
                id="domain"
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="">Select your domain</option>
                {domains.map(domain => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>
            </div>
            
            <button type="submit" className="auth-button">
              Create Account
            </button>
          </form>
          
          <p className="auth-link">
            Already have an account? <Link to="/login">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;