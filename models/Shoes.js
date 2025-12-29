const mongoose = require('mongoose');

const shoesSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Shoes', shoesSchema);
