import React from "react";
import { useLocation } from "react-router-dom";
import "./footer.css";

const Footer = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <footer className={isHome ? "full-footer" : "thin-footer"}>
      <div className="footer-content">
        <p className="footer-copyright">
          &copy; {new Date().getFullYear()} VidyaSetu. All rights reserved.{" "}
          <span className="footer-made-by">
            Made with ❤️ by{" "}
            <a
              href="https://github.com/alokpatel45"
              target="_blank"
              rel="noopener noreferrer"
            >
              Alok Patel
            </a>
          </span>
        </p>
        <div className="social-links">
          <a
            href="https://instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            title="Instagram"
          >
            <i className="fab fa-instagram"></i>
          </a>
          <a
            href="https://twitter.com/"
            target="_blank"
            rel="noopener noreferrer"
            title="Twitter"
          >
            <i className="fab fa-twitter"></i>
          </a>
          <a
            href="https://facebook.com/"
            target="_blank"
            rel="noopener noreferrer"
            title="Facebook"
          >
            <i className="fab fa-facebook-f"></i>
          </a>
          <a
            href="https://linkedin.com/"
            target="_blank"
            rel="noopener noreferrer"
            title="LinkedIn"
          >
            <i className="fab fa-linkedin-in"></i>
          </a>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub"
          >
            <i className="fab fa-github"></i>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
