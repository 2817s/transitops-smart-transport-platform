const express = require("express");

const {
  login,
  getProfile
} = require("../controllers/authController");

const authenticateUser = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", login);

router.get("/profile", authenticateUser, getProfile);

module.exports = router;