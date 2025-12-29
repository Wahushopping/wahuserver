const mongoose = require('mongoose');

const trendingSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  }
}, {
  timestamps: true // ✅ Enables createdAt & updatedAt fields
});

module.exports = mongoose.model('Trending', trendingSchema);
