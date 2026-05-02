const isDevelopment = import.meta.env.DEV;

// For production, use VITE_API_URL if provided, otherwise default to relative path or localhost for dev
export const API_URL =
	import.meta.env.VITE_API_URL ||
	(isDevelopment ? "http://localhost:5000" : window.location.origin);

export const SOCKET_URL =
	import.meta.env.VITE_SOCKET_URL ||
	(isDevelopment ? "http://localhost:5000" : API_URL);
