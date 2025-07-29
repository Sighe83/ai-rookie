import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import BookingModal from '../components/BookingModal';

function ExpertsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const mockExperts = [
    {
      id: 1,
      name: "Sarah Johnson",
      domain: "Marketing",
      expertise: ["Machine Learning", "Customer Analytics", "Automation"],
      level: "Beginner-friendly",
      rating: 4.9,
      price: "€75/hour",
      image: "/api/placeholder/150/150"
    },
    {
      id: 2,
      name: "Dr. Michael Chen",
      domain: "Healthcare",
      expertise: ["Medical AI", "Diagnostics", "Data Analysis"],
      level: "Intermediate",
      rating: 4.8,
      price: "€120/hour",
      image: "/api/placeholder/150/150"
    },
    {
      id: 3,
      name: "Emma Rodriguez",
      domain: "Finance",
      expertise: ["Algorithmic Trading", "Risk Assessment", "NLP"],
      level: "Advanced",
      rating: 4.7,
      price: "€150/hour",
      image: "/api/placeholder/150/150"
    }
  ];

  const domains = ["Marketing", "Healthcare", "Finance", "Technology", "Education", "Manufacturing"];
  const levels = ["Beginner-friendly", "Intermediate", "Advanced"];

  const filteredExperts = mockExperts.filter(expert => {
    return (
      expert.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedDomain === '' || expert.domain === selectedDomain) &&
      (selectedLevel === '' || expert.level === selectedLevel)
    );
  });

  const handleBooking = (expert) => {
    setSelectedExpert(expert);
    setIsBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setSelectedExpert(null);
  };

  return (
    <div className="experts-page">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="logo">AI Rookie</Link>
          <div className="nav-links">
            <Link to="/experts" className="nav-link">Find Experts</Link>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link btn-primary">Sign Up</Link>
          </div>
        </div>
      </nav>

      <div className="experts-container">
        <h1>Find Your AI Expert</h1>
        
        <div className="search-filters">
          <input
            type="text"
            placeholder="Search experts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="filter-select"
          >
            <option value="">All Domains</option>
            {domains.map(domain => (
              <option key={domain} value={domain}>{domain}</option>
            ))}
          </select>
          
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="filter-select"
          >
            <option value="">All Levels</option>
            {levels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        <div className="experts-grid">
          {filteredExperts.map(expert => (
            <div key={expert.id} className="expert-card">
              <div className="expert-image">
                <div className="avatar-placeholder">{expert.name.charAt(0)}</div>
              </div>
              <h3>{expert.name}</h3>
              <p className="expert-domain">{expert.domain}</p>
              <div className="expert-expertise">
                {expert.expertise.map(skill => (
                  <span key={skill} className="skill-tag">{skill}</span>
                ))}
              </div>
              <p className="expert-level">Level: {expert.level}</p>
              <div className="expert-rating">
                <span>⭐ {expert.rating}</span>
                <span className="price">{expert.price}</span>
              </div>
              <button 
                className="book-button"
                onClick={() => handleBooking(expert)}
              >
                Book Session
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {selectedExpert && (
        <BookingModal
          expert={selectedExpert}
          isOpen={isBookingModalOpen}
          onClose={closeBookingModal}
        />
      )}
    </div>
  );
}

export default ExpertsPage;