const { Resend } = require("resend");

// ======================================================
// RESEND CONFIGURATION
// ======================================================

const resend = new Resend(process.env.RESEND_API_KEY);

console.log("========== RESEND CONFIG ==========");
console.log(
  "RESEND_API_KEY:",
  process.env.RESEND_API_KEY ? "Loaded" : "NOT LOADED"
);

// ======================================================
// OTP STORAGE
// ======================================================

const phoneOtpStorage = new Map();
const emailOtpStorage = new Map();

const OTP_EXPIRY = 10 * 60 * 1000;

// ======================================================
// PHONE - SEND OTP
// ======================================================

const sendOtp = async (req, res) => {
  try {
    const cleanPhone = String(req.body.phone || "").trim();

    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit mobile number",
      });
    }

    // Fixed OTP for phone testing
    const otp = "123456";

    phoneOtpStorage.set(cleanPhone, otp);

    console.log("========== PHONE OTP ==========");
    console.log("Phone:", cleanPhone);
    console.log("OTP:", otp);

    setTimeout(() => {
      phoneOtpStorage.delete(cleanPhone);
    }, OTP_EXPIRY);

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
    const cleanPhone = String(req.body.phone || "").trim();
    const enteredOtp = String(req.body.otp || "").trim();

    const storedOtp = phoneOtpStorage.get(cleanPhone);

    console.log("========== VERIFY PHONE OTP ==========");
    console.log("Phone:", cleanPhone);
    console.log("Entered OTP:", enteredOtp);
    console.log("Stored OTP:", storedOtp);

    if (!storedOtp) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or not found",
      });
    }

    if (storedOtp !== enteredOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    phoneOtpStorage.delete(cleanPhone);

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
// EMAIL - SEND OTP USING RESEND
// ======================================================

const sendEmailOtp = async (req, res) => {
  try {
    const cleanEmail = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address",
      });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY NOT FOUND");

      return res.status(500).json({
        success: false,
        message: "Email service is not configured",
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    console.log("========== SENDING EMAIL OTP ==========");
    console.log("Recipient:", cleanEmail);
    console.log("OTP:", otp);

    // ==================================================
    // SEND THROUGH RESEND
    // ==================================================

    const result = await resend.emails.send({
      from: "Sabka Fayda <onboarding@resend.dev>",
      to: [cleanEmail],
      subject: "Sabka Fayda - Email Verification OTP",

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 500px;
          margin: 30px auto;
          padding: 30px;
          text-align: center;
          border: 1px solid #eeeeee;
          border-radius: 15px;
        ">

          <h1 style="color: #2196F3;">
            Sabka Fayda
          </h1>

          <h2>Email Verification</h2>

          <p style="
            color: #555555;
            font-size: 16px;
          ">
            Use the following OTP to verify your email address:
          </p>

          <div style="
            font-size: 35px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #2196F3;
            margin: 25px 0;
            padding: 15px;
            background-color: #E6F4FF;
            border-radius: 10px;
          ">
            ${otp}
          </div>

          <p>
            This OTP is valid for
            <strong>10 minutes</strong>.
          </p>

          <p style="
            color: grey;
            font-size: 13px;
            margin-top: 30px;
          ">
            Do not share this OTP with anyone.
          </p>

        </div>
      `,
    });

    console.log("========== RESEND RESPONSE ==========");
    console.log(result);

    // ==================================================
    // CHECK RESEND ERROR
    // ==================================================

    if (result.error) {
      console.error("❌ RESEND ERROR");
      console.error("Name:", result.error.name);
      console.error("Message:", result.error.message);

      return res.status(400).json({
        success: false,

        // Actual Resend error will now show in Flutter
        message:
          result.error.message ||
          "Failed to send email OTP",
      });
    }

    // ==================================================
    // STORE OTP ONLY AFTER EMAIL WAS SENT
    // ==================================================

    emailOtpStorage.set(cleanEmail, otp);

    console.log("✅ EMAIL SENT SUCCESSFULLY");
    console.log("Email ID:", result.data?.id);

    setTimeout(() => {
      emailOtpStorage.delete(cleanEmail);

      console.log(
        "Email OTP expired for:",
        cleanEmail
      );
    }, OTP_EXPIRY);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email",
    });
  } catch (error) {
    console.error(
      "========== SEND EMAIL OTP EXCEPTION =========="
    );

    console.error("Message:", error.message);
    console.error("Full Error:", error);

    return res.status(500).json({
      success: false,

      // Show actual error during development
      message:
        error.message ||
        "Failed to send email OTP",
    });
  }
};

// ======================================================
// EMAIL - VERIFY OTP
// ======================================================

const verifyEmailOtp = async (req, res) => {
  try {
    const cleanEmail = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const enteredOtp = String(req.body.otp || "").trim();

    if (!cleanEmail || !enteredOtp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    if (!/^\d{6}$/.test(enteredOtp)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 6-digit OTP",
      });
    }

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

    if (storedOtp !== enteredOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    emailOtpStorage.delete(cleanEmail);

    console.log("✅ EMAIL VERIFIED:", cleanEmail);

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