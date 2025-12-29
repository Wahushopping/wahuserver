const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  title: String,
  price: Number,
  originalprice: { type: Number, required: true, default: 0 },
  image: {
    url: String,
    public_id: String
  },
  moreImages: [{
    url: String,
    public_id: String
  }],
  video: {
    url: String,
    public_id: String
  },
  description: String,
  sizes: [String],
  option: String
}, { timestamps: true });

// ✅ Fix OverwriteModelError
module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
