const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },

    items: [
      {
        _id: false,
        id: { type: String, required: true },
        title: { type: String },
        name: { type: String, required: true },
        image: { type: String, required: true },
        size: { type: String, required: true },
        price: { type: Number, required: true },
        qty: { type: Number, required: true, min: 1 },

        // ⭐ ADD THIS LINE TO STORE AFFILIATE REF 
        ref: { type: String, default: null }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
