const nodemailer = require("nodemailer");

// ======================================================
// OTP STORAGE
// ======================================================

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

    // Store OTP
    otpStorage.set(cleanPhone, otp);

    console.log("========== PHONE OTP ==========");
    console.log("Phone:", cleanPhone);
    console.log("OTP:", otp);

    // Delete OTP after 10 minutes
    setTimeout(() => {
      otpStorage.delete(cleanPhone);
    }, 10 * 60 * 1000);

    return res.status(200).json({
      success: true,
      message: "OTP generated successfully",

      // Only for testing
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

    // Remove OTP after successful verification
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

console.log("========== EMAIL CONFIG ==========");
console.log(
  "EMAIL_USER:",
  process.env.EMAIL_USER
    ? "Loaded"
    : "NOT LOADED"
);

console.log(
  "EMAIL_APP_PASSWORD:",
  process.env.EMAIL_APP_PASSWORD
    ? "Loaded"
    : "NOT LOADED"
);


// Create Gmail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});


// ======================================================
// VERIFY GMAIL SMTP CONNECTION
// ======================================================

transporter
  .verify()
  .then(() => {
    console.log(
      "✅ Gmail SMTP connection successful"
    );
  })
  .catch((error) => {
    console.error(
      "❌ Gmail SMTP connection failed"
    );

    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("Response:", error.response);
    console.error("Full Error:", error);
  });


// ======================================================
// EMAIL - SEND OTP
// ======================================================

const sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // Clean email
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


    // ==================================================
    // GENERATE 6-DIGIT OTP
    // ==================================================

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();


    // ==================================================
    // STORE OTP
    // ==================================================

    emailOtpStorage.set(cleanEmail, otp);

    console.log("========== EMAIL OTP ==========");
    console.log("Email:", cleanEmail);
    console.log("OTP:", otp);


    // ==================================================
    // SEND EMAIL
    // ==================================================

    const mailOptions = {
      from:
        `"Sabka Fayda" <${process.env.EMAIL_USER}>`,

      to: cleanEmail,

      subject:
        "Sabka Fayda - Email Verification OTP",

      html: `
        <div
          style="
            font-family: Arial, sans-serif;
            max-width: 500px;
            margin: auto;
            padding: 30px;
            text-align: center;
            border: 1px solid #eeeeee;
            border-radius: 15px;
          "
        >

          <h1
            style="
              color: #2196F3;
              margin-bottom: 10px;
            "
          >
            Sabka Fayda
          </h1>

          <h2>
            Email Verification
          </h2>

          <p
            style="
              color: #555555;
              font-size: 16px;
            "
          >
            Use the following OTP to verify
            your email address:
          </p>

          <div
            style="
              font-size: 35px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #2196F3;
              margin: 25px 0;
              padding: 15px;
              background-color: #E6F4FF;
              border-radius: 10px;
            "
          >
            ${otp}
          </div>

          <p
            style="
              color: #555555;
            "
          >
            This OTP is valid for
            <strong>10 minutes</strong>.
          </p>

          <p
            style="
              color: grey;
              font-size: 13px;
              margin-top: 30px;
            "
          >
            Do not share this OTP with anyone.
          </p>

        </div>
      `,
    };


    console.log(
      "Attempting to send email to:",
      cleanEmail
    );


    // Send the email
    const info = await transporter.sendMail(
      mailOptions
    );


    console.log(
      "✅ EMAIL SENT SUCCESSFULLY"
    );

    console.log(
      "Message ID:",
      info.messageId
    );


    // ==================================================
    // DELETE OTP AFTER 10 MINUTES
    // ==================================================

    setTimeout(() => {
      emailOtpStorage.delete(cleanEmail);

      console.log(
        "Email OTP expired for:",
        cleanEmail
      );
    }, 10 * 60 * 1000);


    // ==================================================
    // SUCCESS RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,
      message:
        "OTP sent successfully to your email",
    });

  } catch (error) {

    // ==================================================
    // DETAILED ERROR LOGGING
    // ==================================================

    console.error(
      "========== SEND EMAIL OTP ERROR =========="
    );

    console.error(
      "Message:",
      error.message
    );

    console.error(
      "Code:",
      error.code
    );

    console.error(
      "Response:",
      error.response
    );

    console.error(
      "Response Code:",
      error.responseCode
    );

    console.error(
      "Command:",
      error.command
    );

    console.error(
      "Full Error:",
      error
    );


    // ==================================================
    // ERROR RESPONSE
    // ==================================================

    return res.status(500).json({
      success: false,

      message:
        "Failed to send email OTP",

      // Temporary debugging
      // Remove this in production
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


    // Clean email
    const cleanEmail = String(email || "")
      .trim()
      .toLowerCase();


    // Clean entered OTP
    const enteredOtp = String(
      otp || ""
    ).trim();


    // Get stored OTP
    const storedOtp =
      emailOtpStorage.get(cleanEmail);


    console.log(
      "========== VERIFY EMAIL OTP =========="
    );

    console.log(
      "Email:",
      cleanEmail
    );

    console.log(
      "Entered OTP:",
      enteredOtp
    );

    console.log(
      "Stored OTP:",
      storedOtp
    );


    // OTP not found
    if (!storedOtp) {
      return res.status(400).json({
        success: false,
        message:
          "OTP expired or not found",
      });
    }


    // OTP does not match
    if (
      String(storedOtp) !==
      enteredOtp
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }


    // ==================================================
    // OTP VERIFIED
    // ==================================================

    emailOtpStorage.delete(
      cleanEmail
    );


    console.log(
      "✅ EMAIL VERIFIED:",
      cleanEmail
    );


    return res.status(200).json({
      success: true,

      message:
        "Email verified successfully",

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