const mongoose = require('mongoose');

const dressSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product', // Replace with your actual Product model name
      required: true,
      unique: true
    }
  },
  {
    timestamps: true // adds createdAt and updatedAt
  }
);

module.exports = mongoose.model('Dress', dressSchema);
