const express = require("express");
const router = express.Router();
const Affiliate = require("../models/Affiliate");
const authMiddleware = require("../middleware/authMiddleware");
const WithdrawRequest = require("../models/WithdrawRequest"); 
const ClickLog = require("../models/ClickLog");
const Order = require("../models/Order");


const { getLevelByOrders, getCommissionByLevel } = require("../utils/affiliateUtils");

// CREATE AFFILIATE ACCOUNT
router.post("/activate", authMiddleware, async (req, res) => {
  try {
    let affiliate = await Affiliate.findOne({ userId: req.userId });

    if (affiliate) {
      return res.json({ message: "Affiliate already active", affiliateId: affiliate.affiliateId });
    }

    const newAffiliateId = "AFF" + Math.floor(100000 + Math.random() * 900000);

    affiliate = await Affiliate.create({
      userId: req.userId,
      affiliateId: newAffiliateId
    });

    res.json({ message: "Affiliate activated", affiliateId: newAffiliateId });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/payment-method", authMiddleware, async (req, res) => {
  try {
    const { method, upi, bank } = req.body;

    await Affiliate.findOneAndUpdate(
      { userId: req.userId },
      { paymentMethod: method, upi, bank },
      { new: true }
    );

    res.json({ message: "Payment method saved" });
  } catch (err) {
    res.status(500).json({ message: "Error saving method" });
  }
});


// GET affiliate details
// GET affiliate details
router.get("/me", authMiddleware, async (req, res) => {
  let affiliate = await Affiliate.findOne({ userId: req.userId });

  // User is NOT an affiliate yet
  if (!affiliate) {
    return res.json({
      active: false,
      message: "Affiliate account not activated"
    });
  }

  // ⭐ Calculate total withdrawn (approved only)
  const totalWithdrawn = await WithdrawRequest.aggregate([
    { $match: { userId: affiliate.userId, status: "Approved" } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  const withdrawnAmount = totalWithdrawn.length > 0 ? totalWithdrawn[0].total : 0;

  res.json({
    active: true,
    ...affiliate.toObject(),
    totalWithdrawn: withdrawnAmount
  });
});


// WITHDRAW ROUTE
router.post("/withdraw", authMiddleware, async (req, res) => {
  try {
    const affiliate = await Affiliate.findOne({ userId: req.userId });

    // check if affiliate account exists
    if (!affiliate)
      return res.json({ message: "Activate affiliate account first" });

    // check payment method saved
    if (!affiliate.paymentMethod)
      return res.json({ message: "Please save payment method first" });

    // check commission amount
    if (affiliate.commissionEarned < 100)
      return res.json({ message: "Minimum ₹100 required to withdraw" });

    // create withdraw request
    await WithdrawRequest.create({
      affiliateId: affiliate.affiliateId,
      userId: req.userId,
      amount: affiliate.commissionEarned,
      method: affiliate.paymentMethod,
      upi: affiliate.upi,
      bank: affiliate.bank
    });

    // reset commission
    affiliate.commissionEarned = 0;
    await affiliate.save();

    res.json({ message: "Withdrawal request sent successfully!" });

  } catch (err) {
    console.error("Withdraw Error:", err); // show full error in console
    res.status(500).json({ message: "Withdraw error: " + err.message });
  }
});



// GET WITHDRAW HISTORY
router.get("/withdraw-history", authMiddleware, async (req, res) => {
  try {
    const history = await WithdrawRequest.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.json(history);
  } catch (err) {
    res.status(500).json({ message: "Failed to load history" });
  }
});

// POST /api/affiliate/click
// body: { ref: "AFF12345" }
// This endpoint records unique clicks and increments affiliate.clicks once per ip+device per 24 hours.
router.post("/click", async (req, res) => {
  try {
    const { ref, productId, city } = req.body;

    if (!ref) return res.status(400).json({ message: "Missing ref" });

    // Get IP
    const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "")
      .split(",")[0]
      .trim();

    // Device
    const agent = req.headers["user-agent"] || "";
    const device = agent.includes("Mobile") ? "Mobile" : "Desktop";

    // Check if same user clicked in last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const exists = await ClickLog.findOne({
      ref,
      ip,
      device,
      productId,
      createdAt: { $gte: since }
    });

    if (!exists) {
      await ClickLog.create({
        ref,
        ip,
        device,
        productId: productId || null,
        city: city || "Unknown"
      });

      await Affiliate.findOneAndUpdate(
        { affiliateId: ref },
        { $inc: { clicks: 1 } },
        { new: true }
      );

      return res.json({ message: "Click logged" });
    }

    return res.json({ message: "Click already recorded recently" });

  } catch (err) {
    console.error("Click tracking error:", err);
    return res.status(500).json({ message: "Click tracking failed", error: err.message });
  }
});


// ================================
// DAILY EARNING GRAPH (AFTER FIX)
// ================================
router.get("/earnings", authMiddleware, async (req, res) => {
  const affiliate = await Affiliate.findOne({ userId: req.userId });

  const orders = await Order.find({ ref: affiliate.affiliateId })
    .sort({ createdAt: 1 });

  const earningsByDay = {};

  orders.forEach(order => {
    const day = order.createdAt.toISOString().split("T")[0];

    if (!earningsByDay[day]) earningsByDay[day] = 0;

    order.items.forEach(item => {
      if (item.earningStatus === "Approved") {
        earningsByDay[day] += item.productEarning;  // REAL EARNING
      }
    });
  });

  res.json({
    days: Object.keys(earningsByDay),
    amounts: Object.values(earningsByDay)
  });
});


router.get("/analytics", authMiddleware, async (req, res) => {
  try {
    const affiliate = await Affiliate.findOne({ userId: req.userId });

    if (!affiliate) {
      return res.status(404).json({
        message: "Affiliate account not found. Please create affiliate account first."
      });
    }

    const refId = affiliate.affiliateId;

    const clicks = await ClickLog.countDocuments({ ref: refId });

    const uniqueIPs = await ClickLog.distinct("ip", { ref: refId });
    const repeatClicks = clicks - uniqueIPs.length;

    const orders = await Order.countDocuments({ ref: refId });
    const conversionRate = clicks === 0 ? 0 : ((orders / clicks) * 100).toFixed(2);

    const deviceStats = {
      mobile: await ClickLog.countDocuments({ ref: refId, device: /Mobile|Android|iPhone/i }),
      desktop: await ClickLog.countDocuments({ ref: refId, device: /Windows|Macintosh|Linux/i })
    };

    const cityStats = {};
    const clickLogs = await ClickLog.find({ ref: refId });

    clickLogs.forEach(c => {
      const city = c.city || "Unknown";
      cityStats[city] = (cityStats[city] || 0) + 1;
    });

    const productStats = await Order.aggregate([
      { $match: { ref: refId } },
      { $unwind: "$items" },
      { $group: { _id: "$items.productId", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      clicks,
      uniqueIPs: uniqueIPs.length,
      repeatClicks,
      conversionRate,
      deviceStats,
      cityStats,
      productStats,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Analytics error", error: err.message });
  }
});
router.get("/orders", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;   // ⭐ from authMiddleware, not req.user._id

    // Find affiliate
    const affiliate = await Affiliate.findOne({ userId });
    if (!affiliate) return res.json([]);

    // Find all orders created using ref = affiliateId
    const orders = await Order.find({ ref: affiliate.affiliateId })
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    console.log("Affiliate orders error:", err);
    res.status(500).json({ message: "Error loading orders" });
  }
});



module.exports = router;