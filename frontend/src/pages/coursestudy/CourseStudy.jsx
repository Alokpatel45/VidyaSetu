import { Link, useNavigate, useParams } from "react-router-dom";
import "./courseStudy.css";
import React, { useEffect } from "react";
import { CourseData } from "../../context/CourseContext";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import { subscriptionIncludes } from "../../utils/subscription";

const CourseStudy = ({ user }) => {
  const params = useParams();
  const { fetchCourse, course } = CourseData();
  const navigate = useNavigate();

  useEffect(() => {
    if (
      user &&
      user.role !== "admin" &&
      !subscriptionIncludes(user.subscription, params.id)
    ) {
      return navigate("/");
    }
  }, [user, params.id, navigate]);

  useEffect(() => {
    fetchCourse(params.id);
  }, [params.id, fetchCourse]);

  return (
    <div className="study-container">
      {course && (
        <div className="study-card">
          <div className="study-header">
            <div className="study-image-wrapper">
              <img
                src={resolveMediaUrl(course.image)}
                alt={course.title}
              />
            </div>
            <div className="study-info-content">
              <span className="study-badge">Enrolled</span>
              <h1>{course.title}</h1>
              <p className="study-desc">{course.description}</p>
              
              <div className="study-meta">
                <div className="meta-item">
                  <span className="meta-icon">👤</span>
                  <div className="meta-text">
                    <label>Instructor</label>
                    <span>{course.createdBy}</span>
                  </div>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">⏱️</span>
                  <div className="meta-text">
                    <label>Duration</label>
                    <span>{course.duration} Weeks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="study-actions">
            <Link to={`/lectures/${course._id}`} className="action-card lectures">
              <div className="action-icon">📚</div>
              <div className="action-text">
                <h3>Course Content</h3>
                <p>Start learning with video lectures</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>

            <Link to={`/ai/quiz/${params.id}`} className="action-card quiz">
              <div className="action-icon">🧠</div>
              <div className="action-text">
                <h3>Practice Quiz</h3>
                <p>Test your knowledge with AI</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseStudy;
