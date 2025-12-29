const express = require('express');
const router = express.Router();
const Shoes = require('../models/Shoes');

// Get all shoes products
router.get('/', async (req, res) => {
  try {
    const shoes = await Shoes.find()
      .populate('productId')
      .sort({ createdAt: -1 });

    // Filter out missing product references
    const validProducts = shoes
      .filter(item => item.productId)  // remove nulls
      .map(item => item.productId);    // return populated product

    res.json(validProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Add product to shoes
router.post('/', async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product ID required' });

    const exists = await Shoes.findOne({ productId });
    if (exists) return res.status(400).json({ error: 'Product already in Shoes category' });

    const newShoes = new Shoes({ productId });
    await newShoes.save();

    res.json({ message: 'Product added to Shoes category' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product from shoes
router.delete('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const deleted = await Shoes.findOneAndDelete({ productId });
    if (!deleted) return res.status(404).json({ error: 'Product not found in Shoes category' });

    res.json({ message: 'Removed from Shoes category' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
