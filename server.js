const express = require('express');
const multer = require('multer');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Initialize Express app
const app = express();

// Use Render's PORT environment variable or fallback to 3000 for local development
const PORT = process.env.PORT || 3000;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure CORS
app.use(cors());

// Configure multer for file uploads (store temporarily in memory)
const upload = multer({ storage: multer.memoryStorage() });

// Serve static files from the root directory (for HTML, CSS, JS)
app.use(express.static('.'));

// API to list images from Cloudinary
app.get('/api/images', async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      resource_type: 'image',
      max_results: 100, // Adjust as needed
    });
    const images = result.resources.map(resource => resource.secure_url);
    res.json(images);
  } catch (error) {
    console.error('Error fetching images from Cloudinary:', error);
    res.status(500).json({ error: 'Cannot fetch images' });
  }
});

// API to upload images to Cloudinary
app.post('/api/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  try {
    const result = await cloudinary.uploader.upload_stream({
      resource_type: 'image',
    }, (error, result) => {
      if (error) {
        console.error('Error uploading to Cloudinary:', error);
        return res.status(500).json({ error: 'Upload failed' });
      }
      res.json({ url: result.secure_url });
    }).end(req.file.buffer);
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// API to delete images from Cloudinary
app.delete('/api/images/:public_id', async (req, res) => {
  const public_id = req.params.public_id;
  try {
    await cloudinary.uploader.destroy(public_id, { resource_type: 'image' });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    res.status(404).json({ error: 'File not found' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});