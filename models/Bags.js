const mongoose = require('mongoose');

const bagsSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Bags', bagsSchema);
