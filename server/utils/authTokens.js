import jwt from "jsonwebtoken";

const ACCESS_TOKEN_EXPIRES_IN = "30m";
const REFRESH_TOKEN_EXPIRES_IN = "30d";

const getAccessSecret = () => {
  const secret = process.env.ACCESS_JWT_Sec || process.env.JWT_Sec;
  if (process.env.NODE_ENV === "production" && !process.env.ACCESS_JWT_Sec) {
    console.warn("WARNING: Using fallback JWT_Sec for Access Tokens in production. Set ACCESS_JWT_Sec for better security.");
  }
  return secret;
};

const getRefreshSecret = () => {
  const secret = process.env.REFRESH_JWT_Sec || process.env.JWT_Sec;
  if (process.env.NODE_ENV === "production" && !process.env.REFRESH_JWT_Sec) {
    console.warn("WARNING: Using fallback JWT_Sec for Refresh Tokens in production. Set REFRESH_JWT_Sec for better security.");
  }
  return secret;
};

export const createAccessToken = (userId) => {
  return jwt.sign({ _id: userId, type: "access" }, getAccessSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
};

export const createRefreshToken = (userId, issuedAt = new Date()) => {
  return jwt.sign(
    { _id: userId, type: "refresh", iat: Math.floor(issuedAt.getTime() / 1000) },
    getRefreshSecret(),
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
};

export const verifyAccessToken = (token) => jwt.verify(token, getAccessSecret());

export const verifyRefreshToken = (token) =>
  jwt.verify(token, getRefreshSecret());

export const authCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  maxAge: 30 * 24 * 60 * 60 * 1000,
});

export const clearAuthCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
});

export const setAuthCookies = (res, userId, issuedAt = new Date()) => {
  const refreshToken = createRefreshToken(userId, issuedAt);
  res.cookie("refreshToken", refreshToken, authCookieOptions());
  return createAccessToken(userId);
};
