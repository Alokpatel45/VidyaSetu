import CourseCard from "../../components/courseCard/CourseCard";
import { CourseData } from "../../context/CourseContext";
import "./courses.css";
import React, { useState, useMemo } from "react";

const Courses = () => {
  const { courses } = CourseData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = [
    "All",
    "Web Development",
    "App Development",
    "DSA",
    "Artificial Intelligence",
    "Game Development",
    "Programming Language",
  ];

  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    return courses.filter((c) => {
      const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Smart matching: Even if DB has "Devwlopment", "Development" will match it
      const categoryMatch = (actual, selected) => {
        if (selected === "All") return true;
        if (actual === selected) return true;
        if (selected === "Web Development" && actual === "Web Devwlopment") return true;
        return false;
      };

      return matchesSearch && categoryMatch(c.category, selectedCategory);
    });
  }, [courses, searchTerm, selectedCategory]);

  return (
    <div className="courses-page-wrapper">
      <div className="courses-hero">
        <div className="hero-content">
          <h1>Discover Your Next Skill</h1>
          <p>Explore structured courses designed to take you from beginner to pro.</p>

          <div className="search-box-container">
            <div className="search-input-group">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search for courses, topics, or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="courses-main-content">
        <div className="filter-section">
          <div className="category-pills">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-pill ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="course-count">
            Showing {filteredCourses.length} courses
          </div>
        </div>

        <div className="courses-grid-layout">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((e) => <CourseCard key={e._id} course={e} />)
          ) : (
            <div className="no-results-state">
              <div className="empty-icon">📂</div>
              <h3>No courses found</h3>
              <p>Try adjusting your search or filter to find what you're looking for.</p>
              <button onClick={() => { setSearchTerm(""); setSelectedCategory("All"); }} className="reset-btn">
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Courses;
