import React from "react";
import "./users.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { server } from "../../main";
import { useEffect } from "react";
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
      const { data } = await axios.get(`${server}/api/users`, {
        headers: {
          token: localStorage.getItem("token"),
        },
      });
      setUsers(data.users);
    } catch (error) {
      console.group(error);
    }
  }
  const updateRole = async (id) => {
    if (confirm("Are you sure you want to update user role")) {
      try {
        const { data } = await axios.put(
          `${server}/api/user/${id}`,
          {},
          {
            headers: {
              token: localStorage.getItem("token"),
            },
          }
        );
        toast.success(data.message);
        fetchUsers();
      } catch (error) {
        toast.error(error);
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
          {users &&
            users.map((e, i) => (
              <tbody>
                <tr>
                  <td>{i + 1}</td>
                  <td>{e.name}</td>
                  <td>{e.email}</td>
                  <td>{e.role}</td>
                  <td>
                    <button
                      onClick={() => updateRole(e._id)}
                      className="common-btn"
                    >
                      Update Role
                    </button>
                  </td>
                </tr>
              </tbody>
            ))}
        </table>
      </div>
    </Layout>
  );
};

export default AdminUsers;
