const express = require('express');
const router = express.Router();
const Sarees = require('../models/Sarees');

// Get all sarees products
router.get('/', async (req, res) => {
  try {
    const sarees = await Sarees.find().sort({ createdAt: -1 }).populate('productId');
   const validProducts = sarees
      .filter(item => item.productId)  // remove nulls
      .map(item => item.productId);    // return populated product

    res.json(validProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add product to sarees
router.post('/', async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product ID required' });

    const exists = await Sarees.findOne({ productId });
    if (exists) return res.status(400).json({ error: 'Product already in Sarees' });

    const newSarees = new Sarees({ productId });
    await newSarees.save();

    res.json({ message: 'Added to Sarees' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product from Sarees
router.delete('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const deleted = await Sarees.findOneAndDelete({ productId });
    if (!deleted) return res.status(404).json({ error: 'Product not found in Sarees list' });

    res.json({ message: 'Removed from Sarees' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
