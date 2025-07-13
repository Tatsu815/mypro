const menuBtn = document.querySelector('.menu-toggle');
const nav = document.querySelector('nav');
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';
const FIXED_PASSWORD = '0815'; // Chuyển sang server-side cho production

// Modal cho xem trước ảnh và nhập mật khẩu xóa
function ensureModal() {
  if (document.getElementById('img-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'img-modal';
  modal.innerHTML = `
    <div class="img-modal-content" style="background:white; padding:20px; border-radius:8px; max-width:90%; width:400px; position:relative;">
      <span class="img-modal-close" id="img-modal-close">×</span>
      <img id="img-modal-img" src="" alt="preview">
      <div id="password-modal" style="display:none; text-align:center;">
        <h3 style="margin:0 0 15px;">Nhập mật khẩu để xóa ảnh</h3>
        <input type="password" id="delete-password-input" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ccc; border-radius:4px;" placeholder="Mật khẩu">
        <p id="password-error" style="color:red; display:none; margin-bottom:10px;">Sai mật khẩu!</p>
        <button id="password-confirm" style="background:#dc3545; color:white; padding:10px 20px; border:none; border-radius:4px; cursor:pointer; margin-right:10px;">Xác nhận</button>
        <button id="password-cancel" style="background:#6c757d; color:white; padding:10px 20px; border:none; border-radius:4px; cursor:pointer;">Hủy</button>
      </div>
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
  const img = document.getElementById('img-modal-img');
  const passwordModal = document.getElementById('password-modal');
  img.src = imgSrc;
  img.style.display = 'block';
  passwordModal.style.display = 'none';
  modal.classList.add('active');
}

function closeModal() {
  const modal = document.getElementById('img-modal');
  if (modal) {
    modal.classList.remove('active');
    document.getElementById('img-modal-img').style.display = 'none';
    document.getElementById('password-modal').style.display = 'none';
    document.getElementById('delete-password-input').value = '';
    document.getElementById('password-error').style.display = 'none';
  }
}

function openPasswordModal(callback) {
  ensureModal();
  const modal = document.getElementById('img-modal');
  const img = document.getElementById('img-modal-img');
  const passwordModal = document.getElementById('password-modal');
  const passwordInput = document.getElementById('delete-password-input');
  const passwordError = document.getElementById('password-error');
  const confirmBtn = document.getElementById('password-confirm');
  const cancelBtn = document.getElementById('password-cancel');

  img.style.display = 'none';
  passwordModal.style.display = 'block';
  modal.classList.add('active');
  passwordInput.focus();

  // Xử lý nút Xác nhận
  confirmBtn.onclick = () => {
    const pwd = passwordInput.value;
    if (!pwd || pwd !== FIXED_PASSWORD) {
      passwordError.style.display = 'block';
      passwordInput.value = '';
      passwordInput.focus();
      return;
    }
    passwordError.style.display = 'none';
    closeModal();
    callback();
  };

  // Xử lý nút Hủy
  cancelBtn.onclick = closeModal;
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
      const pathAfterUpload = parts.slice(uploadIndex + 1);
      const publicId = (pathAfterUpload[0].startsWith('v') ? pathAfterUpload.slice(1) : pathAfterUpload).join('/').split('.')[0];
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
  if (!confirm('Bạn có chắc muốn xóa ảnh này?')) return;
  openPasswordModal(async () => {
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
  });
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