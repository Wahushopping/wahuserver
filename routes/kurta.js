const express = require('express');
const router = express.Router();
const Kurta = require('../models/Kurta');

// ✅ Get all Kurta products (latest first)
router.get('/', async (req, res) => {
  try {
    const kurta = await Kurta.find()
      .sort({ createdAt: -1 }) // Sort by newest first
      .populate('productId');

   const validProducts = kurta
      .filter(item => item.productId)  // remove nulls
      .map(item => item.productId);    // return populated product

    res.json(validProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Add product to Kurta
router.post('/', async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product ID required' });

    const exists = await Kurta.findOne({ productId });
    if (exists) return res.status(400).json({ error: 'Product already exists in Kurta list' });

    const newKurta = new Kurta({ productId });
    await newKurta.save();

    res.json({ message: 'Product added to Kurta' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete product from Kurta
router.delete('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const deleted = await Kurta.findOneAndDelete({ productId });
    if (!deleted) return res.status(404).json({ error: 'Product not found in Kurta list' });

    res.json({ message: 'Product removed from Kurta' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
