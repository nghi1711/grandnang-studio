/* ============================================================
   OUTFITS.JS — Tích hợp chỉnh sửa trực tiếp 3 ảnh từ Modal Popup
   ============================================================ */

const OUTFIT_CATEGORY_DEFAULTS = {
    'truyen-thong': [
        ['Áo dài', '+80.000đ / bộ', 'ao-dai.jpg'],
        ['Vest 6 cúc', '+80.000đ / áo', 'vest-6-cuc.jpg'],
        ['Vest 1 cúc truyền thống', '+60.000đ / áo', 'vest-1-cuc.jpg'],
        ['Cử nhân Quốc tế - Xanh', '+20.000đ / bộ', 'cu-nhan-xanh.jpg'],
        ['Cử nhân Quốc tế - Đen', '+20.000đ / bộ', 'cu-nhan-den.jpg'],
        ['Cử nhân Quốc tế - NEW', '+40.000đ / bộ', 'cu-nhan-new.jpg'],
        ['Sash cử nhân', '+30.000đ / sash', 'sash.jpg']
    ],
    'concept': [
        ['Thái Lan', 'Tùy chọn', 'thai-lan.jpg'],
        ['Truyền thống', 'Tùy chọn', 'truyen-thong.jpg'],
        ['Trung Quốc (ko logo)', 'Tùy chọn', 'trung-quoc.jpg'],
        ['Concept Xám', 'Tùy chọn', 'concept-xam.jpg'],
        ['Concept Be', 'Tùy chọn', 'concept-be.jpg']
    ],
    'vest': [
        ['Vest thanh xuân Xám', '+80.000đ / áo', 'vest-xam.jpg'],
        ['Vest thanh xuân Nhật', '+80.000đ / áo', 'vest-nhat.jpg'],
        ['Vest thanh xuân Nâu', '+80.000đ / áo', 'vest-nau.jpg']
    ]
};

function buildOutfitCategoryDefaults(key) {
    return (OUTFIT_CATEGORY_DEFAULTS[key] || []).map(([name, price, img]) => ({
        id: 'default-' + key + '-' + img,
        name, price, img,
        hImg1: img, 
        hImg2: img
    }));
}

window.__outfitCategoryItems = window.__outfitCategoryItems || {};

async function renderOutfitCategories() {
    const keys = Object.keys(OUTFIT_CATEGORY_DEFAULTS);
    for (const key of keys) {
        window.__outfitCategoryItems[key] = await loadGalleryItems(
            'outfit_categories', key, buildOutfitCategoryDefaults(key)
        );
        drawOutfitGrid(key);
    }
}

function drawOutfitGrid(key) {
    const grid = document.getElementById('outfitGrid-' + key);
    if (!grid) return;
    const items = window.__outfitCategoryItems[key] || [];
    const editOn = typeof window.isSiteEditModeOn === 'function' && window.isSiteEditModeOn();

    grid.innerHTML = '';

    items.forEach((it, idx) => {
        const card = document.createElement('div');
        card.className = 'outfit-card-item';
        card.innerHTML = `
            <div class="outfit-card-img"><img src="${it.img || 'placeholder.jpg'}" alt=""></div>
            <div class="outfit-card-info">
                <h4></h4>
                <p class="outfit-card-price"></p>
            </div>`;
        card.querySelector('h4').textContent = it.name;
        card.querySelector('.outfit-card-price').textContent = it.price;

        // Bấm vào thẻ để mở Popup Xem (hoặc Sửa ảnh nếu BẬT chế độ)
        card.addEventListener('click', () => {
            openOutfitDetailPopup(it.name, it.img, it.hImg1 || it.img, it.hImg2 || it.img, editOn ? async (newData) => {
                it.name = newData.title;
                it.img = newData.verticalImg;
                it.hImg1 = newData.horizontalImg1;
                it.hImg2 = newData.horizontalImg2;
                drawOutfitGrid(key); 
                await saveGalleryItems('outfit_categories', key, items);
            } : null);
        });

        // Nếu BẬT chế độ sửa, thêm nút Sửa Thumbnail, Sửa giá tiền và Xóa
        if (editOn) {
            const controls = document.createElement('div');
            controls.className = 'gallery-edit-controls';
            controls.innerHTML = `
                <button type="button" class="gallery-edit-btn" title="Đổi ảnh bìa (Thumbnail)"><i class="fa-solid fa-image"></i></button>
                <button type="button" class="gallery-edit-btn" title="Sửa giá tiền"><i class="fa-solid fa-tag"></i></button>
                <button type="button" class="gallery-edit-btn gallery-edit-btn-danger" title="Xóa"><i class="fa-solid fa-trash"></i></button>`;
            
            const [btnThumb, btnPrice, btnDelete] = controls.querySelectorAll('button');
            
            // Nút sửa ảnh bìa
            btnThumb.addEventListener('click', async (e) => {
                e.stopPropagation(); 
                const url = await pickAndUploadImageSimple();
                if (url) {
                    it.img = url;
                    drawOutfitGrid(key);
                    await saveGalleryItems('outfit_categories', key, items);
                }
            });

            // Nút sửa giá
            btnPrice.addEventListener('click', async (e) => {
                e.stopPropagation(); 
                const price = prompt('Nhập giá / ghi chú mới (VD: +80.000đ / bộ, hoặc "Free"):', it.price);
                if (price !== null) {
                    it.price = price.trim();
                    drawOutfitGrid(key);
                    await saveGalleryItems('outfit_categories', key, items);
                }
            });
            
            // Nút xóa
            btnDelete.addEventListener('click', async (e) => { 
                e.stopPropagation(); 
                if (!confirm('Xóa trang phục này khỏi danh sách?')) return;
                items.splice(idx, 1);
                drawOutfitGrid(key);
                await saveGalleryItems('outfit_categories', key, items);
            });
            
            card.appendChild(controls);
        }

        grid.appendChild(card);
    });

    if (editOn) {
        const addTile = document.createElement('div');
        addTile.className = 'outfit-card-item gallery-add-tile';
        addTile.innerHTML = `<div class="gallery-add-tile-inner"><i class="fa-solid fa-plus"></i><span>Thêm trang phục</span></div>`;
        addTile.addEventListener('click', async () => {
            const name = prompt('Nhập tên trang phục mới:');
            if (name === null || !name.trim()) return;
            const price = prompt('Nhập giá tiền hoặc ghi chú (VD: +80.000đ / bộ):', '') || '';

            const url = await pickAndUploadImageSimple();
            if (!url) return;

            items.push({ id: galleryItemId(), name: name.trim(), price: price.trim(), img: url, hImg1: url, hImg2: url });
            drawOutfitGrid(key);
            await saveGalleryItems('outfit_categories', key, items);
        });
        grid.appendChild(addTile);
    }
}

if (typeof registerGalleryEditRefresh === 'function') {
    registerGalleryEditRefresh(() => Object.keys(OUTFIT_CATEGORY_DEFAULTS).forEach(drawOutfitGrid));
}