/* ============================================================
   IMAGE-MANAGER.JS — Quản lý khung ảnh slot & nút bật sửa ảnh
   ============================================================ */

window.__galleryEditRefreshCallbacks = window.__galleryEditRefreshCallbacks || [];
function registerGalleryEditRefresh(fn) {
    if (typeof fn === 'function') window.__galleryEditRefreshCallbacks.push(fn);
}
window.isSiteEditModeOn = function () { return siteEditModeOn; };

const SITE_IMAGE_SLOTS = [
    { key: 'home-hero-1', label: 'Banner trang chủ - Ảnh 1', category: 'Trang chủ - Banner', defaultFile: 'banner.jpg' },
    { key: 'home-hero-2', label: 'Banner trang chủ - Ảnh 2', category: 'Trang chủ - Banner', defaultFile: 'ảnh 2.jpg' },
    { key: 'home-hero-3', label: 'Banner trang chủ - Ảnh 3', category: 'Trang chủ - Banner', defaultFile: 'ảnh 3.jpg' },
    { key: 'home-hero-4', label: 'Banner trang chủ - Ảnh 4', category: 'Trang chủ - Banner', defaultFile: 'ảnh 4.jpg' },
    { key: 'home-hero-5', label: 'Banner trang chủ - Ảnh 5', category: 'Trang chủ - Banner', defaultFile: 'ảnh 5.jpg' },
    { key: 'home-about-main', label: 'Về chúng tôi - Ảnh tập thể', category: 'Trang chủ - Về chúng tôi', defaultFile: 'tap-the.jpg' },
    { key: 'home-about-sub', label: 'Về chúng tôi - Ảnh ekip', category: 'Trang chủ - Về chúng tôi', defaultFile: 'tho-anh.jpg' },
    { key: 'home-parallax', label: 'Dải banner giữa trang', category: 'Trang chủ - Banner giữa', defaultFile: 'banner-giua.jpg' }
];

async function loadSiteImages() {
    const map = {};
    try {
        const snap = await db.collection('site_images').get();
        snap.forEach(doc => { map[doc.id] = doc.data().url; });
    } catch (err) {
        console.error('Không tải được ảnh từ Firestore:', err);
    }
    return map;
}

async function applySiteImages(rootEl) {
    if (!rootEl) rootEl = document;
    const elements = rootEl.querySelectorAll('[data-slot]');
    if (elements.length === 0) return;

    const map = await loadSiteImages();
    elements.forEach(el => {
        const key = el.getAttribute('data-slot');
        const url = map[key];
        if (!url) return;

        if (el.tagName === 'IMG') {
            el.src = url;
        } else {
            el.style.backgroundImage = `url('${url}')`;
        }
    });

    ensureEditModeToggleButton();
    applyEditModeToElements(elements);
}

let siteEditModeOn = false;

function isAdminSessionActive() {
    return !!(localStorage.getItem('grandnang_admin_current_user') || sessionStorage.getItem('grandnang_admin_current_user'));
}

function ensureEditModeToggleButton() {
    if (!isAdminSessionActive()) return;
    if (document.getElementById('siteEditModeToggleBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'siteEditModeToggleBtn';
    btn.innerHTML = '<i class="fa-solid fa-pen"></i> Chế độ sửa ảnh: TẮT';
    btn.style.cssText = `
        position: fixed; bottom: 24px; right: 24px; z-index: 99999;
        background: #dfb76c; color: #000; border: none; padding: 13px 22px;
        border-radius: 30px; font-weight: bold; cursor: pointer;
        box-shadow: 0 8px 24px rgba(0,0,0,0.5); font-size: 0.9rem;
        transition: background 0.2s ease;
    `;
    btn.addEventListener('click', () => {
        siteEditModeOn = !siteEditModeOn;
        btn.innerHTML = siteEditModeOn
            ? '<i class="fa-solid fa-pen"></i> Chế độ sửa ảnh: BẬT'
            : '<i class="fa-solid fa-pen"></i> Chế độ sửa ảnh: TẮT';
        btn.style.background = siteEditModeOn ? '#4ade80' : '#dfb76c';
        applyEditModeToElements(document.querySelectorAll('[data-slot]'));

        window.__galleryEditRefreshCallbacks.forEach(fn => {
            try { fn(); } catch (err) { console.error(err); }
        });
    });
    document.body.appendChild(btn);
}

function applyEditModeToElements(elements) {
    elements.forEach(el => {
        el.removeEventListener('click', handleInlineSlotClick);
        el.style.outline = '';
        el.style.outlineOffset = '';
        el.style.cursor = '';
        el.title = '';

        if (siteEditModeOn) {
            el.style.outline = '3px dashed #dfb76c';
            el.style.outlineOffset = '2px';
            el.style.cursor = 'pointer';
            el.title = 'Bấm để đổi ảnh này';
            el.addEventListener('click', handleInlineSlotClick);
        }
    });
}

function handleInlineSlotClick(e) {
    e.preventDefault();
    e.stopPropagation();

    const el = e.currentTarget;
    const slotKey = el.getAttribute('data-slot');

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', async () => {
        const file = input.files[0];
        if (!file) return;
        el.style.opacity = '0.4';
        try {
            const url = await uploadSlotImage(slotKey, file);
            if (el.tagName === 'IMG') el.src = url;
            else el.style.backgroundImage = `url('${url}')`;
        } catch (err) {
            console.error(err);
            alert('Tải ảnh lên thất bại: ' + (err && err.message ? err.message : 'Lỗi không xác định'));
        } finally {
            el.style.opacity = '1';
        }
    });
    input.click();
}

async function uploadSlotImage(slotKey, file) {
    const url = await uploadImageToCloudinary(file);
    await db.collection('site_images').doc(slotKey).set({
        url,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return url;
}

async function renderImageManagerTab(containerEl) {
    if (!containerEl) return;
    containerEl.innerHTML = '<p style="color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải danh sách ảnh...</p>';

    const map = await loadSiteImages();
    const categories = {};
    SITE_IMAGE_SLOTS.forEach(slot => {
        if (!categories[slot.category]) categories[slot.category] = [];
        categories[slot.category].push(slot);
    });

    let html = '';
    Object.keys(categories).forEach(catName => {
        html += `<h3 style="color: var(--gold); margin: 25px 0 15px 0; font-size: 1rem; border-bottom: 1px dashed var(--border-color); padding-bottom: 10px;">${catName}</h3>`;
        html += `<div class="img-slot-grid">`;
        categories[catName].forEach(slot => {
            const currentUrl = map[slot.key] || slot.defaultFile;
            html += `
                <div class="img-slot-tile" data-slot-key="${slot.key}">
                    <div class="img-slot-preview" style="background-image: url('${currentUrl}');">
                        <div class="img-slot-overlay"><i class="fa-solid fa-camera"></i> Đổi ảnh</div>
                    </div>
                    <p class="img-slot-label">${slot.label}</p>
                    <input type="file" accept="image/*" class="img-slot-file-input" style="display:none;">
                </div>`;
        });
        html += `</div>`;
    });

    containerEl.innerHTML = html;

    containerEl.querySelectorAll('.img-slot-tile').forEach(tile => {
        const slotKey = tile.getAttribute('data-slot-key');
        const preview = tile.querySelector('.img-slot-preview');
        const fileInput = tile.querySelector('.img-slot-file-input');

        tile.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', async () => {
            const file = fileInput.files[0];
            if (!file) return;

            preview.style.opacity = '0.4';
            tile.style.pointerEvents = 'none';
            const overlay = tile.querySelector('.img-slot-overlay');
            overlay.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tải lên...';

            try {
                const url = await uploadSlotImage(slotKey, file);
                preview.style.backgroundImage = `url('${url}')`;
                overlay.innerHTML = '<i class="fa-solid fa-camera"></i> Đổi ảnh';
            } catch (err) {
                console.error(err);
                alert('Tải ảnh lên thất bại, vui lòng thử lại!');
                overlay.innerHTML = '<i class="fa-solid fa-camera"></i> Đổi ảnh';
            } finally {
                preview.style.opacity = '1';
                tile.style.pointerEvents = 'auto';
            }
        });
    });
}