import React from "react";
import "./dashboard.css";
import { CourseData } from "../../context/CourseContext";
import CourseCard from "../../components/courseCard/CourseCard";

const Dashboard = () => {
  const { myCourse } = CourseData();
  return (
    <div className="student-dashboard">
      <h2>Your All Courses</h2>
      <div className="dashboard-content">
        {myCourse && myCourse.length > 0 ? (
          myCourse.map((e) => <CourseCard key={e._id} course={e}></CourseCard>)
        ) : (
          <p>Please buy any Course</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
