const ACCESS_TOKEN_KEY = "vidyasetu_access_token";
const ACTIVATION_TOKEN_KEY = "vidyasetu_activation_token";

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);

export const setAccessToken = (token) => {
  if (!token) {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    return;
  }
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const clearAccessToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const getActivationToken = () => localStorage.getItem(ACTIVATION_TOKEN_KEY);

export const setActivationToken = (token) => {
  if (!token) {
    localStorage.removeItem(ACTIVATION_TOKEN_KEY);
    return;
  }
  localStorage.setItem(ACTIVATION_TOKEN_KEY, token);
};

export const clearActivationToken = () => {
  localStorage.removeItem(ACTIVATION_TOKEN_KEY);
};
