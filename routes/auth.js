const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const JWT_SECRET = process.env.JWT_SECRET;

// ----------------------------------------
// REGISTER
// ----------------------------------------
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------------------------
// LOGIN
// ----------------------------------------
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "2d" });

    res.json({
      token,
      name: user.name,
      email: user.email,
      role: user.role
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------------------------
// FORGOT PASSWORD - SEND OTP
// ----------------------------------------
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required"
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        message: "Email not found"
      });
    }

    // ✅ Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpire = Date.now() + 5 * 60 * 1000; // 5 minutes
    await user.save();

    // ✅ Send OTP email
    await sendEmail({
      to: email,
      subject: "Wahu Password Reset OTP",
      text: `Your OTP is ${otp}. It is valid for 5 minutes.`
    });

    return res.json({
      success: true,
      message: "OTP sent to your email"
    });

  } catch (err) {
    console.error("❌ Forgot password error:", err); // 🔥 IMPORTANT
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again."
    });
  }
});

// ----------------------------------------
// RESET PASSWORD
// ----------------------------------------
router.post("/reset-password", async (req, res) => {
  const { email, otp, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.json({ success: false, message: "Email not found" });

    if (!user.otp || user.otp !== otp)
      return res.json({ success: false, message: "Invalid OTP" });

    if (user.otpExpire < Date.now())
      return res.json({ success: false, message: "OTP expired" });

    // 🔥 Hash the new password (IMPORTANT FIX)
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;

    user.otp = null;
    user.otpExpire = null;

    await user.save();

    res.json({ success: true, message: "Password reset successful!" });
  } 
  catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});


router.get("/create-admin", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    await User.create({
      name: "Main Admin",
      email: "admin@wahu.com",
      password: hashedPassword,
      role: "admin"
    });

    res.send("Admin created successfully!");
  } catch (err) {
    res.send("Admin already exists or error occurred");
  }
});


router.get("/test-mail", async (req, res) => {
  await sendEmail({
    to: "yourpersonalemail@gmail.com",
    subject: "Test Email",
    text: "Email system working"
  });
  res.send("Mail sent");
});

module.exports = router;





