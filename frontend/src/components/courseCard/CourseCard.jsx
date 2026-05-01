import React from "react";
import "./courseCard.css";
import { server } from "../../main";
import { UserData } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { CourseData } from "../../context/CourseContext";

const CourseCard = ({ course }) => {
  const { user, isAuth } = UserData();
  const navigate = useNavigate();
  const { fetchCourses } = CourseData();

  const deleteHandler = async (id) => {
    if (confirm("Are you sure you want to delete this course")) {
      try {
        const { data } = await axios.delete(`${server}/api/course/${id}`, {
          headers: {
            token: localStorage.getItem("token"),
          },
        });
        toast.success(data.message);
        fetchCourses();
      } catch (error) {
        toast.error(error);
      }
    }
  };
  return (
    <div className="course-card">
      <img src={`${server}/${course.image}`} alt="" className="course-image" />
      <h3>{course.title}</h3>
      <p>Instructor-{course.createdBy}</p>
      <p>Duration-{course.duration}</p>
      <p>Price -₹{course.price}</p>
      {isAuth ? (
        <>
          {user && user.role != "admin" ? (
            <>
              {user.subscription.includes(course._id) ? (
                <button
                  className="common-btn"
                  onClick={() => navigate(`/course/study/${course._id}`)}
                >
                  Study
                </button>
              ) : (
                <>
                  <button
                    className="common-btn"
                    onClick={() => navigate(`/course/${course._id}`)}
                  >
                    Get Started
                  </button>
                </>
              )}
            </>
          ) : (
            <button
              className="common-btn"
              onClick={() => navigate(`/course/study/${course._id}`)}
            >
              Study
            </button>
          )}
        </>
      ) : (
        <button className="common-btn" onClick={() => navigate("/login")}>
          Get Started
        </button>
      )}
      <br></br>
      {user && user.role == "admin" && (
        <button
          onClick={() => deleteHandler(course._id)}
          className="common-btn"
          style={{ backgroundColor: "red" }}
        >
          Delete
        </button>
      )}
    </div>
  );
};

export default CourseCard;
