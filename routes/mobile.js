const express = require('express');
const router = express.Router();
const Mobile = require('../models/Mobile');

// Get all mobile products
router.get('/', async (req, res) => {
  try {
    const mobiles = await Mobile.find()
      .populate('productId')
      .sort({ createdAt: -1 });

    const validProducts = mobiles
      .filter(item => item.productId)  // remove nulls
      .map(item => item.productId);    // return populated product

    res.json(validProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add product to mobile
router.post('/', async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product ID required' });

    const exists = await Mobile.findOne({ productId });
    if (exists) return res.status(400).json({ error: 'Product already in Mobile category' });

    const newMobile = new Mobile({ productId });
    await newMobile.save();

    res.json({ message: 'Product added to Mobile category' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product from mobile
router.delete('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const deleted = await Mobile.findOneAndDelete({ productId });
    if (!deleted) return res.status(404).json({ error: 'Product not found in Mobile category' });

    res.json({ message: 'Removed from Mobile category' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
