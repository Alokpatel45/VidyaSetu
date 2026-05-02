import React from "react";
import "./testimonials.css";

const Testimonials = () => {
  const testimonialsData = [
    {
      id: 1,
      name: "Alok Patel",
      position: "Web Development Student",
      message:
        "VidyaSetu transformed my career path. The structured curriculum and AI-powered quizzes helped me master React and Node.js much faster than I expected!",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      rating: 5,
    },
    {
      id: 2,
      name: "Sanya Sharma",
      position: "DSA Enthusiast",
      message:
        "The way complex DSA concepts are explained here is incredible. I cracked my dream internship thanks to the practice problems and clear lecture videos.",
      image: "https://randomuser.me/api/portraits/women/44.jpg",
      rating: 5,
    },
    {
      id: 3,
      name: "Rahul Verma",
      position: "Full Stack Learner",
      message:
        "I love the project-based approach. Building real-world apps while learning gave me the confidence I needed to apply for developer roles.",
      image: "https://randomuser.me/api/portraits/men/85.jpg",
      rating: 4,
    },
    {
      id: 4,
      name: "Ananya Iyer",
      position: "Computer Science Student",
      message:
        "The community support and the AI Assistant are game-changers. Whenever I'm stuck, I get instant help which keeps my learning momentum going.",
      image: "https://randomuser.me/api/portraits/women/68.jpg",
      rating: 5,
    },
  ];

  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      <span key={i} className={i < rating ? "star filled" : "star"}>★</span>
    ));
  };

  return (
    <section className="testimonials-section">
      <div className="testimonials-container">
        <div className="testimonials-header">
          <span className="subtitle">Success Stories</span>
          <h2>What Our Students Say</h2>
          <p>Join thousands of students who have already accelerated their careers with VidyaSetu.</p>
        </div>

        <div className="testimonials-grid">
          {testimonialsData.map((e) => (
            <div className="testimonial-card" key={e.id}>
              <div className="quote-icon">"</div>
              <div className="rating-stars">
                {renderStars(e.rating)}
              </div>
              <p className="message">{e.message}</p>
              <div className="user-profile">
                <div className="user-image">
                  <img src={e.image} alt={e.name} />
                </div>
                <div className="user-details">
                  <h4 className="user-name">{e.name}</h4>
                  <p className="user-position">{e.position}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
