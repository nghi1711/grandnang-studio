/* ============================================================
   GALLERY-EDITOR.JS
   Bộ khung DÙNG CHUNG cho Admin/Thành viên để THÊM / SỬA / XÓA ảnh
   trực tiếp ngay trên giao diện khách hàng, áp dụng cho:
     - Kho Ảnh Trang Chủ (home.js)
     - Album từng lớp (albumdetail.js)
     - Trang Phục (outfits.js)
   ============================================================ */

function detectImageOrientation(file) {
    return new Promise((resolve) => {
        const img = new Image();
        const objUrl = URL.createObjectURL(file);
        img.onload = () => {
            const ratio = img.naturalWidth / img.naturalHeight;
            URL.revokeObjectURL(objUrl);
            if (ratio >= 1.35) resolve('wide');
            else if (ratio <= 0.75) resolve('tall');
            else resolve('');
        };
        img.onerror = () => { URL.revokeObjectURL(objUrl); resolve(''); };
        img.src = objUrl;
    });
}

const GALLERY_SIZE_OPTIONS = [
    { value: '', label: 'Vuông / Thường' },
    { value: 'wide', label: 'Ngang (rộng)' },
    { value: 'tall', label: 'Dọc (cao)' },
    { value: 'big', label: 'Lớn (nổi bật)' }
];

function ensureGallerySizePickerModal() {
    if (document.getElementById('gallerySizePickerModal')) return;
    const modal = document.createElement('div');
    modal.id = 'gallerySizePickerModal';
    modal.className = 'gallery-size-picker-overlay';
    modal.innerHTML = `
        <div class="gallery-size-picker-box">
            <h4><i class="fa-solid fa-crop-simple"></i> Chọn khung hiển thị cho ảnh</h4>
            <p class="gallery-size-picker-hint">Hệ thống đã tự nhận diện theo tỉ lệ ảnh thật, bạn có thể đổi lại nếu muốn.</p>
            <div class="gallery-size-picker-options" id="gallerySizePickerOptions"></div>
            <div class="gallery-size-picker-actions">
                <button type="button" class="gallery-size-picker-cancel">Hủy</button>
                <button type="button" class="gallery-size-picker-confirm">Xác nhận</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
}

function pickImageSizeClass(suggested) {
    ensureGallerySizePickerModal();
    return new Promise((resolve) => {
        const modal = document.getElementById('gallerySizePickerModal');
        const optionsWrap = document.getElementById('gallerySizePickerOptions');
        let selected = suggested || '';

        optionsWrap.innerHTML = '';
        GALLERY_SIZE_OPTIONS.forEach(opt => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'gallery-size-option' + (opt.value === selected ? ' active' : '');
            btn.textContent = opt.label;
            btn.addEventListener('click', () => {
                selected = opt.value;
                optionsWrap.querySelectorAll('.gallery-size-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
            optionsWrap.appendChild(btn);
        });

        const cleanup = (result) => {
            modal.classList.remove('show');
            resolve(result);
        };
        modal.querySelector('.gallery-size-picker-confirm').onclick = () => cleanup(selected);
        modal.querySelector('.gallery-size-picker-cancel').onclick = () => cleanup(null);

        modal.classList.add('show');
    });
}

async function pickAndUploadGalleryImage() {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async () => {
            const file = input.files[0];
            if (!file) return resolve(null);

            const suggested = await detectImageOrientation(file);
            const size = await pickImageSizeClass(suggested);
            if (size === null) return resolve(null);

            try {
                const url = await uploadImageToCloudinary(file);
                resolve({ url, size });
            } catch (err) {
                console.error(err);
                alert('Tải ảnh lên thất bại: ' + (err && err.message ? err.message : 'Lỗi không xác định'));
                resolve(null);
            }
        };
        input.click();
    });
}

async function pickAndUploadImageSimple() {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async () => {
            const file = input.files[0];
            if (!file) return resolve(null);
            try {
                const url = await uploadImageToCloudinary(file);
                resolve(url);
            } catch (err) {
                console.error(err);
                alert('Tải ảnh lên thất bại: ' + (err && err.message ? err.message : 'Lỗi không xác định'));
                resolve(null);
            }
        };
        input.click();
    });
}

async function loadGalleryItems(collectionName, docId, defaultItems) {
    try {
        const snap = await db.collection(collectionName).doc(docId).get();
        if (snap.exists && Array.isArray(snap.data().items) && snap.data().items.length > 0) {
            return snap.data().items;
        }
    } catch (err) {
        console.error('Không tải được gallery từ Firestore:', collectionName, docId, err);
    }
    return (defaultItems || []).slice();
}

async function saveGalleryItems(collectionName, docId, items) {
    try {
        await db.collection(collectionName).doc(docId).set({
            items,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (err) {
        console.error('Không lưu được gallery vào Firestore:', collectionName, docId, err);
        alert('Lưu thay đổi thất bại, vui lòng kiểm tra kết nối mạng và thử lại!');
    }
}

function galleryItemId() {
    return 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}