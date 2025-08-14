const SopArchive = require("../models/SopArchive");
const axios = require("axios");

exports.getAllArchived = async (req, res) => {
  try {
    const archivedDocs = await SopArchive.getAllArchived();
    res.json(archivedDocs);
  } catch (error) {
    console.error("Error fetching archived documents:", error);
    res.status(500).json({ message: "Gagal mengambil data arsip" });
  }
};

exports.getArchivedVersions = async (req, res) => {
  try {
    const { sopId } = req.params;
    const archivedVersions = await SopArchive.getArchivedVersions(sopId);
    res.json(archivedVersions);
  } catch (error) {
    console.error("Error fetching archived versions:", error);
    res.status(500).json({ message: "Gagal mengambil versi arsip" });
  }
};

exports.getArchivedById = async (req, res) => {
  try {
    const { id } = req.params;
    const archivedDoc = await SopArchive.getArchivedById(id);

    if (!archivedDoc) {
      return res.status(404).json({ message: "Dokumen arsip tidak ditemukan" });
    }

    res.json(archivedDoc);
  } catch (error) {
    console.error("Error fetching archived document:", error);
    res.status(500).json({ message: "Gagal mengambil dokumen arsip" });
  }
};

exports.downloadArchivedFile = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Download request for archive ID:", id);

    const archivedDoc = await SopArchive.getArchivedById(id);

    if (!archivedDoc) {
      console.log("Archive document not found for ID:", id);
      return res.status(404).json({ message: "Dokumen arsip tidak ditemukan" });
    }

    console.log("Archived doc data:", archivedDoc);
    console.log("File path (Firebase URL):", archivedDoc.file_path);

    if (!archivedDoc.file_path) {
      console.log("File path is empty for archive ID:", id);
      return res
        .status(404)
        .json({ message: "URL file arsip tidak ditemukan" });
    }

    console.log("Fetching file from Firebase Storage...");

    // Use axios to fetch file from Firebase Storage
    const response = await axios.get(archivedDoc.file_path, {
      responseType: "stream",
    });

    console.log("Firebase response received, status:", response.status);
    console.log(
      "Content-Type from Firebase:",
      response.headers["content-type"]
    );
    console.log(
      "Content-Length from Firebase:",
      response.headers["content-length"]
    );

    // Set appropriate headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${
        archivedDoc.file_name || "archived-document.pdf"
      }"`
    );

    if (response.headers["content-length"]) {
      res.setHeader("Content-Length", response.headers["content-length"]);
    }

    console.log("Piping response to client...");

    // Pipe Firebase response directly to client
    response.data.pipe(res);
  } catch (error) {
    console.error("Error downloading archived file:", error.message);
    console.error(
      "Error details:",
      error.response?.status,
      error.response?.statusText
    );

    if (error.response && error.response.status === 404) {
      return res
        .status(404)
        .json({ message: "File tidak ditemukan di Firebase Storage" });
    }

    res.status(500).json({ message: "Gagal mengunduh file arsip" });
  }
};

exports.restoreDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const restoredBy = req.user.id;

    const result = await SopArchive.restoreDocument(id, restoredBy);
    res.json(result);
  } catch (error) {
    console.error("Error restoring document:", error);
    res.status(500).json({
      message: error.message || "Gagal mengembalikan dokumen",
    });
  }
};

exports.deleteArchived = async (req, res) => {
  try {
    const { id } = req.params;

    // Get archived document info first for file cleanup
    const archivedDoc = await SopArchive.getArchivedById(id);

    if (!archivedDoc) {
      return res.status(404).json({ message: "Dokumen arsip tidak ditemukan" });
    }

    // Delete from database
    const result = await SopArchive.deleteArchived(id);

    // Try to delete file (optional, don't fail if file doesn't exist)
    try {
      const filePath = path.join(__dirname, "..", archivedDoc.file_path);
      await fs.unlink(filePath);
    } catch (fileError) {
      console.warn("Could not delete archived file:", fileError.message);
    }

    res.json(result);
  } catch (error) {
    console.error("Error deleting archived document:", error);
    res.status(500).json({ message: "Gagal menghapus dokumen arsip" });
  }
};

exports.getArchiveStats = async (req, res) => {
  try {
    const stats = await SopArchive.getArchiveStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching archive stats:", error);
    res.status(500).json({ message: "Gagal mengambil statistik arsip" });
  }
};
