const express = require('express');
const router = express.Router();
const Bags = require('../models/Bags'); // Use plural model name

// Get all bags products
router.get('/', async (req, res) => {
  try {
    const bags = await Bags.find()
      .populate('productId')
      .sort({ createdAt: -1 });

    // Filter out missing product references
    const validProducts = bags
      .filter(item => item.productId)  // remove nulls
      .map(item => item.productId);    // return populated product

    res.json(validProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add product to bags
router.post('/', async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product ID required' });

    const exists = await Bags.findOne({ productId });
    if (exists) return res.status(400).json({ error: 'Product already in Bags category' });

    const newBags = new Bags({ productId });
    await newBags.save();

    res.json({ message: 'Product added to Bags category' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product from bags
router.delete('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const deleted = await Bags.findOneAndDelete({ productId });
    if (!deleted) return res.status(404).json({ error: 'Product not found in Bags category' });

    res.json({ message: 'Removed from Bags category' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
