import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./home.css";
import Testimonials from "../components/testimonials/Testimonials";
import ChatBox from "../components/chatBox";
function Home() {
  const navigate = useNavigate();
  return (
    <div>
      <div className="home">
        <div className="home-content">
          <h1>Welcome to our E-learning plateform</h1>
          <p>Learn,Grow,Excel</p>
          <button onClick={() => navigate("/courses")} className="common-btn">
            Get Started
          </button>
        </div>
      </div>

      <Testimonials></Testimonials>
    </div>
  );
}

export default Home;
