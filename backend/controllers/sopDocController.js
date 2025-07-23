const SopDoc = require("../models/SopDoc");
const jwt = require("jsonwebtoken");

exports.getAllDocs = async (req, res) => {
  try {
    const docs = await SopDoc.findAllSopDoc();
    res.status(200).json(docs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDocById = async (req, res) => {
  try {
    const doc = await SopDoc.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: "SOP document not found" });
    }
    res.status(200).json(doc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Sesuaikan dengan secret Anda
    const user = { id: decoded.id, email: decoded.email, registered: true }; // Asumsikan ini dari token
    res.status(200).json(user);
  } catch (error) {
    res.status(401).json({ message: "Invalid token or user not registered" });
  }
};

// Other exports (createDoc, updateDoc, etc.) remain the same
exports.createDoc = async (req, res) => {
  try {
    const newDoc = await SopDoc.createSopDoc(req.body);
    res
      .status(201)
      .json({ message: "SOP document created successfully", newDoc });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateDoc = async (req, res) => {
  try {
    const updatedDoc = await SopDoc.updateSopDoc(req.params.id, req.body);
    res
      .status(200)
      .json({ message: "SOP document updated successfully", updatedDoc });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.publishDoc = async (req, res) => {
  try {
    await SopDoc.publishSopDoc(req.params.id);
    const updatedDoc = await SopDoc.findById(req.params.id);
    res.status(200).json({
      message: "SOP document published successfully",
      status: "published",
      updatedDoc,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.unpublishDoc = async (req, res) => {
  try {
    await SopDoc.unpublishSopDoc(req.params.id);
    const updatedDoc = await SopDoc.findById(req.params.id);
    res.status(200).json({
      message: "SOP document unpublished successfully",
      status: "draft",
      updatedDoc,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteDoc = async (req, res) => {
  try {
    await SopDoc.delete(req.params.id);
    res.status(200).json({ message: "SOP document deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
