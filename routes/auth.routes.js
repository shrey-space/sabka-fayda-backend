const express = require("express");

const {
  sendOtp,
  verifyOtp,
  sendEmailOtp,
  verifyEmailOtp,
} = require("../controllers/auth.controller");

const router = express.Router();

// Phone OTP
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// Email OTP
router.post("/send-email-otp", sendEmailOtp);
router.post("/verify-email-otp", verifyEmailOtp);

module.exports = router;