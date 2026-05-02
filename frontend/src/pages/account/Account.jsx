import React from "react";
import "./account.css";
import { SlLogout } from "react-icons/sl";
import { MdDashboard } from "react-icons/md";
import { UserData } from "../../context/UserContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
const Account = ({ user }) => {
  const { logoutUser } = UserData();
  const navigate = useNavigate();
  const logoutHandler = async () => {
    await logoutUser(navigate);
    toast.success("Logged out");
  };
  return (
    <div>
      {user && (
        <div className="profile">
          <h2>My Profile</h2>
          <div className="profile-info">
            <p>
              <strong>Name-{user.name}</strong>
            </p>
            <p>
              <strong>Email-{user.email}</strong>
            </p>
            <button
              onClick={() => navigate(`/${user._id}/dashboard`)}
              className="common-btn"
            >
              <MdDashboard></MdDashboard>Dashboard
            </button>
            <br />
            {user.role === "admin" && (
              <button
                onClick={() => navigate(`/admin/dashboard`)}
                className="common-btn"
              >
                <MdDashboard></MdDashboard>Admin Dashboard
              </button>
            )}
            <br />
            <button
              type="button"
              className="common-btn common-btn--danger"
              onClick={logoutHandler}
            >
              <SlLogout /> Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;
