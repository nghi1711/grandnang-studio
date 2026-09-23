/* ============================================================
   ALBUMDETAIL.JS — hiển thị + cho Admin/Thành viên thêm/sửa/xoá
   ảnh trực tiếp trong album của từng lớp, khi bật "Chế độ sửa ảnh"
   (nút góc dưới phải, xử lý chung ở image-manager.js).
   Dữ liệu lưu tại Firestore collection "class_albums",
   1 doc / lớp (key = slug rút từ tên lớp), field items[].
   ============================================================ */

// Kích cỡ mặc định gán xoay vòng cho ảnh gốc (chưa có size lưu riêng),
// giống hiệu ứng masonry ở trang Home.
const ALBUM_DETAIL_SIZE_PATTERN = [
    'size-tall', '', 'size-wide', '', '', 'size-tall', '',
    'size-wide', 'size-tall', '', '', 'size-wide', '', 'size-tall', '', 'size-wide', ''
];

// gallery-editor.js dùng chung 4 lựa chọn '', 'wide', 'tall', 'big' —
// album lại dùng tên class 'size-wide'/'size-tall'/'size-big'/'' nên cần quy đổi.
const ALBUM_SIZE_TO_GALLERY = { '': '', 'size-tall': 'tall', 'size-wide': 'wide', 'size-big': 'big' };
const GALLERY_SIZE_TO_ALBUM = { '': '', 'tall': 'size-tall', 'wide': 'size-wide', 'big': 'size-big' };

let currentAlbumLightboxIndex = 0;

function slugifyAlbumName(fullName) {
    const firstPart = (fullName || '').split('-')[0].trim();
    return firstPart.toLowerCase().replace(/[^a-z0-9]/g, '') || 'lop-chua-dat-ten';
}

function buildAlbumDefaultItems(images) {
    return (images || []).map((src, index) => ({
        id: 'default-' + index + '-' + src,
        url: src,
        size: ALBUM_DETAIL_SIZE_PATTERN[index % ALBUM_DETAIL_SIZE_PATTERN.length]
    }));
}

async function initAlbumDetailPage() {
    const data = window.currentAlbumData;
    const titleEl = document.getElementById('albumDetailPageTitle');
    const countEl = document.getElementById('albumDetailPageCount');
    const gridEl = document.getElementById('albumDetailMasonryGrid');
    if (!titleEl || !countEl || !gridEl) return;

    if (!data || !data.name) {
        titleEl.innerText = 'Không tìm thấy album';
        countEl.innerText = '';
        gridEl.innerHTML = '<p style="color: var(--text-muted); grid-column: 1 / -1;">Vui lòng quay lại và chọn một album để xem.</p>';
        window.__currentAlbumItems = [];
        return;
    }

    titleEl.innerText = data.name;
    window.__currentAlbumSlug = slugifyAlbumName(data.name);
    window.__currentAlbumItems = await loadGalleryItems(
        'class_albums', window.__currentAlbumSlug, buildAlbumDefaultItems(data.images)
    );

    drawAlbumDetailGrid();
}

function drawAlbumDetailGrid() {
    const gridEl = document.getElementById('albumDetailMasonryGrid');
    const countEl = document.getElementById('albumDetailPageCount');
    if (!gridEl) return;

    const items = window.__currentAlbumItems || [];
    if (countEl) countEl.innerText = items.length > 0 ? `${items.length} ảnh` : '';
    const editOn = typeof window.isSiteEditModeOn === 'function' && window.isSiteEditModeOn();
    const albumName = (window.currentAlbumData && window.currentAlbumData.name) || '';

    gridEl.innerHTML = '';

    items.forEach((it, index) => {
        const item = document.createElement('div');
        item.className = 'albumdetail-item ' + (it.size || '');
        item.innerHTML = `<img src="${it.url}" alt="${albumName} - Ảnh ${index + 1}">`;

        if (editOn) {
            const controls = document.createElement('div');
            controls.className = 'gallery-edit-controls';
            controls.innerHTML = `
                <button type="button" class="gallery-edit-btn" title="Đổi ảnh"><i class="fa-solid fa-camera"></i></button>
                <button type="button" class="gallery-edit-btn gallery-edit-btn-danger" title="Xóa"><i class="fa-solid fa-trash"></i></button>`;
            const [btnEdit, btnDelete] = controls.querySelectorAll('button');
            btnEdit.addEventListener('click', (e) => { e.stopPropagation(); editAlbumPhoto(index); });
            btnDelete.addEventListener('click', (e) => { e.stopPropagation(); deleteAlbumPhoto(index); });
            item.appendChild(controls);
        } else {
            item.addEventListener('click', () => openAlbumLightbox(index));
        }

        gridEl.appendChild(item);
    });

    if (editOn) {
        const addTile = document.createElement('div');
        addTile.className = 'albumdetail-item gallery-add-tile';
        addTile.innerHTML = `<div class="gallery-add-tile-inner"><i class="fa-solid fa-plus"></i><span>Thêm ảnh</span></div>`;
        addTile.addEventListener('click', addAlbumPhoto);
        gridEl.appendChild(addTile);
    }
}

async function addAlbumPhoto() {
    const result = await pickAndUploadGalleryImage();
    if (!result) return;
    window.__currentAlbumItems.push({
        id: galleryItemId(), url: result.url, size: GALLERY_SIZE_TO_ALBUM[result.size] || ''
    });
    drawAlbumDetailGrid();
    await saveGalleryItems('class_albums', window.__currentAlbumSlug, window.__currentAlbumItems);
}

async function editAlbumPhoto(index) {
    const current = window.__currentAlbumItems[index];
    const result = await pickAndUploadGalleryImage();
    if (!result) return;
    current.url = result.url;
    current.size = GALLERY_SIZE_TO_ALBUM[result.size] || '';
    drawAlbumDetailGrid();
    await saveGalleryItems('class_albums', window.__currentAlbumSlug, window.__currentAlbumItems);
}

async function deleteAlbumPhoto(index) {
    if (!confirm('Xóa ảnh này khỏi album?')) return;
    window.__currentAlbumItems.splice(index, 1);
    drawAlbumDetailGrid();
    await saveGalleryItems('class_albums', window.__currentAlbumSlug, window.__currentAlbumItems);
}

function openAlbumLightbox(index) {
    const items = window.__currentAlbumItems;
    if (!items || !items[index]) return;

    currentAlbumLightboxIndex = index;
    document.getElementById('albumLightboxImg').src = items[index].url;
    document.getElementById('albumLightbox').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeAlbumLightbox() {
    document.getElementById('albumLightbox').classList.remove('show');
    document.body.style.overflow = '';
}

function navAlbumLightbox(direction) {
    const items = window.__currentAlbumItems;
    if (!items || items.length === 0) return;

    currentAlbumLightboxIndex = (currentAlbumLightboxIndex + direction + items.length) % items.length;
    document.getElementById('albumLightboxImg').src = items[currentAlbumLightboxIndex].url;
}

// Đóng lightbox khi click nền đen ngoài ảnh
document.addEventListener('click', function (e) {
    const lightbox = document.getElementById('albumLightbox');
    if (lightbox && e.target === lightbox) closeAlbumLightbox();
});

// Điều hướng bằng phím mũi tên / Esc khi lightbox đang mở
document.addEventListener('keydown', function (e) {
    const lightbox = document.getElementById('albumLightbox');
    if (!lightbox || !lightbox.classList.contains('show')) return;

    if (e.key === 'Escape') closeAlbumLightbox();
    else if (e.key === 'ArrowLeft') navAlbumLightbox(-1);
    else if (e.key === 'ArrowRight') navAlbumLightbox(1);
});

if (typeof registerGalleryEditRefresh === 'function') registerGalleryEditRefresh(drawAlbumDetailGrid);