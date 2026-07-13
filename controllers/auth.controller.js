const nodemailer = require("nodemailer");

// ================= OTP STORAGE =================

// Phone OTPs
const otpStorage = new Map();

// Email OTPs
const emailOtpStorage = new Map();


// ======================================================
// PHONE - SEND OTP
// ======================================================

const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    const cleanPhone = String(phone || "").trim();

    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit mobile number",
      });
    }

    // Fixed OTP for phone testing
    const otp = "123456";

    otpStorage.set(cleanPhone, otp);

    console.log("========== PHONE OTP ==========");
    console.log("Phone:", cleanPhone);
    console.log("OTP:", otp);

    // Delete after 10 minutes
    setTimeout(() => {
      otpStorage.delete(cleanPhone);
    }, 10 * 60 * 1000);

    return res.status(200).json({
      success: true,
      message: "OTP generated successfully",
      demoOtp: otp,
    });
  } catch (error) {
    console.error("SEND PHONE OTP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ======================================================
// PHONE - VERIFY OTP
// ======================================================

const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const cleanPhone = String(phone || "").trim();
    const enteredOtp = String(otp || "").trim();

    const storedOtp = otpStorage.get(cleanPhone);

    if (!storedOtp) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or not found",
      });
    }

    if (String(storedOtp) !== enteredOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    otpStorage.delete(cleanPhone);

    return res.status(200).json({
      success: true,
      message: "Phone OTP verified successfully",
    });
  } catch (error) {
    console.error("VERIFY PHONE OTP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ======================================================
// NODEMAILER CONFIGURATION
// ======================================================

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});


// ======================================================
// EMAIL - SEND OTP
// ======================================================

const sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const cleanEmail = String(email || "")
      .trim()
      .toLowerCase();

    // Validate email
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address",
      });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Store OTP
    emailOtpStorage.set(cleanEmail, otp);

    console.log("========== EMAIL OTP ==========");
    console.log("Email:", cleanEmail);
    console.log("OTP:", otp);

    // Send email
    await transporter.sendMail({
      from: `"Sabka Fayda" <${process.env.EMAIL_USER}>`,

      to: cleanEmail,

      subject: "Sabka Fayda - Email Verification OTP",

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 500px;
          margin: auto;
          padding: 30px;
          text-align: center;
        ">

          <h1 style="color: #2196F3;">
            Sabka Fayda
          </h1>

          <h2>Email Verification</h2>

          <p>
            Use the following OTP to verify your email address:
          </p>

          <div style="
            font-size: 35px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #2196F3;
            margin: 25px;
          ">
            ${otp}
          </div>

          <p>
            This OTP is valid for 10 minutes.
          </p>

          <p style="color: grey;">
            Do not share this OTP with anyone.
          </p>

        </div>
      `,
    });

    // Delete after 10 minutes
    setTimeout(() => {
      emailOtpStorage.delete(cleanEmail);
    }, 10 * 60 * 1000);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email",
    });

  } catch (error) {
    console.error("SEND EMAIL OTP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send email OTP",
    });
  }
};


// ======================================================
// EMAIL - VERIFY OTP
// ======================================================

const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const cleanEmail = String(email || "")
      .trim()
      .toLowerCase();

    const enteredOtp = String(otp || "").trim();

    const storedOtp = emailOtpStorage.get(cleanEmail);

    console.log("========== VERIFY EMAIL OTP ==========");
    console.log("Email:", cleanEmail);
    console.log("Entered OTP:", enteredOtp);
    console.log("Stored OTP:", storedOtp);

    if (!storedOtp) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or not found",
      });
    }

    if (String(storedOtp) !== enteredOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // OTP verified
    emailOtpStorage.delete(cleanEmail);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      email: cleanEmail,
    });

  } catch (error) {
    console.error("VERIFY EMAIL OTP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  sendOtp,
  verifyOtp,
  sendEmailOtp,
  verifyEmailOtp,
};