const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Order = require("../models/Order");
const User = require("../models/User");
const authMiddleware = require('../middleware/authMiddleware');
const Affiliate = require("../models/Affiliate");




const sendOrderEmail = require("../utils/sendOrderEmail");
const sendAdminOrderEmail = require("../utils/sendAdminOrderEmail");


const { getLevelByOrders, getCommissionByLevel } = require("../utils/affiliateUtils");


const JWT_SECRET = process.env.JWT_SECRET;

// ✅ Middleware to verify token (for normal users)
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}


// ================================================
// PLACE ORDER (NO COMMISSION ADDED AUTOMATICALLY)
// ================================================
// ================================================
// PLACE ORDER (SAFE REFERRAL LOGIC)
// ================================================
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { items, address, total, discount, finalAmount, paymentMethod } = req.body;

    let ref = req.body.ref || null;

    // 🚫 DO NOT TRUST frontend referral
    // Check if referral exists AND belongs to a valid affiliate
    let validRef = null;

    if (ref) {
      const affiliate = await Affiliate.findOne({ affiliateId: ref });
      if (affiliate) {
        validRef = ref;   // affiliate is real
      }
    }

    // Build full address
    const fullAddress = `${address.street}, ${address.place}, ${address.road}, ${address.city}, ${address.state} - ${address.pincode}`;

    // New order
    const newOrder = new Order({
      user: req.userId,
      items,
      address: { ...address, fullAddress },
      total,
      discount,
      finalAmount,
      paymentMethod,
      ref: validRef  // ⭐ ONLY VALID REF IS SAVED
    });

    // If referral valid → mark items pending
   if (validRef) {
  // get affiliate info
  const affiliate = await Affiliate.findOne({ affiliateId: validRef });

  newOrder.items = newOrder.items.map(item => ({
    ...item,
    productEarning: 0,
    earningStatus: "Pending",
    affiliateLevelAtTime: affiliate.level   // ⭐ VERY IMPORTANT
  }));
}


    await newOrder.save();


  // ===============================
// 📧 SEND EMAIL AFTER ORDER SAVE
// ===============================
try {
  const userId = req.userId || req.user?.userId || req.user?._id;
  const userData = await User.findById(userId).select("email name");

  if (userData?.email) {
    await sendOrderEmail(userData.email, {
      _id: newOrder._id,
      items: newOrder.items,
      finalAmount: newOrder.finalAmount,
      paymentMethod: newOrder.paymentMethod,
      address: newOrder.address
    });
  }

  await sendAdminOrderEmail({
    _id: newOrder._id,
    userEmail: userData?.email || "Guest",
    total: newOrder.finalAmount,
    paymentMethod: newOrder.paymentMethod
  });

} catch (emailErr) {
  console.error("📧 Email sending failed:", emailErr.message);
}


    // Update affiliate order count only if referral is valid
    if (validRef) {
      const affiliate = await Affiliate.findOne({ affiliateId: validRef });

      affiliate.orders = (affiliate.orders || 0) + 1;
      affiliate.level = getLevelByOrders(affiliate.orders);
      await affiliate.save();
    }

    return res.json({ orderId: newOrder._id });

  } catch (err) {
    console.error("Order Error:", err);
    res.status(500).json({ message: "Server Error: " + err.message });
  }
});



// POST /api/orders/:orderId/return
router.post("/:orderId/return", auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { itemId, reason, refundMethod, upi, bank } = req.body;

    if (!reason) return res.status(400).json({ message: "Reason required" });

    const userId = req.user.id || req.user.userId || req.user._id;
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) return res.status(404).json({ message: "Order not found" });

    const item = order.items.id(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (item.returnRequested) return res.status(400).json({ message: "Return already requested" });

    // Save return info
    item.returnRequested = true;
    item.returnReason = reason;
    item.returnDate = new Date();
    item.returnStatus = "Pending";

    // Map frontend fields to schema
    item.refundMethod = refundMethod || "";
    item.refundUPI = refundMethod === "UPI" ? upi || "" : "";
    item.refundBank = refundMethod === "Bank" ? {
      accountNumber: bank.accountNumber || "",
      ifsc: bank.ifsc || "",
      name: bank.name || ""
    } : { accountNumber: "", ifsc: "", name: "" };

    await order.save();
    res.json({ message: "Return request saved successfully" });

  } catch (err) {
    console.error("❌ Return request error:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});


// ✅ Get orders of logged-in user
router.get("/my", auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch {
    res.status(500).json({ message: "Error fetching orders" });
  }
});

// ✅ Get all orders — NO admin check
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch {
    res.status(500).json({ message: "Error fetching orders" });
  }
});

// ✅ Update status — NO admin check
// Example: Order update route
// ✅ Update status & delivery date
router.put("/:id/status", async (req, res) => {
  try {
    const { status, deliveryDate } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status, ...(deliveryDate && { deliveryDate }) },
      { new: true }
    );
    res.json(updatedOrder);
  } catch (err) {
    console.error("Order update failed:", err);
    res.status(500).json({ message: "Error updating order" });
  }
});


// ✅ Admin: Get all return requests
// ✅ Admin: Get all return requests
router.get("/returns", async (req, res) => {
  try {
    const ordersWithReturns = await Order.find({
      "items.returnRequested": true
    })
    .populate("user", "name email")
    .sort({ createdAt: -1 });

    // Normalize data for admin panel
    const normalized = ordersWithReturns.map(order => {
      return {
        _id: order._id,
        user: order.user, // populated user
        createdAt: order.createdAt,
        address: order.address || {},
        total: order.total,
        finalAmount: order.finalAmount,
        status: order.status,
        ref: order.ref || "",
        items: order.items
  .filter(item => item.returnRequested)
  .map(item => ({
    _id: item._id,
    name: item.name,
    title: item.title || "N/A",
    price: item.price,
    returnReason: item.returnReason || "N/A",
    returnRequested: item.returnRequested,
    returnStatus: item.returnStatus || "Pending",
    refundMethod: item.refundMethod || "N/A",
    upi: item.refundUPI || "N/A",
    bank: item.refundBank ? {
      accountNumber: item.refundBank.accountNumber || "N/A",
      ifsc: item.refundBank.ifsc || "N/A",
      name: item.refundBank.name || "N/A"
    } : { accountNumber: "N/A", ifsc: "N/A", name: "N/A" },
    image: item.image
  }))

      };
    });

    res.json(normalized);
  } catch (err) {
    console.error("Error fetching returns:", err);
    res.status(500).json({ message: "Error fetching returns" });
  }
});



// ✅ Admin: Approve or reject a return
router.put("/:orderId/return/:itemId", async (req, res) => {
  const { approved } = req.body;

  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const item = order.items.find(i => String(i._id) === req.params.itemId);
    if (!item) return res.status(404).json({ message: "Item not found in order" });

    item.returnStatus = approved ? "Approved" : "Rejected";

    await order.save();

    res.status(200).json({ message: "Return status updated successfully" });
  } catch (err) {
    console.error("Error updating return status:", err);
    res.status(500).json({ message: "Failed to update return status" });
  }
});

// ✅ Get all orders from last 48 hours
router.get("/last48h", async (req, res) => {
  try {
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago

    const orders = await Order.find({ createdAt: { $gte: since } })
      .populate("user", "name email")  // get user name & email
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("Error fetching last 48h orders:", err);
    res.status(500).json({ message: "Failed to fetch last 48h orders" });
  }
});


// ✅ Get all return requests from last 48 hours
router.get("/last48h/returns", async (req, res) => {
  try {
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago

    // Find orders where at least one item has returnRequested = true and created in last 48h
    const orders = await Order.find({
      createdAt: { $gte: since },
      "items.returnRequested": true
    })
    .populate("user", "name email")
    .sort({ createdAt: -1 });

    // Optionally, filter only the items with returnRequested true
    const result = orders.map(order => ({
      _id: order._id,
      user: order.user,
      createdAt: order.createdAt,
      items: order.items.filter(i => i.returnRequested === true),
      total: order.total,
      finalAmount: order.finalAmount,
      status: order.status
    }));

    res.json(result);
  } catch (err) {
    console.error("Error fetching last 48h returns:", err);
    res.status(500).json({ message: "Failed to fetch last 48h returns" });
  }
});



module.exports = router;
