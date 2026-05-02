import React, { useEffect, useState } from "react";
import "./lecture.css";
import { useNavigate, useParams } from "react-router-dom";
import api from "../utils/api";
import { resolveMediaUrl } from "../utils/mediaUrl";
import { subscriptionIncludes } from "../utils/subscription";
import Loading from "../components/loding/Loading";
import toast from "react-hot-toast";

const Lecture = ({ user }) => {
  const [lectures, setLectures] = useState([]);
  const [lecture, setLecture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lecLoading, setLecLoading] = useState(false);
  const params = useParams();
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [video, setVideo] = useState("");
  const [videoPreview, setVideoPreview] = useState("");
  const [btnLoading, setBtnLoading] = useState(false);
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

  async function fetchLectures() {
    try {
      const { data } = await api.get(`/api/lectures/${params.id}`);
      setLectures(data.lectures);
      if (data.lectures.length > 0 && !lecture) {
        fetchLecture(data.lectures[0]._id);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  }

  async function fetchLecture(id) {
    setLecLoading(true);
    try {
      const { data } = await api.get(`/api/lecture/${id}`);
      setLecture(data.lecture);
      setLecLoading(false);
    } catch (error) {
      setLecLoading(false);
    }
  }

  const changeVideoHandler = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setVideoPreview(reader.result);
      setVideo(file);
    };
  };

  const submitHandler = async (e) => {
    setBtnLoading(true);
    e.preventDefault();
    const myForm = new FormData();
    myForm.append("title", title);
    myForm.append("description", description);
    myForm.append("file", video);
    try {
      const { data } = await api.post(`/api/course/${params.id}`, myForm);
      toast.success(data.message);
      setBtnLoading(false);
      setShow(false);
      fetchLectures();
      setDescription("");
      setTitle("");
      setVideo("");
      setVideoPreview("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add lecture");
      setBtnLoading(false);
    }
  };

  const deleteHandler = async (id) => {
    if (confirm("Are you sure you want to delete this lecture?")) {
      try {
        const { data } = await api.delete(`/api/lecture/${id}`);
        toast.success(data.message);
        fetchLectures();
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to delete lecture");
      }
    }
  };

  useEffect(() => {
    fetchLectures();
  }, []);

  return (
    <div className="lecture-page-container">
      {loading ? (
        <Loading />
      ) : (
        <div className="lecture-grid">
          {/* Left Side: Video Player */}
          <div className="lecture-view-section">
            {lecLoading ? (
              <div className="player-loading"><Loading /></div>
            ) : lecture ? (
              <div className="main-player-card">
                <div className="video-viewport">
                  <video
                    src={resolveMediaUrl(lecture.video)}
                    controls
                    controlsList="nodownload"
                    disablePictureInPicture
                    autoPlay
                    key={lecture._id}
                  ></video>
                </div>
                <div className="lecture-info">
                  <span className="lecture-tag">Now Playing</span>
                  <h1>{lecture.title}</h1>
                  <p>{lecture.description}</p>
                </div>
              </div>
            ) : (
              <div className="no-lecture-selected">
                <div className="empty-icon">📺</div>
                <h2>Ready to start?</h2>
                <p>Select a lecture from the sidebar to begin learning.</p>
              </div>
            )}
          </div>

          {/* Right Side: Sidebar */}
          <div className="lecture-sidebar">
            <div className="sidebar-header">
              <h2>Course Content</h2>
              <span className="lec-count">{lectures.length} Lectures</span>
            </div>

            {user && user.role === "admin" && (
              <div className="admin-actions">
                <button className="add-lec-btn" onClick={() => setShow(!show)}>
                  {show ? "Close Form" : "+ Add New Lecture"}
                </button>
              </div>
            )}

            {show && (
              <div className="admin-form-overlay">
                <form className="add-lecture-form" onSubmit={submitHandler}>
                  <h3>New Lecture</h3>
                  <div className="form-field">
                    <label>Title</label>
                    <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Introduction to React" />
                  </div>
                  <div className="form-field">
                    <label>Description</label>
                    <textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will students learn?" />
                  </div>
                  <div className="form-field">
                    <label className="file-input-label">
                      <span>{video ? "Video Selected" : "Upload Video"}</span>
                      <input type="file" required onChange={changeVideoHandler} accept="video/*" />
                    </label>
                  </div>
                  <button disabled={btnLoading} type="submit" className="submit-btn">
                    {btnLoading ? "Processing..." : "Create Lecture"}
                  </button>
                </form>
              </div>
            )}

            <div className="playlist-area">
              {lectures.length > 0 ? (
                lectures.map((e, i) => (
                  <div key={e._id} className="playlist-item-wrapper">
                    <div
                      className={`playlist-item ${lecture && lecture._id === e._id ? "is-active" : ""}`}
                      onClick={() => fetchLecture(e._id)}
                    >
                      <div className="lec-index">{i + 1}</div>
                      <div className="lec-details">
                        <span className="lec-title">{e.title}</span>
                        <span className="lec-status">{lecture && lecture._id === e._id ? "Playing" : "Available"}</span>
                      </div>
                    </div>
                    {user && user.role === "admin" && (
                      <button onClick={() => deleteHandler(e._id)} className="delete-lec-icon" title="Delete Lecture">
                        🗑️
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-lecs">No lectures available yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lecture;
