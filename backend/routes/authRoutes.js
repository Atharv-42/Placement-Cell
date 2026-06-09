const express = require("express");

const {
  register,
  login,
  verifyEmail,
  resendVerification,
  me,
  logout
} = require("../controllers/authController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.get("/me", authenticateToken, me);
router.post("/logout", authenticateToken, logout);

module.exports = router;
