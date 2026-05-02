import React from "react";
import { useNavigate } from "react-router-dom";
import "./home.css";
import Testimonials from "../components/testimonials/Testimonials";

function Home() {
  const navigate = useNavigate();
  return (
    <div className="home-root">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__backdrop" aria-hidden />
        <div className="hero__content">
          <p className="hero__badge">Courses · quizzes · AI support</p>
          <h1 id="hero-title" className="hero__title">
            Learn smarter on <span>VidyaSetu</span>
          </h1>
          <p className="hero__lead">
            Structured lessons, tracked progress, and tools that adapt to how you study—whether
            you are upskilling or starting from scratch.
          </p>
          <div className="hero__actions">
            <button
              type="button"
              onClick={() => navigate("/courses")}
              className="common-btn hero-cta"
            >
              Browse courses
            </button>
            <button
              type="button"
              className="hero__secondary"
              onClick={() => navigate("/about")}
            >
              About us
            </button>
          </div>
        </div>
      </section>

      <Testimonials />
    </div>
  );
}

export default Home;
