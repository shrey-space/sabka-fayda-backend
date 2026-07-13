const otpStorage = new Map();

// ================= SEND OTP =================
const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    // Convert phone to string and remove spaces
    const cleanPhone = String(phone || "").trim();

    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit mobile number",
      });
    }

    // Fixed OTP for testing
    const otp = "123456";

    // Store OTP using the cleaned phone number
    otpStorage.set(cleanPhone, otp);

    console.log("========== SEND OTP ==========");
    console.log("Phone:", cleanPhone);
    console.log("Stored OTP:", otp);

    // Delete OTP after 10 minutes
    setTimeout(() => {
      otpStorage.delete(cleanPhone);
    }, 10 * 60 * 1000);

    return res.status(200).json({
      success: true,
      message: "OTP generated successfully",
      demoOtp: otp,
    });
  } catch (error) {
    console.error("SEND OTP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ================= VERIFY OTP =================
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Clean both values
    const cleanPhone = String(phone || "").trim();
    const enteredOtp = String(otp || "").trim();

    // Get stored OTP
    const storedOtp = otpStorage.get(cleanPhone);

    console.log("========== VERIFY OTP ==========");
    console.log("Phone:", cleanPhone);
    console.log("Entered OTP:", enteredOtp);
    console.log("Stored OTP:", storedOtp);

    if (!storedOtp) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or not found",
      });
    }

    // Compare as strings
    if (String(storedOtp) !== enteredOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // OTP successfully used
    otpStorage.delete(cleanPhone);

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


module.exports = {
  sendOtp,
  verifyOtp,
};