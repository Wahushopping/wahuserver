const mongoose = require('mongoose');

const electronicsSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    unique: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Electronics', electronicsSchema);
