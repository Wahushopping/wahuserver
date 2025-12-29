const express = require('express');
const multer = require('multer');
const cloudinary = require('../cloudinary');
const router = express.Router();

const upload = multer({ dest: 'uploads/' }); // temporary storage

router.post('/', upload.single('image'), (req, res) => {
  cloudinary.uploader.upload(req.file.path, { folder: "my_folder" })
    .then(result => {
      res.json({ imageUrl: result.secure_url });
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

module.exports = router;
