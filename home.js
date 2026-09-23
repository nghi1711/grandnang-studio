let currentSlideIndex = 0;
let slideInterval;

function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-dot');
    
    if (slides.length === 0) return;

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        currentSlideIndex = (index + slides.length) % slides.length;
        
        slides[currentSlideIndex].classList.add('active');
        if (dots[currentSlideIndex]) {
            dots[currentSlideIndex].classList.add('active');
        }
    }

    function nextSlide() {
        showSlide(currentSlideIndex + 1);
    }

    if (slideInterval) clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 4500);

    window.currentSlide = function(index) {
        showSlide(index);
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 4500);
    }
}

function initHomeAnimations() {
    initHeroSlider();

    const scrollElements = document.querySelectorAll('.scroll-trigger');

    const elementInView = (el, dividend = 1) => {
        const elementTop = el.getBoundingClientRect().top;
        return (elementTop <= (window.innerHeight || document.documentElement.clientHeight) / dividend);
    };

    const displayScrollElement = (element) => {
        element.classList.add('visible');
    };

    const handleScrollAnimation = () => {
        scrollElements.forEach((el) => {
            if (elementInView(el, 1.15)) {
                displayScrollElement(el);
            }
        });
    }

    window.addEventListener('scroll', () => {
        handleScrollAnimation();
    });

    handleScrollAnimation();
}

document.addEventListener('DOMContentLoaded', () => {
    initHomeAnimations();
});

/* ============================================================
   KHO ẢNH THANH XUÂN — render động + Admin/Thành viên thêm/sửa/xoá
   ảnh trực tiếp khi bật "Chế độ sửa ảnh" (nút góc dưới phải, xử lý
   chung ở image-manager.js). Dữ liệu lưu tại Firestore
   collection "home_gallery", doc "main", field items[].
   Danh sách mặc định bên dưới giữ nguyên bộ ảnh gốc của trang.
   ============================================================ */
const HOME_GALLERY_DEFAULT_RAW = [
    ['fe.jpg', 'Khoảnh Khắc Rực Rỡ', 'tall'],
    ['uer.jpg', 'Nụ Cười Sân Trường', ''],
    ['que12.jpg', 'Tà Áo Dài Thướt Tha', 'wide'],
    ['que.jpg', 'Tuổi 18 Mộng Mơ', 'big'],
    ['qu.jpg', 'Góc Sân & Khoảng Trời', 'tall'],
    ['qy.jpg', 'Hành Trình Thanh Xuân', ''],
    ['qt.jpg', 'Đêm Pháo Hoa Rực Rỡ', 'wide'],
    ['qr.jpg', 'Kỷ Nguyên Cool Ngầu', 'tall'],
    ['qe.jpg', 'Nàng Thơ Vintage', ''],
    ['qw.jpg', 'Tập Thể Lớp', 'wide'],
    ['q9.jpg', 'Bảng Đen Kỷ Niệm', 'tall'],
    ['q8.jpg', 'Cầu Thang Thời Gian', ''],
    ['q7.jpg', 'Nắng Sân Trường', 'wide'],
    ['q6.jpg', 'Hành Lang Ký Ức', ''],
    ['q5.jpg', 'Sắc Màu Prom Night', 'tall'],
    ['q4.jpg', 'Thanh Xuân Không Tên', 'big'],
    ['q3.jpg', 'Chiếc Ghế Cuối Lớp', ''],
    ['q2.jpg', 'Mùa Hoa Phượng', 'wide'],
    ['q1.jpg', 'Cửa Sổ Lớp Học', 'tall'],
    ['qq.jpg', 'Nụ Cười Tỏa Sáng', ''],
    ['m.jpg', 'Khoảnh Khắc Đẹp Nhất', 'wide'],
    ['n.jpg', 'Bức Ảnh Tri Kỷ', 'tall'],
    ['b.jpg', 'Tiếng Trống Trường', ''],
    ['v.jpg', 'Hành Trình Mới', 'big'],
    ['c.jpg', 'Kỷ Niệm Ngày Chia Tay', ''],
    ['x.jpg', 'Sân Cỏ Xanh Mướt', 'wide'],
    ['z.jpg', 'Tà Áo Trắng Bay', 'tall'],
    ['l.jpg', 'Họp Lớp Vui Vẻ', ''],
    ['k.jpg', 'Chuyến Đi Thanh Xuân', 'wide'],
    ['i.jpg', 'Phút Giây Lắng Đọng', 'tall'],
    ['h.jpg', 'Thanh Xuân Rực Rỡ', ''],
    ['g.jpg', 'Nụ Cười Sân Trường', 'wide'],
    ['d.jpg', 'Góc Sân & Khoảng Trời', 'tall'],
    ['a.jpg', 'Tuổi 18 Mộng Mơ', ''],
    ['p.jpg', 'Đêm Pháo Hoa Rực Rỡ', 'wide'],
    ['o.jpg', 'Kỷ Nguyên Cool Ngầu', 'tall'],
    ['j.jpg', 'Nàng Thơ Vintage', ''],
    ['u.jpg', 'Tập Thể Lớp', 'wide'],
    ['y.jpg', 'Bảng Đen Kỷ Niệm', 'tall'],
    ['t.jpg', 'Cầu Thang Thời Gian', ''],
    ['r.jpg', 'Nắng Sân Trường', 'wide'],
    ['e.jpg', 'Hành Lang Ký Ức', 'tall'],
    ['w.jpg', 'Sắc Màu Prom Night', ''],
    ['fill-1.jpg', 'Nét Cười Rạng Rỡ', ''],
    ['fill-2.jpg', 'Khung Hình Đáng Nhớ', 'wide'],
    ['fill-3.jpg', 'Tia Nắng Cuối Ngày', ''],
    ['fill-4.jpg', 'Dấu Ấn Thanh Xuân', 'tall'],
    ['fill-5.jpg', 'Nụ Cười Tuổi 18', ''],
    ['fill-6.jpg', 'Khoảnh Khắc Cuối Cấp', ''],
    ['fill-7.jpg', 'Cả Lớp Bên Nhau', 'wide'],
    ['fill-8.jpg', 'Bức Ảnh Đáng Giá', ''],
    ['fill-9.jpg', 'Nắng Ban Mai', ''],
    ['fill-10.jpg', 'Thanh Xuân Vẹn Nguyên', 'tall'],
    ['fill-11.jpg', 'Kết Thúc Đẹp', ''],
    ['fill-12.jpg', 'Góc Máy Yêu Thích', ''],
    ['fill-13.jpg', 'Chiều Tan Trường', 'wide'],
    ['fill-14.jpg', 'Ảnh Kỷ Yếu Đẹp', ''],
    ['fill-15.jpg', 'Lưu Giữ Thanh Xuân', ''],
    ['fill-16.jpg', 'Nét Thanh Xuân Riêng', ''],
    ['fill-17.jpg', 'Mỗi Khung Hình Một Kỷ Niệm', ''],
    ['fill-18.jpg', 'Cuối Cấp Rực Rỡ', ''],
    ['fill-19.jpg', 'Tuổi Trẻ Rực Rỡ', 'wide'],
    ['fill-20.jpg', 'Ký Ức Không Phai', '']
];

function buildHomeGalleryDefaults() {
    return HOME_GALLERY_DEFAULT_RAW.map(([url, title, size]) => ({
        id: 'default-' + url, url, title, size
    }));
}

async function renderHomeGallery() {
    const grid = document.getElementById('homeGalleryGrid');
    if (!grid) return;
    window.__homeGalleryItems = await loadGalleryItems('home_gallery', 'main', buildHomeGalleryDefaults());
    drawHomeGalleryGrid();
}

function drawHomeGalleryGrid() {
    const grid = document.getElementById('homeGalleryGrid');
    if (!grid) return;
    const items = window.__homeGalleryItems || [];
    const editOn = typeof window.isSiteEditModeOn === 'function' && window.isSiteEditModeOn();

    grid.innerHTML = '';

    items.forEach((it, idx) => {
        const tile = document.createElement('div');
        tile.className = 'masonry-item ' + (it.size || '');
        tile.innerHTML = `<img src="${it.url}" alt=""><div class="masonry-overlay"><h4></h4></div>`;
        tile.querySelector('h4').textContent = it.title || '';

        if (editOn) {
            const controls = document.createElement('div');
            controls.className = 'gallery-edit-controls';
            controls.innerHTML = `
                <button type="button" class="gallery-edit-btn" title="Đổi ảnh"><i class="fa-solid fa-camera"></i></button>
                <button type="button" class="gallery-edit-btn gallery-edit-btn-danger" title="Xóa"><i class="fa-solid fa-trash"></i></button>`;
            const [btnEdit, btnDelete] = controls.querySelectorAll('button');
            btnEdit.addEventListener('click', (e) => { e.stopPropagation(); editHomeGalleryItem(idx); });
            btnDelete.addEventListener('click', (e) => { e.stopPropagation(); deleteHomeGalleryItem(idx); });
            tile.appendChild(controls);
        }

        grid.appendChild(tile);
    });

    if (editOn) {
        const addTile = document.createElement('div');
        addTile.className = 'masonry-item gallery-add-tile';
        addTile.innerHTML = `<div class="gallery-add-tile-inner"><i class="fa-solid fa-plus"></i><span>Thêm ảnh</span></div>`;
        addTile.addEventListener('click', addHomeGalleryItem);
        grid.appendChild(addTile);
    }
}

async function addHomeGalleryItem() {
    const result = await pickAndUploadGalleryImage();
    if (!result) return;
    window.__homeGalleryItems.push({ id: galleryItemId(), url: result.url, title: '', size: result.size });
    drawHomeGalleryGrid();
    await saveGalleryItems('home_gallery', 'main', window.__homeGalleryItems);
}

async function editHomeGalleryItem(idx) {
    const result = await pickAndUploadGalleryImage();
    if (!result) return;
    window.__homeGalleryItems[idx].url = result.url;
    window.__homeGalleryItems[idx].size = result.size;
    drawHomeGalleryGrid();
    await saveGalleryItems('home_gallery', 'main', window.__homeGalleryItems);
}

async function deleteHomeGalleryItem(idx) {
    if (!confirm('Xóa ảnh này khỏi Kho ảnh Trang chủ?')) return;
    window.__homeGalleryItems.splice(idx, 1);
    drawHomeGalleryGrid();
    await saveGalleryItems('home_gallery', 'main', window.__homeGalleryItems);
}

if (typeof registerGalleryEditRefresh === 'function') registerGalleryEditRefresh(drawHomeGalleryGrid);