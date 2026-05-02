import { createContext, useContext, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import api from "../utils/api";
import {
  clearAccessToken,
  clearActivationToken,
  getAccessToken,
  getActivationToken,
  setAccessToken,
  setActivationToken,
} from "../utils/authStorage";

const UserContext = createContext();

export const UserContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuth, setIsAuth] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessTokenState] = useState(getAccessToken());

  const syncAccessToken = (token) => {
    setAccessToken(token);
    setAccessTokenState(token);
  };

  async function loginUser(email, password, navigate, fetchMyCourse) {
    setBtnLoading(true);
    try {
      const { data } = await api.post("/api/user/login", {
        email,
        password,
      });
      toast.success(data.message);
      syncAccessToken(data.accessToken);
      setUser(data.user);
      setIsAuth(true);
      setBtnLoading(false);
      navigate("/");
      fetchMyCourse?.();
    } catch (error) {
      setBtnLoading(false);
      setIsAuth(false);
      toast.error(error.response?.data?.message || "Login failed");
    }
  }

  async function registerUser(name, email, password, navigate) {
    setBtnLoading(true);
    try {
      const { data } = await api.post("/api/user/register", {
        name,
        email,
        password,
      });
      toast.success(data.message);
      setActivationToken(data.activationToken);
      setBtnLoading(false);
      navigate("/verify");
    } catch (error) {
      setBtnLoading(false);
      toast.error(error.response?.data?.message || "Registration failed");
    }
  }

  async function verifyOtp(otp, navigate) {
    const activationToken = getActivationToken();
    setBtnLoading(true);
    try {
      const { data } = await api.post("/api/user/verify", {
        otp,
        activationToken,
      });
      toast.success(data.message);
      
      // Automatic Login
      if (data.accessToken && data.user) {
        syncAccessToken(data.accessToken);
        setUser(data.user);
        setIsAuth(true);
        navigate("/");
      } else {
        navigate("/login");
      }
      
      clearActivationToken();
      setBtnLoading(false);
    } catch (error) {
      setBtnLoading(false);
      toast.error(error.response?.data?.message || "OTP verification failed");
    }
  }

  async function fetchUser() {
    try {
      const { data } = await api.get("/api/user/me");
      setIsAuth(true);
      setUser(data.user);
      if (data.accessToken) {
        syncAccessToken(data.accessToken);
      }
      setLoading(false);
    } catch (error) {
      clearAccessToken();
      setAccessTokenState(null);
      setIsAuth(false);
      setUser(null);
      setLoading(false);
    }
  }

  async function logoutUser(navigate) {
    try {
      await api.post("/api/user/logout");
    } catch (error) {
      console.log(error);
    } finally {
      clearAccessToken();
      setAccessTokenState(null);
      setUser(null);
      setIsAuth(false);
      navigate?.("/login");
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        setUser,
        setIsAuth,
        isAuth,
        loginUser,
        btnLoading,
        registerUser,
        verifyOtp,
        fetchUser,
        logoutUser,
        accessToken,
      }}
    >
      {children}
      <Toaster></Toaster>
    </UserContext.Provider>
  );
};
export const UserData = () => useContext(UserContext);
