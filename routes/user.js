const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");

router.put("/address", authMiddleware, async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ message: "Address is required." });
    }

    console.log("✅ Final Parsed Body:", JSON.stringify(req.body, null, 2));
    console.log("User from authMiddleware:", req.user);

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { address },
      { new: true }
    );

    res.json({ message: "Address updated successfully", user: updatedUser });
  } catch (err) {
    console.error("Error updating address:", err);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/me", authMiddleware, async (req, res) => {
  try {
    res.json(req.user); // This now works correctly!
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});




module.exports = router;
