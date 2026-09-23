/* ============================================================
   ALBUM.JS — Render động danh sách Album, cho phép sửa Tên & Ảnh bìa
   ============================================================ */

const DEFAULT_ALBUM_LIST = [
    { name: '12A1 - THPT Chuyên Lê Quý Đôn', cover: 'album-12a1-cover.jpg', school: 'THPT Chuyên Lê Quý Đôn', shortName: '12A1' },
    { name: '12A2 - THPT Huỳnh Thúc Kháng', cover: 'album-12a2-cover.jpg', school: 'THPT Huỳnh Thúc Kháng', shortName: '12A2' },
    { name: '12A3 - THPT Nghệ An', cover: 'album-12a3-cover.jpg', school: 'THPT Nghệ An', shortName: '12A3' },
    { name: '12A5 - THPT Nghệ An', cover: 'album-12a5-cover.jpg', school: 'THPT Nghệ An', shortName: '12A5' },
    { name: '12B1 - THPT Phan Đăng Lưu', cover: 'album-12b1-cover.jpg', school: 'THPT Phan Đăng Lưu', shortName: '12B1' },
    { name: '12B4 - THPT Lê Viết Thuật', cover: 'album-12b4-cover.jpg', school: 'THPT Lê Viết Thuật', shortName: '12B4' },
    { name: '12C2 - THPT Phan Đăng Lưu', cover: 'album-12c2-cover.jpg', school: 'THPT Phan Đăng Lưu', shortName: '12C2' },
    { name: '12C6 - THPT Hà Huy Tập', cover: 'album-12c6-cover.jpg', school: 'THPT Hà Huy Tập', shortName: '12C6' },
    { name: '12D1 - THPT Nguyễn Trường Tộ', cover: 'album-12d1-cover.jpg', school: 'THPT Nguyễn Trường Tộ', shortName: '12D1' },
    { name: '12D3 - THPT Nguyễn Trường Tộ', cover: 'album-12d3-cover.jpg', school: 'THPT Nguyễn Trường Tộ', shortName: '12D3' },
    { name: '12D5 - THPT Đô Lương 1', cover: 'album-12d5-cover.jpg', school: 'THPT Đô Lương 1', shortName: '12D5' },
    { name: '12E2 - THPT Diễn Châu 2', cover: 'album-12e2-cover.jpg', school: 'THPT Diễn Châu 2', shortName: '12E2' },
    { name: '12E4 - THPT Quỳnh Lưu 1', cover: 'album-12e4-cover.jpg', school: 'THPT Quỳnh Lưu 1', shortName: '12E4' },
    { name: '12T1 - THPT Cửa Lò', cover: 'album-12t1-cover.jpg', school: 'THPT Cửa Lò', shortName: '12T1' },
    { name: '12T3 - THPT Nam Đàn 1', cover: 'album-12t3-cover.jpg', school: 'THPT Nam Đàn 1', shortName: '12T3' }
];

window.__albumListItems = [];

async function renderAlbumPage() {
    const grid = document.getElementById('albumListGrid');
    if (!grid) return;

    window.__albumListItems = await loadGalleryItems('site_data', 'album_list', DEFAULT_ALBUM_LIST);
    drawAlbumListGrid();
}

function drawAlbumListGrid() {
    const grid = document.getElementById('albumListGrid');
    if (!grid) return;
    
    const items = window.__albumListItems || [];
    const editOn = typeof window.isSiteEditModeOn === 'function' && window.isSiteEditModeOn();

    grid.innerHTML = '';

    items.forEach((it, idx) => {
        const card = document.createElement('div');
        card.className = 'album-card';
        card.style.position = 'relative';
        card.innerHTML = `
            <div class="album-cover"><img src="${it.cover || 'placeholder.jpg'}" alt=""></div>
            <div class="album-info">
                <h4>${it.shortName || it.name}</h4>
                <p>${it.school || ''}</p>
            </div>
        `;

        card.addEventListener('click', () => {
            window.currentAlbumData = { name: it.name, images: [] }; // Mở qua albumdetail.js
            globalSwitchPage('albumdetail');
        });

        if (editOn) {
            const controls = document.createElement('div');
            controls.className = 'gallery-edit-controls';
            controls.innerHTML = `
                <button type="button" class="gallery-edit-btn" title="Sửa tên / Ảnh bìa"><i class="fa-solid fa-pen"></i></button>
                <button type="button" class="gallery-edit-btn gallery-edit-btn-danger" title="Xóa Album"><i class="fa-solid fa-trash"></i></button>`;
            
            const [btnEdit, btnDelete] = controls.querySelectorAll('button');
            
            btnEdit.addEventListener('click', async (e) => {
                e.stopPropagation();
                const newName = prompt('Tên lớp (VD: 12A1):', it.shortName);
                if (newName !== null) {
                    const newSchool = prompt('Tên trường (VD: THPT Nghệ An):', it.school);
                    it.shortName = newName;
                    it.school = newSchool || '';
                    it.name = `${newName} - ${it.school}`;
                    
                    if(confirm('Bạn có muốn đổi ảnh bìa không?')) {
                        const url = await pickAndUploadImageSimple();
                        if (url) it.cover = url;
                    }
                    
                    drawAlbumListGrid();
                    await saveGalleryItems('site_data', 'album_list', items);
                }
            });

            btnDelete.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (!confirm('Xóa album này? (Ảnh bên trong album cũng sẽ bị ẩn đi)')) return;
                items.splice(idx, 1);
                drawAlbumListGrid();
                await saveGalleryItems('site_data', 'album_list', items);
            });
            card.appendChild(controls);
        }
        grid.appendChild(card);
    });

    if (editOn) {
        const addTile = document.createElement('div');
        addTile.className = 'album-card gallery-add-tile';
        addTile.style.minHeight = '200px';
        addTile.innerHTML = `<div class="gallery-add-tile-inner"><i class="fa-solid fa-plus"></i><span>Tạo Album Lớp</span></div>`;
        addTile.addEventListener('click', async () => {
            const name = prompt('Nhập tên lớp (VD: 12A4):');
            if (!name) return;
            const school = prompt('Nhập tên trường:');
            
            const url = await pickAndUploadImageSimple();
            if (!url) return;

            items.unshift({ name: `${name} - ${school}`, shortName: name, school: school, cover: url });
            drawAlbumListGrid();
            await saveGalleryItems('site_data', 'album_list', items);
        });
        grid.appendChild(addTile);
    }
}

if (typeof registerGalleryEditRefresh === 'function') {
    registerGalleryEditRefresh(() => {
        if(document.getElementById('albumListGrid')) drawAlbumListGrid();
    });
}