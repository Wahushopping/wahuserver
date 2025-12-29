const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ref: { type: String }, // affiliate ID

  items: [
    {
      id: String,
      name: String,
      price: Number,
      qty: Number,
      size: String,
      image: String,
      title: String,

      // 🔥 Save affiliate level at the moment of order
      affiliateLevelAtTime: { type: String, default: null },

      // 🔥 Return-related fields
      returnRequested: { type: Boolean, default: false },
      returnReason: { type: String, default: "" },
      returnDate: { type: Date },
      returnStatus: {
        type: String,
        enum: ["Pending", "Approved", "Rejected"],
        default: "Pending",
      },

      // 🔥 Refund details
      refundMethod: {
        type: String,
        enum: ["UPI", "Bank"],
      },
      refundUPI: { type: String },
      refundBank: {
        accountNumber: String,
        ifsc: String,
        name: String,
      },

      // 🔥 Affiliate earning per product
      productEarning: { type: Number, default: 0 },

      // 🔥 Admin approval status for this product earning
      earningStatus: {
        type: String,
        enum: ["Pending", "Approved", "Rejected"],
        default: "Pending",
      },
    },
  ],

  address: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    fullAddress: { type: String, required: true },
    pincode: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
  },

  total: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  finalAmount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  status: { type: String, default: "Pending" },

  createdAt: { type: Date, default: Date.now },
  deliveryDate: { type: Date },

  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },

  // 🔥 Commission fields
  commission: { type: Number, default: 0 },
  commissionStatus: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
});

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
