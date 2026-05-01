import { Link, useNavigate } from "react-router-dom";
import "./auth.css";
import React, { useState } from "react";
import { UserData } from "../../context/UserContext";

const Verify = () => {
  const [otp, setOtp] = useState("");
  const { btnLoading, verifyOtp } = UserData();
  const navigate = useNavigate();
  const submitHandler = async (e) => {
    e.preventDefault();
    await verifyOtp(Number(otp), navigate);
  };
  return (
    <div className="auth-page">
      <div className="auth-form">
        <h2>Verify Account</h2>
        <form action="" onSubmit={submitHandler}>
          <label htmlFor="otp"></label>
          <input
            type="number"
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button disabled={btnLoading} type="submit" className="common-btn">
            {btnLoading ? "Please wait" : "Verify"}
          </button>
        </form>
        <p>
          Go to <Link to="/login">Login</Link> page.
        </p>
      </div>
    </div>
  );
};

export default Verify;
