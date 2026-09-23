let chosenOutfits = [];

document.addEventListener('DOMContentLoaded', () => {
    initNavigationTabs();    
    initFooterEvents();      
    initZaloCopyEvent(); 
    updateNavbarUser(); 
    initMusicPlayer();
    globalSwitchPage('home');

    // Áp ảnh Admin/Thành viên đã tải lên (nếu có) cho khung banner tĩnh ở header
    if (typeof applySiteImages === 'function') applySiteImages(document);
});

/* ============================================================
   POPUP XEM CHI TIẾT TRANG PHỤC (CÓ TÍNH NĂNG SỬA TRỰC TIẾP TRONG MODAL)
   ============================================================ */
function ensureOutfitDetailModal() {
    if (document.getElementById('outfitDetailModal')) return;
    const modal = document.createElement('div');
    modal.id = 'outfitDetailModal';
    modal.className = 'outfit-detail-modal-overlay';
    modal.innerHTML = `
        <div class="outfit-detail-modal-box">
            <button class="outfit-detail-modal-close" onclick="closeOutfitDetailPopup()"><i class="fa-solid fa-xmark"></i></button>
            <h3 id="outfitDetailModalTitle" class="outfit-detail-modal-title"></h3>
            <div class="outfit-detail-modal-grid">
                <div class="outfit-detail-modal-vertical" style="background: #111; position: relative; min-height: 420px;"><img id="outfitDetailImgVertical" src="" alt=""></div>
                <div class="outfit-detail-modal-horizontals">
                    <div class="outfit-detail-modal-horizontal" style="background: #111; position: relative; min-height: 200px;"><img id="outfitDetailImgHorizontal1" src="" alt=""></div>
                    <div class="outfit-detail-modal-horizontal" style="background: #111; position: relative; min-height: 200px;"><img id="outfitDetailImgHorizontal2" src="" alt=""></div>
                </div>
            </div>
        </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', function (e) {
        if (e.target === modal) closeOutfitDetailPopup();
    });
}

function openOutfitDetailPopup(title, verticalImg, horizontalImg1, horizontalImg2, editCallback = null) {
    ensureOutfitDetailModal();
    const titleEl = document.getElementById('outfitDetailModalTitle');
    const boxV = document.querySelector('.outfit-detail-modal-vertical');
    const boxH1 = document.querySelectorAll('.outfit-detail-modal-horizontal')[0];
    const boxH2 = document.querySelectorAll('.outfit-detail-modal-horizontal')[1];

    const imgV = document.getElementById('outfitDetailImgVertical');
    const imgH1 = document.getElementById('outfitDetailImgHorizontal1');
    const imgH2 = document.getElementById('outfitDetailImgHorizontal2');

    const placeholder = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

    titleEl.innerText = title || '';
    imgV.src = verticalImg || placeholder;
    imgH1.src = horizontalImg1 || placeholder;
    imgH2.src = horizontalImg2 || placeholder;

    document.querySelectorAll('.modal-edit-controls').forEach(el => el.remove());
    titleEl.onclick = null;
    titleEl.style.cursor = 'default';
    titleEl.title = '';
    titleEl.innerHTML = title || '';

    if (typeof isSiteEditModeOn === 'function' && isSiteEditModeOn() && editCallback) {
        titleEl.style.cursor = 'pointer';
        titleEl.title = 'Bấm để đổi tên trang phục';
        titleEl.innerHTML = `${title || ''} <i class="fa-solid fa-pen" style="font-size: 0.8rem; color: var(--gold); margin-left: 8px;"></i>`;
        
        titleEl.onclick = () => {
            const newTitle = prompt("Nhập tên trang phục mới:", title);
            if (newTitle !== null && newTitle.trim() !== "") {
                title = newTitle.trim();
                titleEl.innerHTML = `${title} <i class="fa-solid fa-pen" style="font-size: 0.8rem; color: var(--gold); margin-left: 8px;"></i>`;
                editCallback({ title, verticalImg, horizontalImg1, horizontalImg2 });
            }
        };

        const addControls = (box, imgEl, key, currentUrl) => {
            const controls = document.createElement('div');
            controls.className = 'modal-edit-controls';
            controls.style.cssText = 'position:absolute; inset:0; background:rgba(0,0,0,0.6); display:flex; justify-content:center; align-items:center; gap:15px; opacity:0; transition:0.2s; z-index:10;';
            controls.innerHTML = `
                <button class="btn-edit" style="background:var(--gold); border:none; padding:12px; border-radius:50%; cursor:pointer; font-size:1rem;"><i class="fa-solid fa-camera"></i></button>
                <button class="btn-del" style="background:#ff6b6b; border:none; padding:12px; border-radius:50%; cursor:pointer; color:#fff; font-size:1rem;"><i class="fa-solid fa-trash"></i></button>
            `;
            
            box.onmouseenter = () => controls.style.opacity = '1';
            box.onmouseleave = () => controls.style.opacity = '0';

            controls.querySelector('.btn-edit').onclick = async () => {
                imgEl.style.opacity = '0.4';
                const url = await pickAndUploadImageSimple(); 
                imgEl.style.opacity = '1';
                if (url) {
                    imgEl.src = url;
                    if (key === 'v') verticalImg = url;
                    if (key === 'h1') horizontalImg1 = url;
                    if (key === 'h2') horizontalImg2 = url;
                    editCallback({ title, verticalImg, horizontalImg1, horizontalImg2 });
                }
            };

            controls.querySelector('.btn-del').onclick = () => {
                if(!confirm('Bạn muốn làm trống khung ảnh này?')) return;
                imgEl.src = placeholder;
                if (key === 'v') verticalImg = '';
                if (key === 'h1') horizontalImg1 = '';
                if (key === 'h2') horizontalImg2 = '';
                editCallback({ title, verticalImg, horizontalImg1, horizontalImg2 });
            };

            box.appendChild(controls);
        };

        addControls(boxV, imgV, 'v', verticalImg);
        addControls(boxH1, imgH1, 'h1', horizontalImg1);
        addControls(boxH2, imgH2, 'h2', horizontalImg2);
    }

    document.getElementById('outfitDetailModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeOutfitDetailPopup() {
    const modal = document.getElementById('outfitDetailModal');
    if (modal) modal.classList.remove('show');
    document.body.style.overflow = '';
}

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeOutfitDetailPopup();
});

/* ============================================================
   QUẢN LÝ HIỂN THỊ AVATAR / TRẠNG THÁI ĐĂNG NHẬP TRÊN NAVBAR
   ============================================================ */
function updateNavbarUser() {
    const currentUser = localStorage.getItem('current_logged_in_user') || sessionStorage.getItem('current_logged_in_user');
    const adminUser = localStorage.getItem('grandnang_admin_current_user') || sessionStorage.getItem('grandnang_admin_current_user');
    
    const userProfile = document.getElementById('navUserProfile');
    const userName = document.getElementById('navUserName');
    const avatarImg = document.getElementById('navAvatarImg');
    const accountText = document.getElementById('navAccountText');
    const dropdown = document.getElementById('userDropdownMenu');

    if (adminUser) {
        if (userName) userName.innerText = "Quản Trị Viên";
        if (avatarImg) avatarImg.src = `https://ui-avatars.com/api/?name=Admin&background=dfb76c&color=000&bold=true`;
        if (userProfile) {
            userProfile.style.display = 'flex';
            userProfile.onclick = function() {
                window.location.href = 'admin.html';
            };
            userProfile.title = "Bấm để quay lại trang Quản Trị";
        }
        if (accountText) accountText.style.display = 'none';
        if (dropdown) dropdown.classList.remove('show');
        return;
    }

    if (currentUser) {
        const userData = JSON.parse(localStorage.getItem('grandnang_user_' + currentUser));
        if (userData) {
            const nameParts = userData.fullName.trim().split(' ');
            let displayName = nameParts[nameParts.length - 1]; 
            if (nameParts.length >= 2) {
                displayName = nameParts[nameParts.length - 2] + ' ' + nameParts[nameParts.length - 1];
            }
            
            if (userName) userName.innerText = displayName;
            if (avatarImg) avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=dfb76c&color=000&bold=true`;
            
            if (userProfile) {
                userProfile.style.display = 'flex';
                userProfile.onclick = toggleUserDropdown;
                userProfile.title = ""; 
            }
            if (accountText) accountText.style.display = 'none'; 
        }
    } else {
        if (userProfile) userProfile.style.display = 'none';
        if (accountText) accountText.style.display = 'block';
        if (dropdown) dropdown.classList.remove('show');
    }
}

// XỬ LÝ SPA LOAD TRANG
async function globalSwitchPage(targetPageId) {
    if (targetPageId === 'booking') {
        const currentUser = localStorage.getItem('current_logged_in_user') || sessionStorage.getItem('current_logged_in_user');
        const adminUser = localStorage.getItem('grandnang_admin_current_user') || sessionStorage.getItem('grandnang_admin_current_user');
        
        if (!currentUser && !adminUser) {
            alert('Vui lòng đăng nhập hoặc đăng ký tài khoản lớp trước khi tiến hành đặt lịch nhé!');
            window.pendingBookingRedirect = true;
            targetPageId = 'account';
        }
    }

    if (targetPageId !== 'account' && targetPageId !== 'booking') {
        window.pendingBookingRedirect = false;
    }

    const appRoot = document.getElementById('app-root');
    appRoot.style.opacity = '0';
    
    try {
        const response = await fetch(`${targetPageId}.html`);
        if (!response.ok) throw new Error("File not found");
        const htmlText = await response.text();
        
        appRoot.innerHTML = htmlText;
        
        const tabs = document.querySelectorAll('.nav-tab');
        tabs.forEach(t => t.classList.remove('active'));
        const activeTab = document.querySelector(`.nav-tab[data-page="${targetPageId}"]`);
        if(activeTab) activeTab.classList.add('active');

        if (targetPageId === 'home') {
            initClassFilterEvents();
            if (typeof renderHomeGallery === 'function') renderHomeGallery();
        }
        else if (targetPageId === 'outfits') {
            initFilterEvents();
            initSelectEvents();
            updateSidebarUI();
            if (typeof renderOutfitCategories === 'function') renderOutfitCategories();
        } 
        else if (targetPageId === 'booking') {
            if(typeof initBookingFlow === 'function') initBookingFlow();
        }
        else if (targetPageId === 'account') {
            if(typeof initAccountPage === 'function') initAccountPage();
        }
        else if (targetPageId === 'camnang') {
            if(typeof initCamNangPage === 'function') initCamNangPage();
        }
        else if (targetPageId === 'album') {
            if(typeof renderAlbumPage === 'function') renderAlbumPage();
        }
        else if (targetPageId === 'albumdetail') {
            if(typeof initAlbumDetailPage === 'function') initAlbumDetailPage();
        }

        if (typeof applySiteImages === 'function') applySiteImages(appRoot);

        setTimeout(() => {
            appRoot.style.opacity = '1';
            window.scrollTo({ top: window.innerHeight * 0.45, behavior: 'smooth' });
        }, 50);

    } catch (error) {
        console.error(`[Grandnang SPA] Không tải được trang "${targetPageId}.html":`, error);
        appRoot.innerHTML = `<h3 style="text-align:center; padding: 50px; color: var(--gold);">Đang cập nhật nội dung cho trang ${targetPageId}...</h3>`;
        appRoot.style.opacity = '1';
    }
}

function initNavigationTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    const logo = document.getElementById('navLogo');
    const bookingBtn = document.getElementById('navBookingBtn');

    tabs.forEach(tab => tab.addEventListener('click', e => {
        e.preventDefault(); globalSwitchPage(tab.getAttribute('data-page'));
    }));
    logo.addEventListener('click', e => { e.preventDefault(); globalSwitchPage('home'); });
    bookingBtn.addEventListener('click', e => { e.preventDefault(); globalSwitchPage('booking'); });
}

function initFooterEvents() {
    document.querySelectorAll('.footer-tab-click').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault(); globalSwitchPage(link.getAttribute('data-target')); 
        });
    });
}

function initClassFilterEvents() {
    const classFilterButtons = document.querySelectorAll('.btn-class-filter');
    const classPhotos = document.querySelectorAll('.class-photo-item');
    classFilterButtons.forEach(button => {
        button.addEventListener('click', e => {
            classFilterButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            const selectedClass = e.target.getAttribute('data-class');
            classPhotos.forEach(photo => {
                photo.style.display = (selectedClass === 'all' || photo.getAttribute('data-class') === selectedClass) ? 'block' : 'none';
            });
        });
    });
}

function initFilterEvents() {
    const filterButtons = document.querySelectorAll('.btn-filter');
    const outfitCards = document.querySelectorAll('.outfit-card');
    filterButtons.forEach(button => {
        button.addEventListener('click', e => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            const category = e.target.getAttribute('data-target');
            outfitCards.forEach(card => {
                card.style.display = (category === 'all' || card.getAttribute('data-cat') === category) ? 'block' : 'none';
            });
        });
    });
}

function initSelectEvents() {
    document.querySelectorAll('.btn-select').forEach(button => {
        button.addEventListener('click', e => {
            const outfitName = e.currentTarget.getAttribute('data-name'); 
            if (chosenOutfits.includes(outfitName)) {
                alert(`Bạn đã thêm bộ "${outfitName}" vào danh sách rồi!`); return;
            }
            chosenOutfits.push(outfitName); updateSidebarUI();
        });
    });
}

function updateSidebarUI() {
    const listContainer = document.getElementById('selectedList');
    const bookingForm = document.getElementById('bookingForm');
    const btnGoToBooking = document.getElementById('btnGoToBooking');
    if(!listContainer || !bookingForm) return;

    if (chosenOutfits.length === 0) {
        listContainer.innerHTML = '<p class="empty-text">Chưa có trang phục nào được chọn...</p>';
        bookingForm.style.display = 'none'; return;
    }

    bookingForm.style.display = 'block'; listContainer.innerHTML = ''; 
    chosenOutfits.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'selected-item';
        itemDiv.innerHTML = `<span><i class="fa-solid fa-check text-gold"></i> ${item}</span>
            <button class="btn-remove" data-name="${item}"><i class="fa-solid fa-trash-can"></i></button>`;
        listContainer.appendChild(itemDiv);
    });

    document.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', e => {
            const nameToRemove = e.target.closest('.btn-remove').getAttribute('data-name');
            chosenOutfits = chosenOutfits.filter(outfit => outfit !== nameToRemove);
            updateSidebarUI(); 
        });
    });
    
    if(btnGoToBooking) btnGoToBooking.onclick = () => globalSwitchPage('booking');
}

function initZaloCopyEvent() {
    const zaloBtn = document.getElementById('zaloCopyBtn');
    const tooltip = document.getElementById('zaloTooltip');
    if (!zaloBtn || !tooltip) return;
    zaloBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(document.getElementById('zaloNumber').innerText).then(() => {
            tooltip.classList.add('show'); setTimeout(() => tooltip.classList.remove('show'), 2000);
        });
    });
}

window.goToProcessStep = function(stepNum) {
    document.querySelectorAll('.process-step-section').forEach(el => { el.classList.remove('active'); });
    const targetStep = document.getElementById('step-' + stepNum);
    if(targetStep) targetStep.classList.add('active');

    document.querySelectorAll('.tracker-step').forEach((el, index) => {
        if (index < stepNum) { el.classList.add('active'); } 
        else { el.classList.remove('active'); }
    });
    
    const container = document.querySelector('.process-tracker-container');
    if(container) container.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.selectProcessStyle = function(element) {
    document.querySelectorAll('.style-card').forEach(card => { card.classList.remove('selected'); });
    element.classList.add('selected');
    setTimeout(function() { goToProcessStep(2); }, 400);
};

document.addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('btn-select-pkg')) {
        e.preventDefault();
        const allPackageBtns = document.querySelectorAll('.btn-select-pkg');
        allPackageBtns.forEach(btn => {
            btn.classList.remove('active');
            btn.innerText = 'Chọn gói này';
        });
        
        e.target.classList.add('active');
        e.target.innerText = 'Đã chọn gói này';
        window.chosenBookingPackage = e.target.getAttribute('data-pkg');
    }
});

function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdownMenu');
    if (dropdown) dropdown.classList.toggle('show');
}

window.addEventListener('click', function(e) {
    const profile = document.getElementById('navUserProfile');
    const dropdown = document.getElementById('userDropdownMenu');
    if (profile && dropdown) {
        if (!profile.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    }
});

async function goToAccountTab(tab) {
    const dropdown = document.getElementById('userDropdownMenu');
    if (dropdown) dropdown.classList.remove('show');
    
    await globalSwitchPage('account');
    
    setTimeout(() => {
        if(typeof switchDashTab === 'function') switchDashTab(tab);
    }, 50);
}

function getStoredAlbums() {
    try {
        const custom = localStorage.getItem('grandnang_custom_albums');
        if (custom) return JSON.parse(custom);
    } catch(e) {}
    
    return [
        { id: 'al-1', name: '12A1 - THPT Chuyên Lê Quý Đôn', cover: 'album-12a1-cover.jpg', images: ['album-12a1-01.jpg','album-12a1-02.jpg'] },
        { id: 'al-2', name: '12A2 - THPT Huỳnh Thúc Kháng', cover: 'album-12a2-cover.jpg', images: ['album-12a2-01.jpg','album-12a2-02.jpg'] },
        { id: 'al-3', name: '12A3 - THPT Nghệ An', cover: 'album-12a3-cover.jpg', images: ['album-12a3-01.jpg','album-12a3-02.jpg'] }
    ];
}

function saveStoredAlbums(albums) {
    localStorage.setItem('grandnang_custom_albums', JSON.stringify(albums));
}

function getStoredOutfits() {
    try {
        const custom = localStorage.getItem('grandnang_custom_outfits');
        if (custom) return JSON.parse(custom);
    } catch(e) {}

    return {
        traditional: [
            { id: 'out-1', name: 'Áo dài', price: '+80.000đ / bộ', img: 'ao-dai.jpg', vImg: 'ao-dai.jpg', hImg1: 'ao-dai.jpg', hImg2: 'ao-dai.jpg' },
            { id: 'out-2', name: 'Vest 6 cúc', price: '+80.000đ / áo', img: 'vest-6-cuc.jpg', vImg: 'vest-6-cuc.jpg', hImg1: 'vest-6-cuc.jpg', hImg2: 'vest-6-cuc.jpg' }
        ],
        concept: [
            { id: 'out-3', name: 'Thái Lan', price: 'Tùy chọn', img: 'thai-lan.jpg', vImg: 'thai-lan.jpg', hImg1: 'thai-lan.jpg', hImg2: 'thai-lan.jpg' }
        ],
        vest: [
            { id: 'out-4', name: 'Vest thanh xuân Xám', price: '+80.000đ / áo', img: 'vest-xam.jpg', vImg: 'vest-xam.jpg', hImg1: 'vest-xam.jpg', hImg2: 'vest-xam.jpg' }
        ]
    };
}

function saveStoredOutfits(outfits) {
    localStorage.setItem('grandnang_custom_outfits', JSON.stringify(outfits));
}

function isAdminOrMemberLoggedIn() {
    const adminUser = localStorage.getItem('grandnang_admin_current_user') || sessionStorage.getItem('grandnang_admin_current_user');
    return !!adminUser;
}

/* ============================================================
   HÀM XỬ LÝ GỬI ĐƠN ĐẶT LỊCH LÊN FIREBASE (ĐỂ ADMIN NHẬN ĐƯỢC)
   ============================================================ */
async function handleBookingSubmit(event) {
    if (event) event.preventDefault();

    const bookingData = {
        customerName: document.getElementById('cusName')?.value || 'Không rõ',
        customerPhone: document.getElementById('cusPhone')?.value || 'Không rõ',
        className: document.getElementById('cusClassName')?.value || 'Lớp kỷ yếu',
        packageName: window.chosenBookingPackage || 'Gói tiêu chuẩn',
        selectedOutfits: chosenOutfits || [],
        bookingDate: document.getElementById('bookingDate')?.value || 'Chưa chọn',
        depositStatus: 'Chưa cọc',
        createdAt: new Date()
    };

    try {
        if (typeof db !== 'undefined' && db.collection) {
            const docRef = await db.collection("bookings").add(bookingData);
            console.log("Đã lưu đơn lên Firebase thành công với ID:", docRef.id);
        } else {
            console.warn("Chưa khởi tạo kết nối Firebase db!");
        }

        let existingOrders = JSON.parse(localStorage.getItem('grandnang_bookings') || '[]');
        existingOrders.push(bookingData);
        localStorage.setItem('grandnang_bookings', JSON.stringify(existingOrders));

        alert("Gửi đơn đặt lịch thành công! Studio đã nhận được thông tin của lớp.");
        
        if (typeof goToProcessStep === 'function') {
            goToProcessStep(5);
        }

    } catch (error) {
        console.error("Lỗi khi gửi đơn lên hệ thống:", error);
        alert("Có lỗi kết nối mạng, vui lòng kiểm tra lại và thử gửi lại đơn!");
    }
}

/* ============================================================
   TRÌNH PHÁT NHẠC NỀN
   ============================================================ */
function initMusicPlayer() {
    const bgMusic = document.getElementById('bgMusic');
    const musicBtn = document.getElementById('musicToggleBtn');
    if (!bgMusic || !musicBtn) return;

    bgMusic.volume = 0.4; 

    const playMusic = () => {
        bgMusic.play().then(() => {
            musicBtn.classList.add('playing');
            musicBtn.innerHTML = '<i class="fa-solid fa-music"></i>';
        }).catch(() => {
        });
    };

    const autoPlayOnFirstInteraction = () => {
        if (bgMusic.paused) {
            playMusic();
        }
        document.removeEventListener('click', autoPlayOnFirstInteraction);
    };
    document.addEventListener('click', autoPlayOnFirstInteraction);

    musicBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        if (bgMusic.paused) {
            playMusic();
        } else {
            bgMusic.pause();
            musicBtn.classList.remove('playing');
            musicBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
        }
    });
}