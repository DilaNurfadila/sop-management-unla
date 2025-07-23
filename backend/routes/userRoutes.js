const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/", userController.getAllUsers);
router.get("/:email", userController.getUserByEmail);
router.get("/:id", userController.getUserById);

module.exports = router;
