import React, { useEffect, useState } from "react";
import "./users.css";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import Layout from "../Utils/Layout";
import toast from "react-hot-toast";
const AdminUsers = ({ user }) => {
  const navigate = useNavigate();
  if (user && user.role !== "admin") {
    return navigate("/");
  }
  const [users, setUsers] = useState([]);
  async function fetchUsers() {
    try {
      const { data } = await api.get("/api/users");
      setUsers(data.users);
    } catch (error) {
      console.error(error);
    }
  }
  const updateRole = async (id, currentRole) => {
    if (confirm("Are you sure you want to update user role")) {
      try {
        const { data } = await api.put(`/api/user/${id}`, {
          role: currentRole === "admin" ? "user" : "admin",
        });
        toast.success(data.message);
        fetchUsers();
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to update role");
      }
    }
  };
  useEffect(() => {
    fetchUsers();
  }, []);
  return (
    <Layout>
      <div className="users">
        <h1>All Users</h1>
        <table border={"black"}>
          <thead>
            <tr>
              <td>#</td>
              <td>name</td>
              <td>email</td>
              <td>role</td>
              <td>update role</td>
            </tr>
          </thead>
          <tbody>
            {users.map((e, i) => (
              <tr key={e._id}>
                <td>{i + 1}</td>
                <td>{e.name}</td>
                <td>{e.email}</td>
                <td>{e.role}</td>
                <td>
                  <button
                    onClick={() => updateRole(e._id, e.role)}
                    className="common-btn"
                  >
                    Update Role
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default AdminUsers;
