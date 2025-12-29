const express = require('express');
const router = express.Router();
const Dress = require('../models/Dress');

// ✅ Get all dress products
router.get('/', async (req, res) => {
  try {
    const dress = await Dress.find()
      .sort({ createdAt: -1 }) // Sort newest first
      .populate('productId');

    // Filter out missing product references
    const validProducts = dress
      .filter(item => item.productId)  // remove nulls
      .map(item => item.productId);    // return populated product

    res.json(validProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Add product to dress
router.post('/', async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product ID required' });

    const exists = await Dress.findOne({ productId });
    if (exists) return res.status(400).json({ error: 'Product already in Dress list' });

    const newDress = new Dress({ productId });
    await newDress.save();

    res.json({ message: 'Added to Dress' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete product from Dress
router.delete('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const deleted = await Dress.findOneAndDelete({ productId });
    if (!deleted) return res.status(404).json({ error: 'Product not found in Dress list' });

    res.json({ message: 'Removed from Dress' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
