const express = require('express');
const router = express.Router();
const Topwear = require('../models/Topwear');

// Get all topwear products
router.get('/', async (req, res) => {
  try {
    const topwear = await Topwear.find()
      .sort({ createdAt: -1 }) // Sort by newest
      .populate('productId');

    const validProducts = topwear
      .filter(item => item.productId)  // remove nulls
      .map(item => item.productId);    // return populated product

    res.json(validProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add product to topwear
router.post('/', async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product ID required' });

    const exists = await Topwear.findOne({ productId });
    if (exists) return res.status(400).json({ error: 'Product already in Topwear' });

    const newTopwear = new Topwear({ productId });
    await newTopwear.save();

    res.json({ message: 'Added to Topwear' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product from Topwear
router.delete('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const deleted = await Topwear.findOneAndDelete({ productId });
    if (!deleted) return res.status(404).json({ error: 'Product not found in Topwear list' });

    res.json({ message: 'Removed from Topwear' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
