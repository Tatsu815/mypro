const menuBtn = document.querySelector('.menu-toggle');
const nav = document.querySelector('nav');
const API_BASE = '/api';
const FIXED_PASSWORD = "0815";

menuBtn.addEventListener('click', () => {
    nav.classList.toggle('open');
});

function ensureModal() {
  if (document.getElementById('img-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'img-modal';
  modal.innerHTML = `
    <div class="img-modal-content">
      <span class="img-modal-close" id="img-modal-close">&times;</span>
      <img id="img-modal-img" src="" alt="preview">
    </div>
  `;
  document.body.appendChild(modal);

  // Đặt sự kiện đóng modal (chỉ đặt 1 lần)
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
  if(modal) modal.classList.remove('active');
}

async function fetchImages() {
  try {
    const res = await fetch(`${API_BASE}/images`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const images = await res.json();
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = images.map(url => {
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      return `
        <div class="gallery-item" style="display:inline-block; position:relative;">
          <img src="${url}" alt="pic" style="cursor:pointer;" onclick="openModal('${url}')">
          <button onclick="deleteImage('${filename}')" style="position:absolute; top:5px; right:5px; background:red; color:white; border:none; border-radius:50%; width:24px; height:24px; cursor:pointer;">×</button>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error fetching images:', error);
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '<p>Không thể tải danh sách ảnh. Lỗi: ' + error.message + '</p>';
  }
}

async function deleteImage(filename) {
  const pwd = prompt('Nhập password để xóa ảnh:');
  if (!pwd || pwd !== FIXED_PASSWORD) {
    alert('Sai mật khẩu. Không thể xóa ảnh!');
    return;
  }
  if (!confirm('Bạn có chắc muốn xóa ảnh này?')) return;
  await fetch(`${API_BASE}/images?filename=${filename}`, {
    method: 'DELETE'
  });
  fetchImages();
}

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
      fileChosen.textContent = "Xem trước ảnh";
    }
  });
}

if (uploadForm) {
  uploadForm.onsubmit = async function(e) {
    e.preventDefault();

    // Kiểm tra password
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
    await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData
    });
    imageInput.value = '';
    uploadPassword.value = '';
    // Reset preview
    imgPreview.style.display = 'none';
    fileChosen.style.display = 'inline';
    fileChosen.textContent = "Xem trước ảnh";
    fetchImages();
  };
  ensureModal();
  fetchImages();
} else {
  ensureModal();
}

window.openModal = openModal;
window.closeModal = closeModal;