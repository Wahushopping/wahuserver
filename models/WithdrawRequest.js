const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema({
  affiliateId: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // For individual product withdraw
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  itemId: String,

  amount: Number,

  // FIX: Rename method → paymentMethod
  paymentMethod: String,

  upi: String,

  bank: {
    accNo: String,
    ifsc: String,
    holder: String
  },

  status: { type: String, default: "Pending" }, // Pending / Approved / Rejected
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("WithdrawRequest", withdrawSchema);
