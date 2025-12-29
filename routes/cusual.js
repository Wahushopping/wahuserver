const express = require('express');
const router = express.Router();
const Cusual = require('../models/Cusual');

// Get all casual products
router.get('/', async (req, res) => {
  try {
    const cusual = await Cusual.find()
      .populate('productId')
      .sort({ createdAt: -1 });

    // Filter out missing product references
    const validProducts = cusual
      .filter(item => item.productId)  // remove nulls
      .map(item => item.productId);    // return populated product

    res.json(validProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add product to casual
router.post('/', async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product ID required' });

    const exists = await Cusual.findOne({ productId });
    if (exists) return res.status(400).json({ error: 'Product already in Casual category' });

    const newCusual = new Cusual({ productId });
    await newCusual.save();

    res.json({ message: 'Product added to Casual category' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product from casual
router.delete('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const deleted = await Cusual.findOneAndDelete({ productId });
    if (!deleted) return res.status(404).json({ error: 'Product not found in Casual category' });

    res.json({ message: 'Removed from Casual category' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
