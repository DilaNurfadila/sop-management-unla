const SopDoc = require("../models/SopDoc");
const jwt = require("jsonwebtoken");
const {
  storage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} = require("../config/firebase");

exports.getAllDocs = async (req, res) => {
  try {
    const docs = await SopDoc.findAllSopDoc();
    res.status(200).json(docs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPublishedDocs = async (req, res) => {
  try {
    const docs = await SopDoc.findPublishedSopDocs();
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

// Update file method for Firebase + sop_documents table
exports.updateFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, title, organization, effective_date, version } = req.body;

    if (!code || !title) {
      return res.status(400).json({ error: "Code and title are required" });
    }

    // Get existing document
    const existingDoc = await SopDoc.findById(id);
    if (!existingDoc) {
      return res.status(404).json({ error: "Document not found" });
    }

    let downloadURL = existingDoc.url; // Keep existing URL by default

    // If a new file is uploaded, handle file replacement
    if (req.file) {
      // Validate file type
      if (req.file.mimetype !== "application/pdf") {
        return res.status(400).json({ error: "Only PDF files are allowed" });
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (req.file.size > maxSize) {
        return res.status(400).json({ error: "File size exceeds 10MB limit" });
      }

      // Generate unique filename for new file
      const timestamp = Date.now();
      const sanitizedName = req.file.originalname.replace(/\s+/g, "_");
      const fileName = `upload/${timestamp}_${sanitizedName}`;

      // Create storage reference for new file
      const newStorageRef = ref(storage, fileName);

      // Upload new file to Firebase Storage
      const uploadResult = await uploadBytes(newStorageRef, req.file.buffer, {
        contentType: req.file.mimetype,
        customMetadata: {
          originalName: req.file.originalname,
          uploadedAt: new Date().toISOString(),
          code: code,
          title: title,
        },
      });

      // Get new download URL
      downloadURL = await getDownloadURL(uploadResult.ref);

      // Delete old file from Firebase Storage
      try {
        if (existingDoc.url) {
          // Extract the file path from the URL
          const oldUrl = new URL(existingDoc.url);
          const oldFileName = decodeURIComponent(
            oldUrl.pathname.split("/").pop()
          );

          // Find the file path after 'o/' in the URL
          const pathMatch = oldUrl.pathname.match(/\/o\/(.+?)(?:\?|$)/);
          if (pathMatch) {
            const oldFilePath = decodeURIComponent(pathMatch[1]);
            const oldFileRef = ref(storage, oldFilePath);
            await deleteObject(oldFileRef);
          }
        }
      } catch (deleteError) {
        console.warn(
          "Warning: Could not delete old file:",
          deleteError.message
        );
        // Continue with update even if old file deletion fails
      }
    }

    // Update document data
    const sopData = {
      sop_code: code,
      sop_title: title,
      url: downloadURL, // Either new URL or existing URL
      organization: organization || null,
      sop_applicable:
        effective_date && effective_date.trim() !== ""
          ? effective_date
          : existingDoc.sop_applicable, // Keep existing date if not provided
      sop_version: version || null,
    };

    const updatedDoc = await SopDoc.updateSopDoc(id, sopData);

    res.status(200).json({
      message: req.file
        ? "Document and file updated successfully"
        : "Document updated successfully",
      id: id,
      url: downloadURL,
      ...sopData,
    });
  } catch (error) {
    console.error("Error updating file:", error);

    // Handle validation errors
    if (
      error.message.includes("Only PDF files are allowed") ||
      error.message.includes("File size exceeds") ||
      error.message.includes("Kode SOP sudah digunakan")
    ) {
      return res.status(400).json({
        error: error.message,
      });
    }

    res.status(500).json({
      error: "Failed to update file",
      details: error.message,
    });
  }
};

exports.deleteDoc = async (req, res) => {
  try {
    // First get the document to check if it has a URL
    const doc = await SopDoc.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    // If document has a URL, try to delete from Firebase Storage
    if (doc.url) {
      try {
        // Extract file path from URL
        const urlPattern = /\/o\/(.+?)\?/;
        const match = doc.url.match(urlPattern);
        if (match) {
          const filePath = decodeURIComponent(match[1]);
          const fileRef = ref(storage, filePath);
          await deleteObject(fileRef);
        }
      } catch (firebaseError) {
        console.error("Error deleting file from Firebase:", firebaseError);
        // Continue with database deletion even if Firebase deletion fails
      }
    }

    // Delete from database
    await SopDoc.delete(req.params.id);
    res.status(200).json({ message: "SOP document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ message: error.message });
  }
};

// New upload file method for Firebase + sop_documents table
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { code, title, organization, effective_date, version } = req.body;

    if (!code || !title) {
      return res.status(400).json({ error: "Code and title are required" });
    }

    // Validate file type
    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "Only PDF files are allowed" });
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
      return res.status(400).json({ error: "File size exceeds 10MB limit" });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = req.file.originalname.replace(/\s+/g, "_");
    const fileName = `sop-documents/${timestamp}_${sanitizedName}`;

    // Create storage reference
    const storageRef = ref(storage, fileName);

    // Upload file to Firebase Storage
    const uploadResult = await uploadBytes(storageRef, req.file.buffer, {
      contentType: req.file.mimetype,
      customMetadata: {
        originalName: req.file.originalname,
        uploadedAt: new Date().toISOString(),
        code: code,
        title: title,
      },
    });

    // Get download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);

    // Save to database
    // Handle empty string dates properly
    const finalDate =
      effective_date && effective_date.trim() !== ""
        ? effective_date
        : new Date().toISOString().split("T")[0];

    const sopData = {
      sop_code: code,
      sop_title: title,
      url: downloadURL,
      status: "draft",
      organization: organization || null,
      sop_applicable: finalDate,
      sop_version: version || null,
    };

    const newDoc = await SopDoc.createSopDoc(sopData);

    res.status(201).json({
      message: "PDF file uploaded and saved successfully",
      id: newDoc.id,
      url: downloadURL,
      ...sopData,
    });
  } catch (error) {
    console.error("Error uploading file:", error);

    // Handle validation errors
    if (
      error.message.includes("Only PDF files are allowed") ||
      error.message.includes("File size exceeds") ||
      error.message.includes("Kode SOP sudah digunakan")
    ) {
      return res.status(400).json({
        error: error.message,
      });
    }

    res.status(500).json({
      error: "Failed to upload file",
      details: error.message,
    });
  }
};
