import React, { useEffect, useState } from "react";
import "./lecture.css";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { server } from "../main";
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
  if (user && user.role !== "admin" && !user.subscription.includes(params.id)) {
    return navigate("/");
  }
  async function fetchLectures() {
    try {
      const { data } = await axios.get(`${server}/api/lectures/${params.id}`, {
        headers: {
          token: localStorage.getItem("token"),
        },
      });
      setLectures(data.lectures);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching lectures:", error);
      setLoading(false);
    }
  }

  async function fetchLecture(id) {
    setLecLoading(true);
    try {
      const { data } = await axios.get(`${server}/api/lecture/${id}`, {
        headers: {
          token: localStorage.getItem("token"),
        },
      });
      setLecture(data.lecture);
      setLecLoading(false);
    } catch (error) {
      console.error("Error fetching lecture:", error);
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
      const { data } = await axios.post(
        `${server}/api/course/${params.id}`,
        myForm,
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        }
      );
      toast.success(data.message);
      setBtnLoading(false);
      setShow(false);
      fetchLectures();
      setDescription("");
      setTitle("");
      setVideo("");
      setVideoPreview("");
    } catch (error) {
      toast.error(error.response.data.message);
      setBtnLoading(false);
    }
  };
  const deleteHandler = async (id) => {
    if (confirm("Are you sure you want to delet this lecture")) {
      try {
        const { data } = await axios.delete(`${server}/api/lecture/${id}`, {
          headers: {
            token: localStorage.getItem("token"),
          },
        });
        toast.success(data.message);
        fetchLectures();
      } catch (error) {
        toast.error(error.response.data.message);
      }
    }
  };
  useEffect(() => {
    fetchLectures();
  }, []);

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <div className="lecture-page">
          <div className="left">
            {lecLoading ? (
              <Loading />
            ) : lecture ? (
              <div className="video-player-wrapper">
                <video
                  src={`${server}/${lecture.video.replace(/\\/g, "/")}`}
                  width="100%"
                  controls
                  controlsList="nodownload noremoteplayback"
                  disablePictureInPicture
                  disableRemotePlayback
                  autoPlay
                ></video>
                <h1>{lecture.title}</h1>
                <h3>{lecture.description}</h3>
              </div>
            ) : (
              <h1>Please select a lecture</h1>
            )}
          </div>

          <div className="right">
            {user && user.role === "admin" && (
              <button className="common-btn" onClick={() => setShow(!show)}>
                {show ? "Close Form" : "Add Lecture"}
              </button>
            )}

            {show && (
              <div className="lecture-form">
                <h2>Add Lecture</h2>
                <form onSubmit={submitHandler}>
                  <label htmlFor="text">Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />

                  <label htmlFor="text">Description</label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />

                  <input
                    type="file"
                    placeholder="choose video"
                    required
                    onChange={changeVideoHandler}
                  />
                  {videoPreview && (
                    <video src={videoPreview} width={300} controls></video>
                  )}
                  <button
                    disabled={btnLoading}
                    type="submit"
                    className="common-btn"
                  >
                    {btnLoading ? "Please wait" : "Add"}
                  </button>
                </form>
              </div>
            )}

            {lectures.length > 0 ? (
              lectures.map((e, i) => (
                <>
                  <div
                    className={`lecture-number ${
                      lecture && lecture._id === e._id ? "active" : ""
                    }`}
                    onClick={() => fetchLecture(e._id)}
                    key={e._id}
                    style={{ cursor: "pointer" }}
                  >
                    {i + 1}. {e.title}
                  </div>
                  {user && user.role === "admin" && (
                    <button
                      onClick={() => deleteHandler(e._id)}
                      className="common-btn"
                      style={{ backgroundColor: "red" }}
                    >
                      Delete {e.titile}
                    </button>
                  )}
                </>
              ))
            ) : (
              <p>No lectures</p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Lecture;
