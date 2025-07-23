const User = require("../models/User");
const jwt = require("jsonwebtoken");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAllUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserByEmail = async (req, res) => {
  try {
    const user = await User.findByEmail(req.params.email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Other exports (createDoc, updateDoc, etc.) remain the same
// exports.createDoc = async (req, res) => {
//   try {
//     const newDoc = await SopDoc.createSopDoc(req.body);
//     res
//       .status(201)
//       .json({ message: "SOP document created successfully", newDoc });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// exports.updateDoc = async (req, res) => {
//   try {
//     const updatedDoc = await SopDoc.updateSopDoc(req.params.id, req.body);
//     res
//       .status(200)
//       .json({ message: "SOP document updated successfully", updatedDoc });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// exports.deleteDoc = async (req, res) => {
//   try {
//     await SopDoc.delete(req.params.id);
//     res.status(200).json({ message: "SOP document deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
