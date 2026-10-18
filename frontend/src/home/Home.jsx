import { Link } from "react-router-dom";
import { FiArrowRight, FiBookOpen, FiCheckCircle, FiCpu } from "react-icons/fi";
import "./home.css";
import Testimonials from "../components/testimonials/Testimonials";

function Home() {
  return (
    <div className="home-root">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__content">
          <p className="page-eyebrow">Learn · Practice · Move forward</p>
          <h1 id="hero-title">
            Build skills.
            <br />
            <span>One concept at a time.</span>
          </h1>
          <p className="hero__lead">
            A focused space for video lessons, AI-assisted practice and the next
            step in your learning journey.
          </p>
          <div className="hero__actions">
            <Link to="/courses" className="common-btn">
              Explore courses <FiArrowRight aria-hidden="true" />
            </Link>
            <Link className="common-btn common-btn--secondary" to="/about">
              Meet VidyaSetu
            </Link>
          </div>
        </div>
        <div className="learning-path" aria-label="How learning works">
          <div className="learning-path__heading">
            <span>Your learning path</span>
            <FiBookOpen aria-hidden="true" />
          </div>
          {[
            {
              icon: <FiBookOpen aria-hidden="true" />,
              title: "Understand the concept",
              text: "Learn with structured video lessons.",
            },
            {
              icon: <FiCpu aria-hidden="true" />,
              title: "Put it into practice",
              text: "Check your understanding with a quiz.",
            },
            {
              icon: <FiCheckCircle aria-hidden="true" />,
              title: "Learn from every attempt",
              text: "Review saved answers and explanations.",
            },
          ].map(({ icon, title, text }, index) => (
            <div className="learning-path__step" key={title}>
              <span className="learning-path__icon">{icon}</span>
              <div>
                <small>0{index + 1}</small>
                <h2>{title}</h2>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <Testimonials />
    </div>
  );
}
export default Home;
