import asyncHandler from "express-async-handler";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

const sendUserResponse = (res, user, statusCode = 200) => {
  res.status(statusCode).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    preferredRole: user.preferredRole,
    role: user.role,
    token: generateToken(user._id, user.role),
  });
};

const registerUser = asyncHandler(async (req, res) => {
  try {
    console.log("REGISTER BODY:", req.body);

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please enter all required fields",
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const user = new User({
      name,
      email,
      password,
      role: "user",
    });

    await user.save();

    console.log("USER SAVED:", user.email);

    return res.status(201).json({
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
});

const loginUser = asyncHandler(async (req, res) => {
  console.log("LOGIN BODY:", req.body);

  const { email, password, loginAs } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    if (loginAs && user.role !== loginAs) {
      res.status(403);
      throw new Error(`You are not allowed to login as ${loginAs}`);
    }

    sendUserResponse(res, user);
  } else {
    res.status(401);
    throw new Error("Invalid email or password.");
  }
});

const googleLogin = asyncHandler(async (req, res) => {
  console.log("GOOGLE BODY:", req.body);

  const { token, loginAs } = req.body;

  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const { email_verified, name, email, sub: googleId } = payload;

  if (!email_verified) {
    res.status(401);
    throw new Error("Google email not verified.");
  }

  let user = await User.findOne({ googleId });

  if (!user) {
    user = await User.findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      user = await User.create({
        name,
        email,
        googleId,
        role: "user",
      });
    }
  }

  if (loginAs && user.role !== loginAs) {
    res.status(403);
    throw new Error(`You are not allowed to login as ${loginAs}`);
  }

  sendUserResponse(res, user);
});

const getUserProfile = asyncHandler(async (req, res) => {
  if (req.user) {
    sendUserResponse(res, req.user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

const updateUserProfile = asyncHandler(async (req, res) => {
  if (req.user) {
    const user = await User.findById(req.user._id);

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.preferredRole = req.body.preferredRole || user.preferredRole;

    if (req.body.password) {
      user.password = req.body.password;
    }

    await user.save();

    sendUserResponse(res, user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

export {
  registerUser,
  loginUser,
  googleLogin,
  getUserProfile,
  updateUserProfile,
};
