import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { FiMenu, FiX, FiMoon, FiSun, FiUser } from "react-icons/fi";
import { UserData } from "../../context/UserContext";
import "./header.css";

const Header = ({ isAuth }) => {
  const { user } = UserData();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);
  useEffect(() => {
    const close = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("vidyasetu-theme", next);
    } catch {
      /* Appearance still works without storage. */
    }
  };
  const dashboard = `/${user?._id}/dashboard`;
  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="site-header__inner">
        <Link className="site-header__brand" to="/" aria-label="VidyaSetu home">
          <span className="site-header__logo-mark" aria-hidden="true">
            V
          </span>
          <span>
            Vidya<span className="brand-accent">Setu</span>
          </span>
        </Link>
        <nav
          id="site-navigation"
          aria-label="Main navigation"
          className={`site-header__nav ${menuOpen ? "site-header__nav--open" : ""}`}
        >
          <NavLink className="header__link" to="/courses">
            Courses
          </NavLink>
          {isAuth && user?._id && (
            <>
              <Link
                className="header__link"
                aria-current={
                  location.pathname === dashboard && !location.hash
                    ? "page"
                    : undefined
                }
                to={dashboard}
              >
                My learning
              </Link>
              <Link
                className="header__link"
                aria-current={
                  location.pathname === dashboard &&
                  location.hash === "#past-tests"
                    ? "page"
                    : undefined
                }
                to={`${dashboard}#past-tests`}
              >
                Past tests
              </Link>
            </>
          )}
          <NavLink className="header__link" to="/ai">
            AI tutor
          </NavLink>
          <NavLink className="header__link" to="/chatbox">
            Community
          </NavLink>
          <NavLink className="header__link" to="/about">
            About
          </NavLink>
          <NavLink
            className="header__link header__mobile-account"
            to={isAuth ? "/account" : "/login"}
          >
            {isAuth ? "Account" : "Log in"}
          </NavLink>
        </nav>
        <div className="site-header__actions">
          <button
            className="header-icon-btn"
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? (
              <FiSun aria-hidden="true" />
            ) : (
              <FiMoon aria-hidden="true" />
            )}
          </button>
          {isAuth ? (
            <Link
              className="header-icon-btn header-account"
              to="/account"
              aria-label="Account"
            >
              <FiUser aria-hidden="true" />
            </Link>
          ) : (
            <Link className="site-header__signup" to="/login">
              Log in
            </Link>
          )}
          <button
            type="button"
            className="header-icon-btn site-header__menu-btn"
            aria-expanded={menuOpen}
            aria-controls="site-navigation"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <FiX aria-hidden="true" />
            ) : (
              <FiMenu aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
export default Header;
