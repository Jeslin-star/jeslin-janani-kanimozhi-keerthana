const User = require("../models/User");
const { generateAccessToken, generateRefreshToken } = require("../utils/tokens");

// POST /api/auth/register
const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    const error = new Error("User already exists with this email");
    error.status = 400;
    throw error;
  }

  const user = await User.create({ name, email, password, role });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  res.status(201).json({
    message: "Registered successfully",
    accessToken,
    refreshToken,
    user: { id: user._id, name: user.name, role: user.role },
  });
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  res.status(200).json({
    message: "Logged in",
    accessToken,
    refreshToken,
    user: { id: user._id, name: user.name, role: user.role },
  });
};

module.exports = { register, login };
