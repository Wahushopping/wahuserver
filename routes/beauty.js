const express = require('express');
const router = express.Router();
const Beauty = require('../models/Beauty');

// Get all beauty products
router.get('/', async (req, res) => {
  try {
    const beauty = await Beauty.find()
      .populate('productId')
      .sort({ createdAt: -1 });

    // Filter out missing product references
    const validProducts = beauty
      .filter(item => item.productId)  // remove nulls
      .map(item => item.productId);    // return populated product

    res.json(validProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add product to beauty
router.post('/', async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product ID required' });

    const exists = await Beauty.findOne({ productId });
    if (exists) return res.status(400).json({ error: 'Product already in Beauty category' });

    const newBeauty = new Beauty({ productId });
    await newBeauty.save();

    res.json({ message: 'Product added to Beauty category' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product from beauty
router.delete('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const deleted = await Beauty.findOneAndDelete({ productId });
    if (!deleted) return res.status(404).json({ error: 'Product not found in Beauty category' });

    res.json({ message: 'Removed from Beauty category' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
