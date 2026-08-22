import React, { useEffect, useState } from "react";
import "./lecture.css";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../utils/api";
import { resolveMediaUrl } from "../utils/mediaUrl";
import { subscriptionIncludes } from "../utils/subscription";
import Loading from "../components/loding/Loading";
import toast from "react-hot-toast";
import {
  FiPlay,
  FiPlus,
  FiTrash2,
  FiTv,
  FiChevronRight,
  FiChevronLeft,
  FiUploadCloud,
  FiBookOpen,
  FiCpu,
  FiX,
  FiFileText,
} from "react-icons/fi";

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
    if (!file) return;
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

  const currentIndex = lectures.findIndex((e) => e._id === lecture?._id);
  const prevLecture = currentIndex > 0 ? lectures[currentIndex - 1] : null;
  const nextLecture =
    currentIndex !== -1 && currentIndex < lectures.length - 1
      ? lectures[currentIndex + 1]
      : null;

  return (
    <div className="lecture-page-container">
      {loading ? (
        <Loading />
      ) : (
        <div className="lecture-workspace">
          {/* Main Content Area */}
          <div className="lecture-view-section">
            {lecLoading ? (
              <div className="player-loading">
                <Loading />
              </div>
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

                {/* Player Toolbar & Meta */}
                <div className="lecture-info">
                  <div className="lecture-meta-header">
                    <span className="lecture-tag">
                      <span className="live-dot"></span> Lecture {currentIndex + 1} of {lectures.length}
                    </span>
                    
                    <div className="lecture-actions-nav">
                      <button
                        className="nav-lec-btn"
                        disabled={!prevLecture}
                        onClick={() => prevLecture && fetchLecture(prevLecture._id)}
                      >
                        <FiChevronLeft size={16} /> Prev
                      </button>
                      <button
                        className="nav-lec-btn"
                        disabled={!nextLecture}
                        onClick={() => nextLecture && fetchLecture(nextLecture._id)}
                      >
                        Next <FiChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                  <h1 className="lecture-title-text">{lecture.title}</h1>
                  <p className="lecture-desc-text">{lecture.description}</p>

                  <div className="lecture-quick-tools">
                    <Link to="/ai" className="ai-assist-btn">
                      <FiCpu /> Ask AI Tutor
                    </Link>
                    <Link to={`/ai/quiz/${params.id}`} className="quiz-assist-btn">
                      <FiFileText /> Take Practice Quiz
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-lecture-selected">
                <div className="empty-icon-wrapper">
                  <FiTv size={48} />
                </div>
                <h2>Ready to start learning?</h2>
                <p>Select a lecture from the course playlist on the right to begin watching.</p>
              </div>
            )}
          </div>

          {/* Sidebar Playlist */}
          <div className="lecture-sidebar">
            <div className="sidebar-header">
              <div className="sidebar-header-title">
                <FiBookOpen className="sidebar-icon" />
                <h3>Course Content</h3>
              </div>
              <span className="lec-count-pill">{lectures.length} Lectures</span>
            </div>

            {user && user.role === "admin" && (
              <div className="admin-actions">
                <button
                  className={`add-lec-btn ${show ? "active" : ""}`}
                  onClick={() => setShow(!show)}
                >
                  {show ? (
                    <>
                      <FiX /> Close Form
                    </>
                  ) : (
                    <>
                      <FiPlus /> Add New Lecture
                    </>
                  )}
                </button>
              </div>
            )}

            {show && (
              <div className="admin-form-overlay">
                <form className="add-lecture-form" onSubmit={submitHandler}>
                  <h3>Upload New Lecture</h3>
                  <div className="form-field">
                    <label>Lecture Title</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. 01 - Introduction to Course"
                    />
                  </div>
                  <div className="form-field">
                    <label>Description</label>
                    <textarea
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what students will learn..."
                    />
                  </div>
                  <div className="form-field">
                    <label className="file-input-label">
                      <FiUploadCloud size={24} />
                      <span>{video ? video.name || "Video File Selected" : "Upload Video File"}</span>
                      <input
                        type="file"
                        required
                        onChange={changeVideoHandler}
                        accept="video/*"
                      />
                    </label>
                  </div>
                  <button disabled={btnLoading} type="submit" className="submit-btn">
                    {btnLoading ? "Uploading Video..." : "Publish Lecture"}
                  </button>
                </form>
              </div>
            )}

            <div className="playlist-area">
              {lectures.length > 0 ? (
                lectures.map((e, i) => {
                  const isActive = lecture && lecture._id === e._id;
                  return (
                    <div key={e._id} className="playlist-item-wrapper">
                      <div
                        className={`playlist-item ${isActive ? "is-active" : ""}`}
                        onClick={() => fetchLecture(e._id)}
                      >
                        <div className="lec-index-badge">
                          {isActive ? <FiPlay size={14} /> : i + 1}
                        </div>
                        <div className="lec-details">
                          <span className="lec-title">{e.title}</span>
                          <span className="lec-status">
                            {isActive ? "Now Playing" : "Video Lecture"}
                          </span>
                        </div>
                      </div>
                      {user && user.role === "admin" && (
                        <button
                          onClick={() => deleteHandler(e._id)}
                          className="delete-lec-icon"
                          title="Delete Lecture"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="no-lecs">No lectures available in this course yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lecture;

