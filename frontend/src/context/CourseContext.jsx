import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../utils/api";
import { UserData } from "./UserContext.jsx";

const CourseContext = createContext();

export const CourseContextProvider = ({ children }) => {
  const { isAuth, loading: userLoading } = UserData();
  const [courses, setCourses] = useState([]);
  const [course, setCourse] = useState(null);
  const [myCourse, setMyCourse] = useState([]);

  const fetchCourses = useCallback(async () => {
    try {
      const { data } = await api.get("/api/course/all");
      setCourses(data.courses);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchCourse = useCallback(async (id) => {
    try {
      const { data } = await api.get(`/api/course/${id}`);
      setCourse(data.course ?? null);
    } catch (error) {
      console.error(error);
      setCourse(null);
    }
  }, []);

  const fetchMyCourse = useCallback(async () => {
    try {
      const { data } = await api.get("/api/mycourse");
      setMyCourse(data.courses);
    } catch (error) {
      if (error.response?.status && error.response.status !== 401) {
        console.error(error);
      }
      setMyCourse([]);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    if (userLoading) return;
    if (!isAuth) {
      setMyCourse([]);
      return;
    }
    fetchMyCourse();
  }, [userLoading, isAuth, fetchMyCourse]);

  return (
    <CourseContext.Provider
      value={{
        courses,
        fetchCourses,
        fetchCourse,
        course,
        myCourse,
        fetchMyCourse,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};

export const CourseData = () => useContext(CourseContext);
