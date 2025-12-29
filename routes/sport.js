const express = require('express');
const router = express.Router();
const Sport = require('../models/Sport');

// Get all sport products
router.get('/', async (req, res) => {
  try {
    const sport = await Sport.find()
      .populate('productId')
      .sort({ createdAt: -1 });

    const validProducts = sport
      .filter(item => item.productId)  // remove nulls
      .map(item => item.productId);    // return populated product

    res.json(validProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add product to sport
router.post('/', async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product ID required' });

    const exists = await Sport.findOne({ productId });
    if (exists) return res.status(400).json({ error: 'Product already in Sport category' });

    const newSport = new Sport({ productId });
    await newSport.save();

    res.json({ message: 'Product added to Sport category' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product from sport
router.delete('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const deleted = await Sport.findOneAndDelete({ productId });
    if (!deleted) return res.status(404).json({ error: 'Product not found in Sport category' });

    res.json({ message: 'Removed from Sport category' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
