const mongoose = require('mongoose');

const homeApplianceSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('HomeAppliance', homeApplianceSchema);
