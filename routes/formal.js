const express = require('express');
const router = express.Router();
const Formal = require('../models/Formal');

// GET all Formal products
router.get('/', async (req, res) => {
  try {
    const formal = await Formal.find()
      .sort({ createdAt: -1 })
      .populate('productId');

  // Filter out missing product references
    const validProducts = formal
      .filter(item => item.productId)  // remove nulls
      .map(item => item.productId);    // return populated product

    res.json(validProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Add product to Formal
router.post('/', async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product ID is required' });

    const exists = await Formal.findOne({ productId });
    if (exists) return res.status(400).json({ error: 'Product already in Formal' });

    const newFormal = new Formal({ productId });
    await newFormal.save();

    res.json({ message: 'Product added to Formal' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Remove product from Formal
router.delete('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const deleted = await Formal.findOneAndDelete({ productId });
    if (!deleted) return res.status(404).json({ error: 'Product not found in Formal list' });

    res.json({ message: 'Product removed from Formal' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
