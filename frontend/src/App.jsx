import React from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./home/Home";
import Header from "./components/header/Header";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Verify from "./pages/Auth/Verify";
import Footer from "./components/footer/Footer";
import About from "./pages/about/About";
import Account from "./pages/account/Account";
import { UserData } from "./context/UserContext";
import Loading from "./components/loding/Loading";
import Courses from "./pages/courses/Courses";
import CourseDescription from "./pages/courseDescription/CourseDescription";
import PaymentSuccess from "./pages/payemtSuccess/PaymentSuccess";
import Dashboard from "./pages/dashboard/Dashboard";
import CourseStudy from "./pages/coursestudy/CourseStudy";
import Lecture from "./lecture/Lecture";
import AdminDashboard from "./admin/Dashboard/AdminDashboard";
import AdminCourse from "./admin/Courses/AdminCourse";
import AdminUsers from "./admin/Users/AdminUsers";
import ChatBox from "./components/chatBox";
import Ai from "./pages/chatWithAI/Ai";
import Quiz from "./pages/quiz/Quiz";
const App = () => {
  const { isAuth, user, loading } = UserData();
  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <Router>
          <Header isAuth={isAuth} />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ai" element={<Ai />}></Route>
            <Route path="/ai/quiz/:id" element={<Quiz />} />

            <Route path="/about" element={<About />}></Route>
            <Route path="/courses" element={<Courses />}></Route>
            <Route
              path="/account"
              element={isAuth ? <Account user={user} /> : <Login />}
            ></Route>
            <Route path="/login" element={isAuth ? <Home /> : <Login />} />
            <Route
              path="/register"
              element={isAuth ? <Home /> : <Register />}
            />
            <Route path="/verify" element={isAuth ? <Home /> : <Verify />} />
            <Route
              path="/course/:id"
              element={
                isAuth ? (
                  <CourseDescription user={user}></CourseDescription>
                ) : (
                  <Login></Login>
                )
              }
            ></Route>
            <Route
              path="/payment-success/:id"
              element={
                isAuth ? (
                  <PaymentSuccess user={user}></PaymentSuccess>
                ) : (
                  <Login></Login>
                )
              }
            ></Route>
            <Route
              path="/:id/dashboard"
              element={
                isAuth ? <Dashboard user={user}></Dashboard> : <Login></Login>
              }
            ></Route>
            <Route
              path="/course/study/:id"
              element={
                isAuth ? (
                  <CourseStudy user={user}></CourseStudy>
                ) : (
                  <Login></Login>
                )
              }
            ></Route>
            <Route
              path="/lectures/:id"
              element={
                isAuth ? <Lecture user={user}></Lecture> : <Login></Login>
              }
            ></Route>
            <Route
              path="/admin/dashboard"
              element={
                isAuth ? <AdminDashboard user={user} /> : <Login></Login>
              }
            ></Route>
            <Route
              path="/admin/course"
              element={isAuth ? <AdminCourse user={user} /> : <Login></Login>}
            ></Route>
            <Route
              path="/admin/users"
              element={isAuth ? <AdminUsers user={user} /> : <Login></Login>}
            ></Route>
            <Route
              path="/chatbox"
              element={isAuth ? <ChatBox user={user} /> : <Login></Login>}
            ></Route>
          </Routes>
          <Footer></Footer>
        </Router>
      )}
    </>
  );
};

export default App;
