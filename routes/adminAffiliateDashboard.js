const express = require("express");
const router = express.Router();

const Affiliate = require("../models/Affiliate");
const Order = require("../models/Order");
const ClickLog = require("../models/ClickLog");

// ===============================
// 1️⃣ TOTAL AFFILIATES + LEVEL COUNTS
// ===============================
router.get("/summary", async (req, res) => {
  const totalAffiliates = await Affiliate.countDocuments();

  const bronze = await Affiliate.countDocuments({ level: "Bronze" });
  const silver = await Affiliate.countDocuments({ level: "Silver" });
  const gold   = await Affiliate.countDocuments({ level: "Gold" });
  const platinum = await Affiliate.countDocuments({ level: "Platinum" });

  const topAllTime = await Affiliate.findOne().sort({ commissionEarned: -1 });

  res.json({
    totalAffiliates,
    levels: { bronze, silver, gold, platinum },
    topAllTime
  });
});

// ===============================
// 2️⃣ TOP EARNING AFFILIATES
// ===============================
router.get("/top-earnings", async (req, res) => {
  try {
    const now = new Date();

    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last7d  = new Date(now - 7  * 24 * 60 * 60 * 1000);
    const last30d = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // Helper function to calculate earnings within a date range
    const getTopInRange = async (fromDate) => {
      const result = await Affiliate.aggregate([
        {
          $lookup: {
            from: "withdrawrequests",
            localField: "userId",
            foreignField: "userId",
            as: "withdraws"
          }
        },
        {
          $lookup: {
            from: "orders",
            localField: "affiliateId",
            foreignField: "ref",
            as: "orders"
          }
        },
        {
          $addFields: {
            earningsFromOrders: {
              $sum: {
                $map: {
                  input: "$orders",
                  as: "o",
                  in: {
                    $cond: [
                      { $gte: ["$$o.createdAt", fromDate] },
                      { $cond: [
                          { $eq: ["$level", "Platinum"] }, 150,
                          { $cond: [
                              { $eq: ["$level", "Gold"] }, 100,
                              { $cond: [
                                  { $eq: ["$level", "Silver"] }, 75,
                                  50
                                ]}
                            ]}
                        ]},
                      0
                    ]
                  }
                }
              }
            },

            earningsFromWithdraw: {
              $sum: {
                $map: {
                  input: "$withdraws",
                  as: "w",
                  in: {
                    $cond: [
                      { $gte: ["$$w.createdAt", fromDate] },
                      "$$w.amount",
                      0
                    ]
                  }
                }
              }
            },

            totalRangeEarnings: {
              $add: ["$earningsFromOrders", "$earningsFromWithdraw"]
            }
          }
        },
        { $sort: { totalRangeEarnings: -1 } },
        { $limit: 1 }
      ]);

      return result.length ? result[0] : null;
    };

    const top24h  = await getTopInRange(last24h);
    const top7d   = await getTopInRange(last7d);
    const top30d  = await getTopInRange(last30d);

    res.json({ top24h, top7d, top30d });

  } catch (error) {
    console.error("Top earnings error:", error);
    res.status(500).json({ message: "Top earnings error", error: error.message });
  }
});

// ===============================
// 3️⃣ BEST SELLING AFFILIATE PRODUCTS
// ===============================
router.get("/best-products", async (req, res) => {
  const best = await Order.aggregate([
    { $match: { ref: { $exists: true, $ne: null } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.id",
        name: { $first: "$items.name" },
        image: { $first: "$items.image" },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  res.json(best);
});

// ===============================
// 4️⃣ NORMAL vs AFFILIATE ORDERS GRAPH
// ===============================
router.get("/orders-graph", async (req, res) => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const orders = await Order.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $project: {
        day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }},
        isAffiliate: { $cond: [{ $ifNull: ["$ref", false] }, 1, 0] }
      }
    },
    {
      $group: {
        _id: "$day",
        affiliateOrders: { $sum: "$isAffiliate" },
        normalOrders: { $sum: { $subtract: [1, "$isAffiliate"] } }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.json(orders);
});

module.exports = router;
