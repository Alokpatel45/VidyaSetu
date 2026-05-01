import React from "react";
import "./common.css";
import { FcHome } from "react-icons/fc";
import { FaBook, FaUserAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import { IoLogOutOutline } from "react-icons/io5";
const SideBar = () => {
  return (
    <div className="sidebar">
      <ul>
        <li>
          <Link to={`/admin/dashboard`}>
            <div className="icon">
              <FcHome></FcHome>
            </div>
            <span>Home</span>
          </Link>
        </li>
        <li>
          <Link to={`/admin/course`}>
            <div className="icon">
              <FaBook></FaBook>
            </div>
            <span>course</span>
          </Link>
        </li>
        <li>
          <Link to={`/admin/users`}>
            <div className="icon">
              <FaUserAlt></FaUserAlt>
            </div>
            <span>User</span>
          </Link>
        </li>
        <li>
          <Link to={`/account`}>
            <div className="icon">
              <IoLogOutOutline></IoLogOutOutline>
            </div>
            <span>LogOut</span>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default SideBar;
