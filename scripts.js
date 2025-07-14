const menuBtn = document.querySelector('.menu-toggle');
const nav = document.querySelector('nav');
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';
const FIXED_PASSWORD = '0815'; // Chuyển sang server-side cho production

const modal = document.getElementById('img-modal');
const img = document.getElementById('img-modal-img');

//delete
const confirmDeleteModal = document.getElementById('confirm-delete-modal');
const deletePasswordModal = document.getElementById('delete-password-modal');
const deletePasswordInput = document.getElementById('delete-password-input');
const deletePasswordError = document.getElementById('delete-password-error');
const deleteyesBtn = document.getElementById('confirm-delete-yes');
const deletenoBtn = document.getElementById('confirm-delete-no');
const deleteconfirmBtn = document.getElementById('delete-password-confirm');
const deletecancelBtn = document.getElementById('delete-password-cancel');

//upload
const confirmUploadModal = document.getElementById('confirm-upload-modal');
const uploadPasswordModal = document.getElementById('upload-password-modal');
const uploadPasswordInput = document.getElementById('upload-password-input');
const uploadPasswordError = document.getElementById('upload-password-error');
const uploadyesBtn = document.getElementById('confirm-upload-yes');
const uploadnoBtn = document.getElementById('confirm-upload-no');
const uploadconfirmBtn = document.getElementById('upload-password-confirm');
const uploadcancelBtn = document.getElementById('upload-password-cancel');

// Menu toggle
if (menuBtn && nav) {
  menuBtn.addEventListener('click', () => {
    nav.classList.toggle('open');
  });
} else {
  console.error('Không tìm thấy .menu-toggle hoặc nav trong DOM');
}

// Modal functions
function openModal(imgSrc) {
  if (!modal || !img || !confirmDeleteModal || !deletePasswordModal || !confirmUploadModal || !uploadPasswordModal) {
    console.error('Không tìm thấy các phần tử modal');
    return;
  }
  img.src = imgSrc;
  img.style.display = 'block';
  confirmDeleteModal.style.display = 'none';
  deletePasswordModal.style.display = 'none';
  confirmUploadModal.style.display = 'none';
  uploadPasswordModal.style.display = 'none';
  modal.classList.add('active');

  modal.querySelector('.img-modal-close').onclick = closeModal;
  modal.onclick = function(e) {
    if (e.target === modal) closeModal();
  };
}

function closeModal() {
    if (modal) {
    modal.classList.remove('active');
    if (img) img.style.display = 'none';
    if (confirmDeleteModal) confirmDeleteModal.style.display = 'none';
    if (deletePasswordModal) deletePasswordModal.style.display = 'none';
    if (confirmUploadModal) confirmUploadModal.style.display = 'none';
    if (uploadPasswordModal) uploadPasswordModal.style.display = 'none';
    if (deletePasswordInput) deletePasswordInput.value = '';
    if (deletePasswordError) deletePasswordError.style.display = 'none';
    if (uploadPasswordInput) uploadPasswordInput.value = '';
    if (uploadPasswordError) uploadPasswordError.style.display = 'none';
  }
}

function openConfirmDeleteModal(callback) {
  if (!modal || !confirmDeleteModal || !deleteyesBtn || !deletenoBtn) {
    console.error('Không tìm thấy các phần tử modal xác nhận xóa');
    return;
  }

  img.style.display = 'none';
  confirmDeleteModal.style.display = 'block';
  deletePasswordModal.style.display = 'none';
  confirmUploadModal.style.display = 'none';
  uploadPasswordModal.style.display = 'none';
  modal.classList.add('active');

  deleteyesBtn.onclick = callback;
  deletenoBtn.onclick = closeModal;
}

function openDeletePasswordModal(callback) {
  if (!modal || !deletePasswordModal || !deletePasswordInput || !deleteconfirmBtn || !deletecancelBtn) {
    console.error('Không tìm thấy các phần tử modal mật khẩu');
    return;
  }

  img.style.display = 'none';
  confirmDeleteModal.style.display = 'none';
  deletePasswordModal.style.display = 'block';
  confirmUploadModal.style.display = 'none';
  uploadPasswordModal.style.display = 'none';
  modal.classList.add('active');
  deletePasswordInput.focus();

  deleteconfirmBtn.onclick = () => {
    const pwd = deletePasswordInput.value;
    if (!pwd || pwd !== FIXED_PASSWORD) {
      deletePasswordError.style.display = 'block';
      deletePasswordInput.value = '';
      deletePasswordInput.focus();
      return;
    }
    deletePasswordError.style.display = 'none';
    closeModal();
    callback();
  };

  deletecancelBtn.onclick = closeModal;
}

function openConfirmUploadModal(imgSrc, callback) {
  const uploadPreviewImg = document.getElementById('upload-preview-img');

  if (!modal || !confirmUploadModal || !uploadPreviewImg || !uploadyesBtn || !uploadnoBtn) {
    console.error('Không tìm thấy các phần tử modal xác nhận upload');
    return;
  }

  img.style.display = 'none';
  confirmDeleteModal.style.display = 'none';
  deletePasswordModal.style.display = 'none';
  confirmUploadModal.style.display = 'block';
  uploadPasswordModal.style.display = 'none';
  uploadPreviewImg.src = imgSrc;
  modal.classList.add('active');

  uploadyesBtn.onclick = callback;
  uploadnoBtn.onclick = closeModal;
}

function openUploadPasswordModal(callback) {
  if (!modal || !uploadPasswordModal || !uploadPasswordInput || !uploadconfirmBtn || !uploadcancelBtn) {
    console.error('Không tìm thấy các phần tử modal mật khẩu upload');
    return;
  }

  img.style.display = 'none';
  confirmDeleteModal.style.display = 'none';
  deletePasswordModal.style.display = 'none';
  confirmUploadModal.style.display = 'none';
  uploadPasswordModal.style.display = 'block';
  modal.classList.add('active');
  uploadPasswordInput.focus();

  uploadconfirmBtn.onclick = () => {
    const pwd = uploadPasswordInput.value;
    if (!pwd || pwd !== FIXED_PASSWORD) {
      uploadPasswordError.style.display = 'block';
      uploadPasswordInput.value = '';
      uploadPasswordInput.focus();
      return;
    }
    uploadPasswordError.style.display = 'none';
    closeModal();
    callback();
  };

  uploadcancelBtn.onclick = closeModal;
}

// Lấy và hiển thị ảnh từ Cloudinary
async function fetchImages() {
  try {
    const res = await fetch(`${API_BASE}/images`);
    if (!res.ok) {
      throw new Error(`Lỗi HTTP! status: ${res.status}`);
    }
    const images = await res.json();
    const gallery = document.getElementById('gallery');
    if (!gallery) return;
    gallery.innerHTML = images.map(url => {
      // Trích xuất public_id từ URL Cloudinary
      const parts = url.split('/');
      const uploadIndex = parts.indexOf('upload');
      const pathAfterUpload = parts.slice(uploadIndex + 1);
      const publicId = (pathAfterUpload[0].startsWith('v') ? pathAfterUpload.slice(1) : pathAfterUpload).join('/').split('.')[0];
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
  openConfirmDeleteModal(async () => {
    openDeletePasswordModal(async () => {
      try {
        const res = await fetch(`${API_BASE}/images/${encodeURIComponent(publicId)}`, {
          method: 'DELETE',
        });
        const responseData = await res.json();
        if (!res.ok) {
          throw new Error(`Xóa thất bại: ${responseData.error || res.statusText}`);
        }
        await fetchImages(); // Làm mới gallery
      } catch (error) {
        console.error('Lỗi khi xóa ảnh:', error.message);
        alert('Không thể xóa ảnh. Lỗi: ' + error.message);
      }
    });
  });
}

// Xử lý upload và xem trước ảnh
const uploadForm = document.getElementById('upload-form');
const imageInput = document.getElementById('image-input');
const fileChosen = document.getElementById('file-chosen');
const imgPreview = document.getElementById('img-preview');

if (imageInput && fileChosen && imgPreview) {
  let selectedFile = null; // Lưu file tạm thời
  imageInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
      selectedFile = this.files[0];
      const reader = new FileReader();
      reader.onload = function(e) {
        imgPreview.src = e.target.result;
        imgPreview.style.display = 'none';
        // Mở modal xác nhận upload
        openConfirmUploadModal(e.target.result, () => {
          openUploadPasswordModal(async () => {
            const formData = new FormData();
            formData.append('image', selectedFile);
            try {
              const res = await fetch(`${API_BASE}/upload`, {
                method: 'POST',
                body: formData,
              });
              if (!res.ok) {
                throw new Error('Upload thất bại');
              }
              await fetchImages();
              imageInput.value = '';
              imgPreview.style.display = 'none';
              selectedFile = null;
            } catch (error) {
              console.error('Lỗi khi upload ảnh:', error.message);
              alert('Không thể tải ảnh lên. Lỗi: ' + error.message);
            }
          });
        });
      };
      reader.readAsDataURL(selectedFile);
    } else {
      imgPreview.style.display = 'none';
      selectedFile = null;
    }
  });
}

if (uploadForm) {
  uploadForm.onsubmit = function(e) {
    e.preventDefault(); // Ngăn submit form mặc định
  };
  fetchImages();
}

window.openModal = openModal;
window.closeModal = closeModal;