import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { API_URL } from "../../config";
import "./auth.css";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/.test(password)) return setMessage("Use 8+ characters with uppercase, lowercase, number and special character (!@#$%^&*).");
    if (password !== confirm) return setMessage("Passwords do not match.");
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/api/user/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      setSuccess(response.ok);
      setMessage(data.message || "Please try again.");
    } catch { setMessage("Unable to reset password. Please try again."); }
    finally { setLoading(false); }
  }
  return <div className="auth-page"><div className="auth-form">
    <h2>Reset password</h2>
    {!token ? <p>Invalid reset link. <Link to="/forgot-password">Request a new link</Link>.</p>
    : success ? <p role="status">{message} <Link to="/login">Log in</Link></p>
    : <><form onSubmit={submit}>
      <label htmlFor="new-password">New password</label>
      <input id="new-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} />
      <small className="auth-hint">8+ characters, uppercase, lowercase, number and special character (!@#$%^&*).</small>
      <label htmlFor="confirm-password">Confirm password</label>
      <input id="confirm-password" type="password" autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} />
      <button className="common-btn" disabled={loading}>{loading ? "Please wait..." : "Reset password"}</button>
    </form>{message && <p role="status">{message}</p>}</>}
  </div></div>;
}
