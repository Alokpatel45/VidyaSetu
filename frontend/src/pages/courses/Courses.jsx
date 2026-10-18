import CourseCard from "../../components/courseCard/CourseCard";
import { CourseData } from "../../context/CourseContext";
import { FiSearch, FiPlay, FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import "./courses.css";

const normalizeCategory = (category) =>
  category === "Web Devwlopment" ? "Web Development" : category;
const Courses = () => {
  const { courses, myCourse } = CourseData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const categories = [
    "All",
    ...new Set(
      (courses || []).map((c) => normalizeCategory(c.category)).filter(Boolean),
    ),
  ];
  const filteredCourses = useMemo(
    () =>
      (courses || []).filter((c) => {
        const category = normalizeCategory(c.category);
        return (
          `${c.title} ${category || ""}`
            .toLowerCase()
            .includes(searchTerm.trim().toLowerCase()) &&
          (selectedCategory === "All" || category === selectedCategory)
        );
      }),
    [courses, searchTerm, selectedCategory],
  );
  const enrolled = myCourse?.[0];
  return (
    <div className="courses-page-wrapper">
      <header className="courses-hero">
        <p className="page-eyebrow">Explore · Learn · Practice</p>
        <h1>Your next skill starts here.</h1>
        <p className="page-subtitle">
          Clear lessons, focused practice and a little progress every day.
        </p>
      </header>
      {enrolled && (
        <section className="continue-learning" aria-label="Continue learning">
          <span className="continue-learning__icon">
            <FiPlay aria-hidden="true" />
          </span>
          <div>
            <small>Your learning space</small>
            <strong>{enrolled.title}</strong>
          </div>
          <Link
            className="common-btn common-btn--secondary"
            to={`/course/study/${enrolled._id}`}
          >
            Continue learning <FiArrowRight aria-hidden="true" />
          </Link>
        </section>
      )}
      <section className="courses-main-content" aria-label="Explore courses">
        <div className="courses-section-head">
          <h2>Explore courses</h2>
          <span className="course-count" role="status">
            {filteredCourses.length}{" "}
            {filteredCourses.length === 1 ? "course" : "courses"}
          </span>
        </div>
        <div className="filter-section">
          <label className="search-input-group">
            <FiSearch aria-hidden="true" />
            <input
              type="search"
              aria-label="Search courses"
              placeholder="Search courses or topics…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>
          <div className="category-pills" aria-label="Course categories">
            {categories.map((cat) => (
              <button
                type="button"
                key={cat}
                className="category-pill"
                aria-pressed={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="courses-grid-layout">
          {filteredCourses.length ? (
            filteredCourses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))
          ) : (
            <div className="no-results-state">
              <h3>No courses found</h3>
              <p>Try another search or category.</p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("All");
                }}
                className="common-btn common-btn--secondary"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
export default Courses;
