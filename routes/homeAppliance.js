const express = require('express');
const router = express.Router();
const HomeAppliance = require('../models/HomeAppliance'); // Model for this category
const Product = require('../models/Product'); // Reference product model

// ✅ GET: All Home Appliance products
router.get('/', async (req, res) => {
  try {
    const homeAppliance = await HomeAppliance.find()
      .populate('productId')
      .sort({ createdAt: -1 });

   const validProducts = homeAppliance
      .filter(item => item.productId)  // remove nulls
      .map(item => item.productId);    // return populated product

    res.json(validProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ POST: Add a product to Home Appliance
router.post('/', async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required.' });
  }

  try {
    // Check if product exists
    const existing = await Product.findById(productId);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Check if already added
    const already = await HomeAppliance.findOne({ productId });
    if (already) {
      return res.status(400).json({ error: 'Product already exists in Home Appliance.' });
    }

    const newItem = new HomeAppliance({ productId });
    await newItem.save();

    res.status(201).json({ message: 'Product added to Home Appliance.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ DELETE: Remove product from Home Appliance
router.delete('/:id', async (req, res) => {
  try {
    await HomeAppliance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product removed from Home Appliance.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
