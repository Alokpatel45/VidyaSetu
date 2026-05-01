import CourseCard from "../../components/courseCard/CourseCard";
import { CourseData } from "../../context/CourseContext";
import "./courses.css";
import React from "react";

const Courses = () => {
  const { courses } = CourseData();
  return (
    <div className="courses">
      <h2>Available Courses</h2>
      <div className="course-container">
        {courses && courses.length > 0 ? (
          courses.map((e) => {
            return <CourseCard key={e._id} course={e}></CourseCard>;
          })
        ) : (
          <p>"No Courses Yet"</p>
        )}
      </div>
    </div>
  );
};

export default Courses;
