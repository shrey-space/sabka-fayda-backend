const otpStorage = new Map();

const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit mobile number",
      });
    }

    // Generate 6-digit OTP
    const otp = "123456"

    // Store OTP temporarily
    otpStorage.set(phone, otp);

    console.log(`OTP for ${phone}: ${otp}`);

    // Delete OTP after 10 minutes
    setTimeout(() => {
      otpStorage.delete(phone);
    }, 10 * 60 * 1000);

    return res.status(200).json({
      success: true,
      message: "OTP generated successfully",

      // REMOVE THIS when real WhatsApp is connected
      demoOtp: otp,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const storedOtp = otpStorage.get(phone);

    if (!storedOtp) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or not found",
      });
    }

    if (storedOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // OTP used successfully, remove it
    otpStorage.delete(phone);

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });

  } catch (error) {
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