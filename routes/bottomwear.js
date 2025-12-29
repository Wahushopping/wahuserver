const express = require('express');
const router = express.Router();
const Bottomwear = require('../models/Bottomwear');


// Get all sarees products
router.get('/', async (req, res) => {
  try {
    const bottomwear = await Bottomwear.find().sort({ createdAt: -1 }).populate('productId');
    // Filter out missing product references
    const validProducts = bottomwear
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

    const exists = await Bottomwear.findOne({ productId });
    if (exists) return res.status(400).json({ error: 'Product already in Bottomwear' });

    const newBottomwear = new Bottomwear({ productId });
    await newBottomwear.save();

    res.json({ message: 'Added to Bottomwear' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product from Sarees
router.delete('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const deleted = await Bottomwear.findOneAndDelete({ productId });
    if (!deleted) return res.status(404).json({ error: 'Product not found in Bottomwear list' });

    res.json({ message: 'Removed from Bottomwear' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
