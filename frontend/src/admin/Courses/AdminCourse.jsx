import React, { useState } from "react";
import Layout from "../Utils/Layout";
import { useNavigate } from "react-router-dom";
import { CourseData } from "../../context/CourseContext";
import CourseCard from "../../components/courseCard/CourseCard";
import "./adminCourse.css";
import toast from "react-hot-toast";
import api from "../../utils/api";
import { getApiErrorMessage } from "../../utils/apiErrorMessage";

const AdminCourse = ({ user }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [duration, setDuration] = useState("");
  const [image, setImage] = useState(null);
  const [imagePrev, setImagePrev] = useState("");
  const [btnLoading, setBtnLoading] = useState(false);
  
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState("");

  const categories = [
    "Web Development",
    "App Development",
    "DSA",
    "Artificial Intelligence",
    "Game Development",
    "Programming Language",
  ];

  if (user && user.role !== "admin") {
    return navigate("/");
  }

  const { courses, fetchCourses } = CourseData();

  const handleEdit = (course) => {
    setEditMode(true);
    setEditId(course._id);
    setTitle(course.title);
    setDescription(course.description);
    setCategory(course.category);
    setPrice(course.price);
    setCreatedBy(course.createdBy);
    setDuration(course.duration);
    setImagePrev(course.image);
    // Note: image (the file) is left as null unless the user chooses a new one
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditId("");
    setTitle("");
    setCategory("");
    setDescription("");
    setDuration("");
    setPrice("");
    setImage(null);
    setImagePrev("");
    setCreatedBy("");
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    const trimmedDesc = description.trim();
    if (trimmedDesc.length < 10) {
      toast.error("Description must be at least 10 characters.");
      return;
    }
    if (!category.trim()) {
      toast.error("Please choose a category.");
      return;
    }

    // Only require image for NEW courses, optional for EDIT
    if (!editMode && !(image instanceof Blob)) {
      toast.error("Please choose a course thumbnail image.");
      return;
    }

    setBtnLoading(true);
    const myForm = new FormData();
    myForm.append("title", title.trim());
    myForm.append("description", trimmedDesc);
    myForm.append("category", category.trim());
    myForm.append("price", String(price).trim());
    myForm.append("createdBy", createdBy.trim());
    myForm.append("duration", duration);

    if (image instanceof Blob) {
      myForm.append(
        "file",
        image,
        image instanceof File && image.name ? image.name : "course-thumbnail.jpg"
      );
    }

    try {
      if (editMode) {
        const { data } = await api.put(`/api/course/${editId}`, myForm);
        toast.success(data.message);
      } else {
        const { data } = await api.post("/api/course/new", myForm);
        toast.success(data.message);
      }

      await fetchCourses();
      cancelEdit();
    } catch (error) {
      toast.error(getApiErrorMessage(error, `Failed to ${editMode ? 'update' : 'create'} course`));
    } finally {
      setBtnLoading(false);
    }
  };

  const changeImageHandler = (e) => {
    const input = e.target;
    const file = input.files?.[0];

    if (!file || !(file instanceof Blob)) {
      setImage(null);
      if (!editMode) setImagePrev(""); // Keep old preview in edit mode
      if (input.files?.length) {
        toast.error("Could not use that image. Choose a JPG, PNG, WebP, or GIF file.");
      }
      input.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePrev(typeof reader.result === "string" ? reader.result : "");
      setImage(file);
    };
    reader.onerror = () => {
      toast.error("Could not preview the image. Try another file.");
      setImage(null);
      if (!editMode) setImagePrev("");
      input.value = "";
    };
    reader.readAsDataURL(file);
  };

  return (
    <Layout>
      <div className="admin-courses">
        <div className="left">
          <h1>All Courses</h1>
          <div className="dashboard-content">
            {courses && courses.length > 0 ? (
              courses.map((e) => {
                return <CourseCard key={e._id} course={e} onEdit={handleEdit}></CourseCard>;
              })
            ) : (
              <p>No courses</p>
            )}
          </div>
        </div>
        <div className="right">
          <div className="add-course">
            <div className="course-form">
              <h2>{editMode ? "Edit Course" : "Add Course"}</h2>
              <form onSubmit={submitHandler}>
                <label htmlFor="text">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  minLength={3}
                  maxLength={100}
                  required
                />
                <label htmlFor="course-description">Description</label>
                <textarea
                  id="course-description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Minimum 10 characters"
                  minLength={10}
                  maxLength={2000}
                  required
                />
                <label htmlFor="text">Price</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
                <label htmlFor="text">CreatedBy</label>
                <input
                  type="text"
                  value={createdBy}
                  onChange={(e) => setCreatedBy(e.target.value)}
                  placeholder="Min 2 characters"
                  minLength={2}
                  maxLength={100}
                  required
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  {categories.map((e) => (
                    <option value={e} key={e}>
                      {e}
                    </option>
                  ))}
                </select>
                <label htmlFor="course-duration-weeks">
                  Duration (weeks, number only)
                </label>
                <input
                  id="course-duration-weeks"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />
                <label htmlFor="course-thumbnail">Course thumbnail {editMode && "(Leave empty to keep current)"}</label>
                <input
                  id="course-thumbnail"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                  onChange={changeImageHandler}
                  required={!editMode}
                />
                {imagePrev && <img src={imagePrev} width={300} alt="Course Preview" />}
                
                <div className="form-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    className="common-btn"
                    disabled={btnLoading}
                    type="submit"
                    style={{ flex: 1 }}
                  >
                    {btnLoading ? "Please wait" : (editMode ? "Update Course" : "Add Course")}
                  </button>
                  {editMode && (
                    <button
                      className="common-btn"
                      type="button"
                      onClick={cancelEdit}
                      style={{ flex: 1, backgroundColor: '#95a5a6' }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminCourse;
