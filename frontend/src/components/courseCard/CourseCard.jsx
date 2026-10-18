import React, { useState } from "react";
import { FiCode, FiUser, FiClock } from "react-icons/fi";
import "./courseCard.css";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import { subscriptionIncludes } from "../../utils/subscription";
import { UserData } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../utils/api";
import { CourseData } from "../../context/CourseContext";

const CourseCard = ({ course, onEdit }) => {
  const [failedImage, setFailedImage] = useState(null);
  const { user, isAuth } = UserData();
  const navigate = useNavigate();
  const { fetchCourses } = CourseData();

  const deleteHandler = async (id) => {
    if (confirm("Are you sure you want to delete this course")) {
      try {
        const { data } = await api.delete(`/api/course/${id}`);
        toast.success(data.message);
        fetchCourses();
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to delete course");
      }
    }
  };

  const primaryBtn = subscriptionIncludes(user?.subscription, course._id);

  return (
    <article className="course-card">
      {course.image && failedImage !== course.image ? (
        <img
          src={resolveMediaUrl(course.image)}
          alt=""
          className="course-image"
          loading="lazy"
          onError={() => setFailedImage(course.image)}
        />
      ) : (
        <div
          className="course-image course-image--placeholder"
          aria-hidden="true"
        >
          <FiCode />
          <span>Learn. Practice. Build.</span>
        </div>
      )}
      <div className="course-card__body">
        <span className="course-card__category">
          {course.category === "Web Devwlopment"
            ? "Web Development"
            : course.category || "Course"}
        </span>
        <h3>{course.title}</h3>
        {course.description && (
          <p className="course-card__description">{course.description}</p>
        )}
        <div className="course-card__meta">
          <span>
            <FiUser aria-hidden="true" />
            {course.createdBy}
          </span>
          <span>
            <FiClock aria-hidden="true" />
            {course.duration} weeks
          </span>
        </div>
        <p className="course-card__price">
          ₹{course.price}
          <small>One-time purchase</small>
        </p>
      </div>
      <div className="course-card__actions">
        {!isAuth && (
          <button
            type="button"
            className="common-btn"
            onClick={() => navigate("/login")}
          >
            Get started
          </button>
        )}
        {isAuth && user && user.role !== "admin" && (
          <>
            {primaryBtn ? (
              <button
                type="button"
                className="common-btn"
                onClick={() => navigate(`/course/study/${course._id}`)}
              >
                Study
              </button>
            ) : (
              <button
                type="button"
                className="common-btn"
                onClick={() => navigate(`/course/${course._id}`)}
              >
                View course
              </button>
            )}
          </>
        )}
        {isAuth && user?.role === "admin" && (
          <div className="admin-btns">
            <button
              type="button"
              className="common-btn"
              onClick={() => navigate(`/course/study/${course._id}`)}
            >
              Lectures
            </button>
            {onEdit && (
              <button
                type="button"
                className="common-btn edit-btn"
                onClick={() => onEdit(course)}
              >
                Edit
              </button>
            )}
            <button
              type="button"
              className="common-btn common-btn--danger"
              onClick={() => deleteHandler(course._id)}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </article>
  );
};

export default CourseCard;
