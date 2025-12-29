const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const upload = require('../middleware/upload');
const mongoose = require('mongoose');
const cloudinary = require('../cloudinary');

// GET all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch {
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// GET single product
router.get('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch {
    res.status(500).json({ message: 'Error fetching product' });
  }
});

// ADD product
router.post('/add', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'moreImages', maxCount: 5 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, price, title, description, option, sizes } = req.body;
    const originalprice = req.body.originalprice || 0;

    let parsedSizes = [];
    try {
      parsedSizes = sizes ? JSON.parse(sizes) : [];
    } catch {
      return res.status(400).json({ message: 'Invalid sizes format' });
    }

    // Upload main image
    let image = {};
    if (req.files['image']) {
      const result = await cloudinary.uploader.upload(req.files['image'][0].path, { folder: "products" });
      image = { url: result.secure_url, public_id: result.public_id };
    }

    // Upload more images
    let moreImages = [];
    if (req.files['moreImages']) {
      for (const file of req.files['moreImages']) {
        const result = await cloudinary.uploader.upload(file.path, { folder: "products" });
        moreImages.push({ url: result.secure_url, public_id: result.public_id });
      }
    }

    // Upload video
    let video = {};
    if (req.files['video']) {
      const result = await cloudinary.uploader.upload(req.files['video'][0].path, { folder: "products", resource_type: "video" });
      video = { url: result.secure_url, public_id: result.public_id };
    }

    const newProduct = new Product({
      name,
      title,
      price,
      originalprice,
      description,
      sizes: parsedSizes,
      option,
      image,
      moreImages,
      video
    });

    await newProduct.save();
    res.status(201).json({ message: 'Product added', product: newProduct });
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({ message: 'Error adding product' });
  }
});

// UPDATE product
router.put('/:id', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'moreImages', maxCount: 5 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const { name, price, title, description, option, sizes } = req.body;
    const originalprice = req.body.originalprice || 0;

    let parsedSizes = [];
    try {
      parsedSizes = sizes ? JSON.parse(sizes) : [];
    } catch {
      return res.status(400).json({ message: 'Invalid sizes format' });
    }

    // Update main image
    let image = product.image;
    if (req.files['image']) {
      if (image?.public_id) await cloudinary.uploader.destroy(image.public_id);
      const uploadImage = await cloudinary.uploader.upload(req.files['image'][0].path, { folder: "products" });
      image = { url: uploadImage.secure_url, public_id: uploadImage.public_id };
    }

    // Replace all moreImages if new ones are uploaded
    let moreImages = product.moreImages || [];
    if (req.files['moreImages']) {
      for (const img of moreImages) {
        if (img.public_id) await cloudinary.uploader.destroy(img.public_id);
      }
      moreImages = [];
      for (const file of req.files['moreImages']) {
        const uploadResult = await cloudinary.uploader.upload(file.path, { folder: "products" });
        moreImages.push({ url: uploadResult.secure_url, public_id: uploadResult.public_id });
      }
    }

    // Update video
    let video = product.video;
    if (req.files['video']) {
      if (video?.public_id) await cloudinary.uploader.destroy(video.public_id, { resource_type: "video" });
      const uploadVideo = await cloudinary.uploader.upload(req.files['video'][0].path, { folder: "products", resource_type: "video" });
      video = { url: uploadVideo.secure_url, public_id: uploadVideo.public_id };
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { name, title, price, description, sizes: parsedSizes, option, originalprice, image, moreImages, video },
      { new: true }
    );

    res.json({ message: 'Product updated', product: updatedProduct });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ message: 'Error updating product' });
  }
});

// DELETE product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.image?.public_id) await cloudinary.uploader.destroy(product.image.public_id);
    if (Array.isArray(product.moreImages)) {
      for (const img of product.moreImages) {
        if (img.public_id) await cloudinary.uploader.destroy(img.public_id);
      }
    }
    if (product.video?.public_id) {
      await cloudinary.uploader.destroy(product.video.public_id, { resource_type: "video" });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product and Cloudinary files deleted' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: 'Error deleting product' });
  }
});
router.post("/click", async (req, res) => {
  const { ref } = req.body;

  if (ref) {
    await Affiliate.findOneAndUpdate(
      { affiliateId: ref },
      { $inc: { clicks: 1 } }
    );
  }

  res.json({ success: true });
});


module.exports = router;
