const express = require('express');
const router = express.Router();
const Kid = require('../models/Kid');

// Get all shoes products
router.get('/', async (req, res) => {
  try {
    const kid = await Kid.find()
      .populate('productId')
      .sort({ createdAt: -1 });

    const validProducts = kid
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

    const exists = await Kid.findOne({ productId });
    if (exists) return res.status(400).json({ error: 'Product already in Kid category' });

    const newKid = new Kid({ productId });
    await newKid.save();

    res.json({ message: 'Product added to Kid category' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product from shoes
router.delete('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const deleted = await Kid.findOneAndDelete({ productId });
    if (!deleted) return res.status(404).json({ error: 'Product not found in Kid category' });

    res.json({ message: 'Removed from Kid category' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
