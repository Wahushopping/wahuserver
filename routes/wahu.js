const express = require('express');
const router = express.Router();
const Wahu = require('../models/Wahu');

// Get all Wahu products
router.get('/', async (req, res) => {
  try {
    const wahuItems = await Wahu.find()
      .populate('productId')
      .sort({ createdAt: -1 });

    // Filter out missing product references
    const validProducts = wahuItems
      .filter(item => item.productId)  // remove nulls
      .map(item => item.productId);    // return populated product

    res.json(validProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add product to Wahu
router.post('/', async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product ID required' });

    const exists = await Wahu.findOne({ productId });
    if (exists) return res.status(400).json({ error: 'Product already in Wahu category' });

    const newWahu = new Wahu({ productId });
    await newWahu.save();

    res.json({ message: 'Product added to Wahu category' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product from Wahu
router.delete('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const deleted = await Wahu.findOneAndDelete({ productId });
    if (!deleted) return res.status(404).json({ error: 'Product not found in Wahu category' });

    res.json({ message: 'Removed from Wahu category' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
