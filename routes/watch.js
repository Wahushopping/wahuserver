const express = require('express');
const router = express.Router();
const Watch = require('../models/Watch');

// Get all watch products
router.get('/', async (req, res) => {
  try {
    const watch = await Watch.find()
      .populate('productId')
      .sort({ createdAt: -1 });

    const validProducts = watch
      .filter(item => item.productId)  // remove nulls
      .map(item => item.productId);    // return populated product

    res.json(validProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add product to watch
router.post('/', async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product ID required' });

    const exists = await Watch.findOne({ productId });
    if (exists) return res.status(400).json({ error: 'Product already in Watch category' });

    const newWatch = new Watch({ productId });
    await newWatch.save();

    res.json({ message: 'Product added to Watch category' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product from watch
router.delete('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const deleted = await Watch.findOneAndDelete({ productId });
    if (!deleted) return res.status(404).json({ error: 'Product not found in Watch category' });

    res.json({ message: 'Removed from Watch category' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
