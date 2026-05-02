import { User } from "../models/user.js";
import {
  authCookieOptions,
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../utils/authTokens.js";

const getBearerToken = (req) => {
  const authorization = req.headers.authorization;
  if (authorization?.startsWith("Bearer ")) {
    return authorization.split(" ")[1];
  }
  return req.headers.token;
};

export const isAuth = async (req, res, next) => {
  try {
    const accessToken = getBearerToken(req);

    if (accessToken) {
      try {
        const decodedData = verifyAccessToken(accessToken);
        req.user = await User.findById(decodedData._id).select("-password");

        if (req.user) {
          return next();
        }
      } catch (accessError) {
        // Access token expired or invalid - continue to check refresh token
      }
    }

    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        message: "please login",
      });
    }

    const decodedRefresh = verifyRefreshToken(refreshToken);
    req.user = await User.findById(decodedRefresh._id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        message: "login first",
      });
    }

    // Replay attack prevention: Check if token's iat matches user's stored iat
    const tokenIssuedAt = decodedRefresh.iat ? new Date(decodedRefresh.iat * 1000) : null;
    const userTokenIssuedAt = req.user.refreshTokenIssuedAt;
    
    if (tokenIssuedAt && userTokenIssuedAt) {
      const timeDrift = Math.abs(tokenIssuedAt.getTime() - userTokenIssuedAt.getTime());
      if (timeDrift > 1000) {
        return res.status(401).json({
          message: "Token expired, please login again",
        });
      }
    }

    const newIssuedAt = new Date();
    req.user.refreshTokenIssuedAt = newIssuedAt;
    await req.user.save();

    req.accessToken = createAccessToken(req.user._id);
    res.setHeader("x-access-token", req.accessToken);
    res.cookie("refreshToken", createRefreshToken(req.user._id, newIssuedAt), authCookieOptions());
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    res.status(401).json({
      message: "login first",
    });
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        message: "you are not autherised",
      });
    }
    next();
  } catch (error) {
    res.status(401).json({
      message: error.message,
    });
  }
};
