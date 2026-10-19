import React, { useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../../config";
import "./auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(API_URL + "/api/user/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setMessage(data.message || "Please try again.");
    } catch {
      setMessage("Unable to send request. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-form">
        <h2>Forgot password?</h2>
        <p>Enter your email to receive a reset link.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="reset-email">Email</label>
          <input id="reset-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          <button type="submit" className="common-btn" disabled={loading}>{loading ? "Please wait..." : "Send reset link"}</button>
        </form>
        {message && <p role="status">{message}</p>}
        <p><Link to="/login">Back to login</Link></p>
      </div>
    </div>
  );
}
