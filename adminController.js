const User = require("../models/User");
const Material = require("../models/Material");

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json({ users });
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }
  await user.deleteOne();
  res.json({ message: "User deleted" });
};

// GET /api/admin/materials
const getAllMaterials = async (req, res) => {
  const materials = await Material.find().populate("user", "name email");
  res.json({ materials });
};

module.exports = { getAllUsers, deleteUser, getAllMaterials };
