import axios from "axios";
import { API_URL } from "../config";
import { getAccessToken, setAccessToken } from "./authStorage";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const nextToken = response.headers["x-access-token"] || response.headers["X-Access-Token"];
    if (nextToken) {
      setAccessToken(nextToken);
    }
    return response;
  },
  (error) => {
    const nextToken = 
      error.response?.headers?.["x-access-token"] || 
      error.response?.headers?.["X-Access-Token"];
    if (nextToken) {
      setAccessToken(nextToken);
    }
    return Promise.reject(error);
  }
);

export default api;
