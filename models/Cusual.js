const mongoose = require('mongoose');

const cusualSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  }
}, {
  timestamps: true // enables createdAt & updatedAt
});

module.exports = mongoose.model('Cusual', cusualSchema);
