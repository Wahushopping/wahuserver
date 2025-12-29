const express = require("express");
const router = express.Router();
const Affiliate = require("../models/Affiliate");
const Order = require("../models/Order");
const WithdrawRequest = require("../models/WithdrawRequest");
const { getCommissionByLevel } = require("../utils/affiliateUtils");


// ===============================
// GET ALL AFFILIATES
// ===============================
router.get("/affiliates", async (req, res) => {
  try {
    const affiliates = await Affiliate.find()
      .populate("userId", "name email phone");

    res.json(affiliates);

  } catch (err) {
    res.status(500).json({ message: "Error loading affiliates" });
  }
});


// ===============================
// GET ORDERS FOR A REF
// ===============================
// ===============================
// GET ORDERS FOR A REF
// ===============================
router.get("/orders", async (req, res) => {
  try {
    const ref = req.query.ref;
    if (!ref) return res.json([]);

    console.log("Affiliate Order Fetch:", ref);

    const orders = await Order.find({ ref })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    console.error("Affiliate order fetch error:", err);
    res.status(500).json({ message: "Error loading orders" });
  }
});



// ===============================
// GET WITHDRAW REQUESTS
// ===============================
router.get("/withdrawals", async (req, res) => {
  try {
    const list = await WithdrawRequest.find()
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });

    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Error fetching withdrawal requests" });
  }
});


// ===============================
// APPROVE / REJECT WITHDRAWAL
// ===============================
router.put("/withdrawals/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const request = await WithdrawRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: "Error updating withdrawal request" });
  }
});


// ===============================
// GET AFFILIATE ORDERS (LAST 48 HOURS)
// ===============================
router.get("/orders-last48", async (req, res) => {
  try {
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const orders = await Order.find({
      ref: { $exists: true, $ne: null },
      createdAt: { $gte: since }
    })
    .populate("user", "name email")
    .sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    console.error("48h affiliate orders error:", err);
    res.status(500).json({ message: "Failed to fetch last 48h affiliate orders" });
  }
});


// ===============================
// GET FULL AFFILIATE DATA (with total earning)
// ===============================
router.get("/affiliates-full", async (req, res) => {
  try {
    const affiliates = await Affiliate.find()
      .populate("userId", "name email phone");

    // Calculate withdrawn amount for every user
    const withdraws = await WithdrawRequest.aggregate([
      { $group: { _id: "$userId", total: { $sum: "$amount" } } }
    ]);

    // Map: userId -> withdraw total
    const withdrawMap = {};
    withdraws.forEach(w => {
      withdrawMap[String(w._id)] = w.total;
    });

    // Build final list
    const finalList = affiliates.map(a => {
      const uid = String(a.userId?._id);
      const withdrawn = withdrawMap[uid] || 0;

      return {
        ...a.toObject(),
        totalWithdrawn: withdrawn,
        totalEarning: (a.commissionEarned || 0) + withdrawn
      };
    });

    res.json(finalList);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error loading affiliates" });
  }
});

// ===============================================
// ADMIN: Approve or Reject Commission for an Order
// ===============================================
router.put("/commission/:orderId", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Approved", "Rejected", "Pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await Order.findByIdAndUpdate(
      req.params.orderId,
      { commissionStatus: status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(updated);

  } catch (err) {
    console.error("Commission update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/approve-earning", async (req, res) => {
  const { orderId, itemIndex } = req.body;

  const order = await Order.findById(orderId);
  const affiliate = await Affiliate.findOne({ affiliateId: order.ref });

  if (!order || !affiliate) {
    return res.status(404).json({ message: "Order or affiliate not found" });
  }

  const item = order.items[itemIndex];

  if (item.earningStatus === "Approved") {
    return res.json({ message: "Already approved" });
  }

  // ⛔ HERE
  const rate = getCommissionByLevel(item.affiliateLevelAtTime);

  const commission = rate * item.qty;

  item.productEarning = commission || 0;
item.earningStatus = "Approved";


  affiliate.commissionEarned += commission;

  await order.save();
  await affiliate.save();

  res.json({ message: "Earning Approved", amount: commission });
});



router.post("/reject-earning", async (req, res) => {
  const { orderId, itemIndex } = req.body;

  const order = await Order.findById(orderId);
  const item = order.items[itemIndex];

  if (item.earningStatus === "Rejected")
    return res.json({ message: "Already rejected" });

  item.earningStatus = "Rejected";
item.productEarning = item.productEarning || 0; 


  await order.save();
  res.json({ message: "Earning Rejected" });
});


module.exports = router;
