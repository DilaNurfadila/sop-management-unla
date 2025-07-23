const express = require("express");
const router = express.Router();
const sopDocController = require("../controllers/sopDocController");
// const authenticateToken = require("../middlewares/authMiddleware");
const { authenticate } = require("../middlewares/authMiddleware");

router.get("/", authenticate, sopDocController.getAllDocs);
router.get("/:id", authenticate, sopDocController.getDocById);
router.post("/", authenticate, sopDocController.createDoc);
router.put("/:id", authenticate, sopDocController.updateDoc);
router.put("/publish/:id", authenticate, sopDocController.publishDoc);
router.put("/unpublish/:id", authenticate, sopDocController.unpublishDoc);
router.delete("/:id", authenticate, sopDocController.deleteDoc);
router.get("/protected", (req, res) => {
  res.json({ message: "This is a protected route", user: req.user });
});

module.exports = router;
