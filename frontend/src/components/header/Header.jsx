import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./header.css";

const Header = ({ isAuth }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const nav = (
    <>
      <Link className="header__link" to="/">
        Home
      </Link>
      <Link className="header__link" to="/courses">
        Courses
      </Link>
      <Link className="header__link" to="/about">
        About
      </Link>
      {isAuth ? (
        <Link className="header__link" to="/account">
          Account
        </Link>
      ) : (
        <Link className="header__link header__link--accent" to="/login">
          Log in
        </Link>
      )}
      <Link className="header__link" to="/chatbox">
        Community chat
      </Link>
      <Link className="header__link" to="/ai">
        AI tutor
      </Link>
    </>
  );

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <button
          type="button"
          className="site-header__menu-btn"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="site-header__menu-icon" data-open={menuOpen} />
        </button>

        <div
          className="site-header__brand"
          onClick={() => navigate("/")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/");
          }}
          role="button"
          tabIndex={0}
        >
          <span className="site-header__logo-mark">V</span>
          VidyaSetu
        </div>

        <nav className={`site-header__nav ${menuOpen ? "site-header__nav--open" : ""}`}>
          <div className="site-header__nav-links">{nav}</div>
        </nav>

        {!isAuth && (
          <Link className="site-header__signup" to="/register">
            Sign up
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
