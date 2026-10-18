import { Link, useLocation } from "react-router-dom";
import "./dashboard.css";
import { CourseData } from "../../context/CourseContext";
import CourseCard from "../../components/courseCard/CourseCard";
import PastTests from "./PastTests.jsx";

const Dashboard = () => {
  const { myCourse } = CourseData();
  const { pathname, hash } = useLocation();
  const showTests = hash === "#past-tests";
  return (
    <div className="student-dashboard">
      <p className="page-eyebrow">Your learning space</p>
      <h1>{showTests ? "Practice makes progress." : "Keep moving forward."}</h1>
      <p className="page-subtitle">
        {showTests
          ? "Revisit your answers and learn from every attempt."
          : "Your courses and saved quiz results, together in one place."}
      </p>
      <nav className="dashboard-tabs" aria-label="Learning sections">
        <Link to={pathname} aria-current={!showTests ? "page" : undefined}>
          My learning
        </Link>
        <Link
          to={`${pathname}#past-tests`}
          aria-current={showTests ? "page" : undefined}
        >
          Past tests
        </Link>
      </nav>
      {showTests ? (
        <PastTests />
      ) : (
        <section className="dashboard-content" aria-label="Enrolled courses">
          {myCourse?.length ? (
            myCourse.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))
          ) : (
            <div className="dashboard-empty">
              <h2>Start your next chapter.</h2>
              <p>Explore a course and make it part of your learning space.</p>
              <Link to="/courses" className="common-btn">
                Explore courses
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
export default Dashboard;
