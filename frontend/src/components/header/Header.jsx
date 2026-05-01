import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./header.css";
const Header = ({ isAuth }) => {
  const navigate = useNavigate();
  return (
    <header>
      <div className="logo" onClick={() => navigate("/")}>
        E-learning
      </div>
      <div className="link">
        <Link to="/">Home</Link>
        <Link to="/courses">Courses</Link>
        <Link to="/about">About</Link>
        {isAuth ? (
          <Link to="/account">Account</Link>
        ) : (
          <Link to="/login">Login</Link>
        )}
        <Link to="/chatbox">Discuss with your Friends</Link>
        <Link to="/ai">Chat with Ai</Link>
      </div>
    </header>
  );
};

export default Header;
