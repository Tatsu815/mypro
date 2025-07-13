const express = require('express');
const multer = require('multer');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Khởi tạo Express app
const app = express();

// Lấy PORT từ biến môi trường hoặc mặc định là 3000
const PORT = process.env.PORT || 3000;

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cấu hình CORS
app.use(cors());

// Cấu hình multer để lưu tạm vào bộ nhớ
const upload = multer({ storage: multer.memoryStorage() });

// Phục vụ file tĩnh từ thư mục gốc
app.use(express.static('.'));

// API lấy danh sách ảnh từ Cloudinary
app.get('/api/images', async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      resource_type: 'image',
      max_results: 100,
    });
    const images = result.resources.map(resource => resource.secure_url);
    res.json(images);
  } catch (error) {
    console.error('Lỗi khi lấy ảnh từ Cloudinary:', error.message);
    res.status(500).json({ error: 'Không thể lấy danh sách ảnh' });
  }
});

// API upload ảnh lên Cloudinary
app.post('/api/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Không có file được tải lên' });
  }
  try {
    const result = await cloudinary.uploader.upload_stream({
      resource_type: 'image',
    }, (error, result) => {
      if (error) {
        console.error('Lỗi khi upload lên Cloudinary:', error.message);
        return res.status(500).json({ error: 'Upload thất bại' });
      }
      res.json({ url: result.secure_url });
    }).end(req.file.buffer);
  } catch (error) {
    console.error('Lỗi khi upload lên Cloudinary:', error.message);
    res.status(500).json({ error: 'Upload thất bại' });
  }
});

// API xóa ảnh từ Cloudinary
app.delete('/api/images/:public_id', async (req, res) => {
  const public_id = req.params.public_id;
  try {
    const result = await cloudinary.uploader.destroy(public_id, { resource_type: 'image' });
    if (result.result === 'ok') {
      res.json({ success: true });
    } else {
      throw new Error('Cloudinary xóa thất bại');
    }
  } catch (error) {
    console.error('Lỗi khi xóa ảnh từ Cloudinary:', error.message);
    res.status(404).json({ error: 'Ảnh không tồn tại hoặc xóa thất bại' });
  }
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});