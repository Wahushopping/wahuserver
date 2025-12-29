const mongoose = require("mongoose");

const clickSchema = new mongoose.Schema({
  ref: { type: String, required: true },       // affiliateId
  ip: { type: String },
  device: { type: String },
  city: { type: String, default: "Unknown" },  // for analytics
  productId: { type: String, default: null },  // track which product clicked
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  createdAt: { type: Date, default: Date.now },

  // Auto delete logs after 30 days
  expireAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
  }
});

// indexes
clickSchema.index({ ref: 1 });
clickSchema.index({ productId: 1 });
clickSchema.index({ city: 1 });
clickSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("ClickLog", clickSchema);
