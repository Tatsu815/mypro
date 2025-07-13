const menuBtn = document.querySelector('.menu-toggle');
const nav = document.querySelector('nav');
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';
const FIXED_PASSWORD = '0815'; // Chuyển sang server-side cho production

// Menu toggle
if (menuBtn && nav) {
  menuBtn.addEventListener('click', () => {
    nav.classList.toggle('open');
  });
}

// Modal cho xem trước ảnh
function ensureModal() {
  if (document.getElementById('img-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'img-modal';
  modal.innerHTML = `
    <div class="img-modal-content">
      <span class="img-modal-close" id="img-modal-close">×</span>
      <img id="img-modal-img" src="" alt="preview">
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('.img-modal-close').onclick = closeModal;
  modal.onclick = function(e) {
    if (e.target === modal) closeModal();
  };
}

function openModal(imgSrc) {
  ensureModal();
  const modal = document.getElementById('img-modal');
  document.getElementById('img-modal-img').src = imgSrc;
  modal.classList.add('active');
}

function closeModal() {
  const modal = document.getElementById('img-modal');
  if (modal) modal.classList.remove('active');
}

// Lấy và hiển thị ảnh từ Cloudinary
async function fetchImages() {
  try {
    const res = await fetch(`${API_BASE}/images`);
    if (!res.ok) {
      throw new Error(`Lỗi HTTP! status: ${res.status}`);
    }
    const images = await res.json();
    console.log('Danh sách ảnh:', images); // Debug log
    const gallery = document.getElementById('gallery');
    if (!gallery) return;
    gallery.innerHTML = images.map(url => {
      // Trích xuất public_id từ URL Cloudinary
      const parts = url.split('/');
      const uploadIndex = parts.indexOf('upload');
      const publicId = parts.slice(uploadIndex + 1).join('/').split('.')[0]; // Lấy public_id, kể cả khi có thư mục
      console.log('URL ảnh:', url, 'Public ID:', publicId); // Debug log
      return `
        <div class="gallery-item" style="display:inline-block; position:relative;">
          <img src="${url}" alt="pic" style="cursor:pointer;" onclick="openModal('${url}')">
          <button onclick="deleteImage('${publicId}')" style="position:absolute; top:5px; right:5px; background:red; color:white; border:none; border-radius:50%; width:24px; height:24px; cursor:pointer;">×</button>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Lỗi khi lấy ảnh:', error.message);
    const gallery = document.getElementById('gallery');
    if (gallery) {
      gallery.innerHTML = '<p>Không thể tải danh sách ảnh. Lỗi: ' + error.message + '</p>';
    }
  }
}

// Xóa ảnh từ Cloudinary
async function deleteImage(publicId) {
  console.log('Thử xóa ảnh với public_id:', publicId); // Debug log
  const pwd = prompt('Nhập mật khẩu để xóa ảnh:');
  if (!pwd || pwd !== FIXED_PASSWORD) {
    alert('Sai mật khẩu. Không thể xóa ảnh!');
    return;
  }
  if (!confirm('Bạn có chắc muốn xóa ảnh này?')) return;
  try {
    const res = await fetch(`${API_BASE}/images/${encodeURIComponent(publicId)}`, {
      method: 'DELETE',
    });
    const responseData = await res.json();
    console.log('Phản hồi từ server:', responseData); // Debug log
    if (!res.ok) {
      throw new Error(`Xóa thất bại: ${responseData.error || res.statusText}`);
    }
    await fetchImages(); // Làm mới gallery
    alert('Xóa ảnh thành công!');
  } catch (error) {
    console.error('Lỗi khi xóa ảnh:', error.message);
    alert('Không thể xóa ảnh. Lỗi: ' + error.message);
  }
}

// Xử lý upload và xem trước ảnh
const uploadForm = document.getElementById('upload-form');
const imageInput = document.getElementById('image-input');
const fileChosen = document.getElementById('file-chosen');
const imgPreview = document.getElementById('img-preview');
const uploadPassword = document.getElementById('upload-password');
const passwordError = document.getElementById('password-error');

if (imageInput && fileChosen && imgPreview) {
  imageInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
      const file = this.files[0];
      const reader = new FileReader();
      reader.onload = function(e) {
        imgPreview.src = e.target.result;
        imgPreview.style.display = 'inline-block';
        fileChosen.style.display = 'none';
      };
      reader.readAsDataURL(file);
    } else {
      imgPreview.style.display = 'none';
      fileChosen.style.display = 'inline';
      fileChosen.textContent = 'Xem trước ảnh';
    }
  });
}

if (uploadForm) {
  uploadForm.onsubmit = async function(e) {
    e.preventDefault();
    if (!uploadPassword.value || uploadPassword.value !== FIXED_PASSWORD) {
      if (passwordError) passwordError.style.display = 'inline';
      uploadPassword.value = '';
      uploadPassword.focus();
      return;
    } else {
      if (passwordError) passwordError.style.display = 'none';
    }
    if (!imageInput.files[0]) return;
    const file = imageInput.files[0];
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        throw new Error('Upload thất bại');
      }
      console.log('Upload ảnh thành công'); // Debug log
      await fetchImages();
      imageInput.value = '';
      uploadPassword.value = '';
      imgPreview.style.display = 'none';
      fileChosen.style.display = 'inline';
      fileChosen.textContent = 'Xem trước ảnh';
    } catch (error) {
      console.error('Lỗi khi upload ảnh:', error.message);
      alert('Không thể tải ảnh lên. Lỗi: ' + error.message);
    }
  };
  ensureModal();
  fetchImages();
} else {
  ensureModal();
}

window.openModal = openModal;
window.closeModal = closeModal;