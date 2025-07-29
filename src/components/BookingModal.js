import React, { useState } from 'react';

function BookingModal({ expert, isOpen, onClose }) {
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    duration: '60',
    message: ''
  });

  const timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];
  const durations = [
    { value: '30', label: '30 minutes' },
    { value: '60', label: '1 hour' },
    { value: '90', label: '1.5 hours' },
    { value: '120', label: '2 hours' }
  ];

  const handleChange = (e) => {
    setBookingData({
      ...bookingData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Booking request:', { expert: expert.name, ...bookingData });
    alert(`Booking request sent to ${expert.name}!`);
    onClose();
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Book a session with {expert.name}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="expert-summary">
          <p><strong>Domain:</strong> {expert.domain}</p>
          <p><strong>Rate:</strong> {expert.price}</p>
          <p><strong>Level:</strong> {expert.level}</p>
        </div>

        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-group">
            <label htmlFor="date">Preferred Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={bookingData.date}
              onChange={handleChange}
              min={minDate}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="time">Preferred Time</label>
            <select
              id="time"
              name="time"
              value={bookingData.time}
              onChange={handleChange}
              required
              className="form-input"
            >
              <option value="">Select a time</option>
              {timeSlots.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="duration">Session Duration</label>
            <select
              id="duration"
              name="duration"
              value={bookingData.duration}
              onChange={handleChange}
              className="form-input"
            >
              {durations.map(duration => (
                <option key={duration.value} value={duration.value}>
                  {duration.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="message">Message (optional)</label>
            <textarea
              id="message"
              name="message"
              value={bookingData.message}
              onChange={handleChange}
              placeholder="Tell the expert what you'd like to learn..."
              rows="4"
              className="form-input"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="book-button">
              Send Booking Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookingModal;