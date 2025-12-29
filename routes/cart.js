const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const authMiddleware = require("../middleware/authMiddleware");


// =========================================================
// 🛒 GET CART
// =========================================================
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const cart = await Cart.findOne({ userId });

    res.json({ items: cart?.items || [] });
  } catch (err) {
    console.error("Cart fetch error:", err.message);
    res.status(500).json({ message: "Failed to fetch cart" });
  }
});


// =========================================================
// 🛒 ADD TO CART  (REAL REF SUPPORT)
// =========================================================
router.post("/", authMiddleware, async (req, res) => {
  const userId = req.userId || req.user?._id;
  let items = req.body.items;

  // Support single item
  if (!items && req.body.id) {
    items = [req.body];
  }

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ message: "Invalid items" });
  }

  try {
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // ⭐ Create new cart with ref saved inside items
      cart = new Cart({
        userId,
        items: items.map(it => ({
          ...it,
          ref: it.ref || null
        }))
      });
    } else {
      // ⭐ Merge items + SAVE ref per-item
      for (let newItem of items) {
        const existingIndex = cart.items.findIndex(
          item => item.id === newItem.id && item.size === newItem.size
        );

        if (existingIndex !== -1) {
          // Update quantity
          cart.items[existingIndex].qty = newItem.qty;

          // ⭐ VERY IMPORTANT:
          // If the new item has a ref, update it
          if (newItem.ref) {
            cart.items[existingIndex].ref = newItem.ref;
          }

        } else {
          // ⭐ Add new item with referral saved
          cart.items.push({
            ...newItem,
            ref: newItem.ref || null
          });
        }
      }
    }

    await cart.save();
    res.status(200).json(cart);

  } catch (error) {
    console.error("Cart post error:", error.message);
    res.status(500).json({ message: "Failed to update cart" });
  }
});


// =========================================================
// ❌ REMOVE FROM CART
// =========================================================
router.delete("/", authMiddleware, async (req, res) => {
  const userId = req.userId || req.user?._id;
  const { id, size } = req.body;

  if (!id || !size) {
    return res.status(400).json({ message: "Missing id or size" });
  }

  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const initialLength = cart.items.length;

    cart.items = cart.items.filter(item => !(item.id === id && item.size === size));

    if (cart.items.length === initialLength) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    await cart.save();
    res.json({ message: "Item removed successfully", cart });

  } catch (err) {
    console.error("Cart delete error:", err.message);
    res.status(500).json({ message: "Failed to remove item" });
  }
});

module.exports = router;
