const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const adminMiddleware = require("../middleware/adminMiddleware");


// GET /api/admin/analytics
// GET /api/admin/analytics
router.get('/analytics', adminMiddleware, async (req, res) => {

  try {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24*60*60*1000);
    const weekAgo = new Date(now.getTime() - 7*24*60*60*1000);
    const monthAgo = new Date(now.getTime() - 30*24*60*60*1000);

    // Orders by time
    const orders24h = await Order.find({ createdAt: { $gte: dayAgo } });
    const ordersWeek = await Order.find({ createdAt: { $gte: weekAgo } });
    const ordersMonth = await Order.find({ createdAt: { $gte: monthAgo } });
    const allOrders = await Order.find();

    // Revenue calculation
    const sumRevenue = orders => orders.reduce((acc, o) => acc + (o.finalAmount || o.total), 0);

    // Returns
    const returns = await Order.aggregate([
      { $unwind: "$items" },
      { $match: { "items.returnRequested": true } },
      { $count: "totalReturns" }
    ]);

    // Top 10 selling products
    const topProductsAgg = await Order.aggregate([
      { $unwind: "$items" },
      { $group: { _id: "$items.id", name: { $first: "$items.name" }, quantity: { $sum: "$items.qty" } } },
      { $sort: { quantity: -1 } },
      { $limit: 10 }
    ]);

    // Top 10 returned products
    const topReturnedAgg = await Order.aggregate([
      { $unwind: "$items" },
      { $match: { "items.returnRequested": true } },
      { $group: { _id: "$items.id", name: { $first: "$items.name" }, quantity: { $sum: "$items.qty" } } },
      { $sort: { quantity: -1 } },
      { $limit: 10 }
    ]);

    // Users
    const totalUsers = await User.countDocuments();
    const loggedInUsers = await User.countDocuments({ lastLogin: { $gte: dayAgo } }); // assuming you track lastLogin

    res.json({
      last24h: { orders: orders24h.length, revenue: sumRevenue(orders24h) },
      lastWeek: { orders: ordersWeek.length, revenue: sumRevenue(ordersWeek) },
      lastMonth: { orders: ordersMonth.length, revenue: sumRevenue(ordersMonth) },
      totalOrders: allOrders.length,
      totalRevenue: sumRevenue(allOrders),
      returns: returns[0] ? returns[0].totalReturns : 0,
      topProducts: topProductsAgg,
      topReturnedProducts: topReturnedAgg,
      totalUsers,
      loggedInUsers
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/check", adminMiddleware, (req, res) => {
  res.json({ success: true });
});

module.exports = router;