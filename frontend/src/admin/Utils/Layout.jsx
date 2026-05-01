import React from "react";
import "./common.css";
import SideBar from "./SideBar";

const Layout = ({ children }) => {
  return (
    <div className="dashboard-admin">
      <SideBar />
      <div className="content">{children}</div>
    </div>
  );
};

export default Layout;
