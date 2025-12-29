const mongoose = require("mongoose");

const affiliateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  affiliateId: { type: String, unique: true, required: true },

  clicks: { type: Number, default: 0 },
  orders: { type: Number, default: 0 },
  commissionEarned: { type: Number, default: 0 },

  // Payment fields
  paymentMethod: { type: String },
  upi: { type: String },
  bank: {
    accNo: String,
    ifsc: String,
    holder: String
  },

  // NEW: Affiliate level & referral earnings
  level: { type: String, enum: ["Bronze", "Silver", "Gold", "Platinum"], default: "Bronze" },
  referralEarnings: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Affiliate", affiliateSchema);
