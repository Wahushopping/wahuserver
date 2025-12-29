const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const Wishlist = require("../models/Wishlist");

// ✅ Get all wishlist items for logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.userId });
    if (!wishlist || !wishlist.items.length) {
      return res.json({ items: [] });
    }

    // Ensure image is always a string URL
    const items = wishlist.items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      image: typeof item.image === "object" && item.image?.url ? item.image.url : item.image
    }));

    res.json({ items });
  } catch (err) {
    console.error("Fetch wishlist error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Toggle (Add/Remove) wishlist item
router.post("/toggle", authMiddleware, async (req, res) => {
  const userId = req.userId;
  let { id, name, image, price } = req.body;

  if (!id || !name || !price) {
    return res.status(400).json({ message: "Product ID, name, and price are required" });
  }

  try {
    // Normalize image to string URL
    if (typeof image === "object" && image.url) image = image.url;

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      wishlist = await Wishlist.create({ userId, items: [{ id, name, image, price }] });
      return res.json({ message: "💖 Added to Wishlist" });
    }

    const existing = wishlist.items.find(item => item.id === id);

    if (existing) {
      wishlist.items = wishlist.items.filter(item => item.id !== id);
      await wishlist.save();
      return res.json({ message: "💔 Removed from Wishlist" });
    } else {
      wishlist.items.push({ id, name, image, price });
      await wishlist.save();
      return res.json({ message: "💖 Added to Wishlist" });
    }
  } catch (err) {
    console.error("Wishlist toggle error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/wishlist/remove/:id
router.delete("/remove/:id", authMiddleware, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.userId });

    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    const itemExists = wishlist.items.find(item => item.id === req.params.id);
    if (!itemExists) {
      return res.status(404).json({ message: "Item not found in wishlist" });
    }

    wishlist.items = wishlist.items.filter(item => item.id !== req.params.id);
    await wishlist.save();

    res.json({ message: "Removed from wishlist" });
  } catch (err) {
    console.error("Remove wishlist error:", err);
    res.status(500).json({ message: "Server error removing item" });
  }
});


module.exports = router;
