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

const otpStorage = new Map();
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
// EMAIL - SEND OTP USING RESEND
// ======================================================

const sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const cleanEmail = String(email || "")
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
      console.error("RESEND_API_KEY is not configured");

      return res.status(500).json({
        success: false,
        message: "Email service is not configured",
      });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    console.log("========== EMAIL OTP ==========");
    console.log("Email:", cleanEmail);
    console.log("OTP:", otp);

    // ==================================================
    // SEND EMAIL USING RESEND
    // ==================================================

    const { data, error } = await resend.emails.send({
      // For testing with Resend
      from: "Sabka Fayda <onboarding@resend.dev>",

      to: [cleanEmail],

      subject: "Sabka Fayda - Email Verification OTP",

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 500px;
          margin: auto;
          padding: 30px;
          text-align: center;
          border: 1px solid #eeeeee;
          border-radius: 15px;
        ">

          <h1 style="
            color: #2196F3;
            margin-bottom: 10px;
          ">
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

          <p style="color: #555555;">
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

    // Resend returned an error
    if (error) {
      console.error("========== RESEND ERROR ==========");
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Failed to send email OTP",
        error: error.message,
      });
    }

    // Store OTP only after email is successfully sent
    emailOtpStorage.set(cleanEmail, otp);

    console.log("✅ EMAIL SENT SUCCESSFULLY");
    console.log("Resend Email ID:", data?.id);

    // Delete OTP after 10 minutes
    setTimeout(() => {
      emailOtpStorage.delete(cleanEmail);

      console.log(
        "Email OTP expired for:",
        cleanEmail
      );
    }, 10 * 60 * 1000);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email",
    });
  } catch (error) {
    console.error(
      "========== SEND EMAIL OTP ERROR =========="
    );

    console.error("Message:", error.message);
    console.error("Full Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send email OTP",
      error: error.message,
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

    console.log(
      "========== VERIFY EMAIL OTP =========="
    );

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

    emailOtpStorage.delete(cleanEmail);

    console.log("✅ EMAIL VERIFIED:", cleanEmail);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      email: cleanEmail,
    });
  } catch (error) {
    console.error(
      "VERIFY EMAIL OTP ERROR:",
      error
    );

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