let chosenOutfits = [];

document.addEventListener('DOMContentLoaded', () => {
    initHeroSlider();        
    initNavigationTabs();    
    initFooterEvents();      
    initClassFilterEvents(); 
    initFilterEvents();      
    initSelectEvents();      
    initSubmitEvent();       
    initZaloCopyEvent(); // Khởi tạo tính năng sao chép Zalo tự động
});

function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    if (slides.length <= 1) return;

    let currentSlideIndex = 0;
    const slideIntervalTime = 4000; 

    function nextSlide() {
        slides[currentSlideIndex].classList.remove('active');
        currentSlideIndex = (currentSlideIndex + 1) % slides.length;
        slides[currentSlideIndex].classList.add('active');
    }

    setInterval(nextSlide, slideIntervalTime);
}

function globalSwitchPage(targetPageId) {
    const sections = document.querySelectorAll('.page-section');
    const tabs = document.querySelectorAll('.nav-tab');

    sections.forEach(sec => sec.style.display = 'none');
    
    const activeSection = document.getElementById(`page-${targetPageId}`);
    if(activeSection) activeSection.style.display = 'block';

    tabs.forEach(t => t.classList.remove('active'));
    const activeTab = document.querySelector(`.nav-tab[data-page="${targetPageId}"]`);
    if(activeTab) activeTab.classList.add('active');

    window.scrollTo({ top: window.innerHeight * 0.45, behavior: 'smooth' });
}

function initNavigationTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    const logo = document.getElementById('navLogo');
    const bookingBtn = document.getElementById('navBookingBtn');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = tab.getAttribute('data-page');
            globalSwitchPage(targetPage);
        });
    });

    logo.addEventListener('click', (e) => {
        e.preventDefault();
        globalSwitchPage('home');
    });

    bookingBtn.addEventListener('click', (e) => {
        e.preventDefault();
        globalSwitchPage('outfits');
        setTimeout(() => {
            const form = document.getElementById('bookingForm');
            if(form) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    });
}

function initFooterEvents() {
    const footerTabs = document.querySelectorAll('.footer-tab-click');
    footerTabs.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.getAttribute('data-target');
            globalSwitchPage(targetPage); 
        });
    });
}

function initClassFilterEvents() {
    const classFilterButtons = document.querySelectorAll('.btn-class-filter');
    const classPhotos = document.querySelectorAll('.class-photo-item');

    classFilterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            classFilterButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            const selectedClass = e.target.getAttribute('data-class');

            classPhotos.forEach(photo => {
                const targetPhotoClass = photo.getAttribute('data-class');
                if (selectedClass === 'all' || targetPhotoClass === selectedClass) {
                    photo.style.display = 'block';
                } else {
                    photo.style.display = 'none';
                }
            });
        });
    });
}

function initFilterEvents() {
    const filterButtons = document.querySelectorAll('.btn-filter');
    const outfitCards = document.querySelectorAll('.outfit-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            const category = e.target.getAttribute('data-target');
            outfitCards.forEach(card => {
                const cardCat = card.getAttribute('data-cat');
                if (category === 'all' || cardCat === category) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

function initSelectEvents() {
    const selectButtons = document.querySelectorAll('.btn-select');
    
    selectButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const outfitName = e.target.getAttribute('data-name');
            if (chosenOutfits.includes(outfitName)) {
                alert(`Bạn đã thêm bộ "${outfitName}" vào danh sách rồi!`);
                return;
            }
            chosenOutfits.push(outfitName);
            updateSidebarUI();
        });
    });
}

function updateSidebarUI() {
    const listContainer = document.getElementById('selectedList');
    const bookingForm = document.getElementById('bookingForm');
    
    if (chosenOutfits.length === 0) {
        listContainer.innerHTML = '<p class="empty-text">Chưa có trang phục nào được chọn...</p>';
        bookingForm.style.display = 'none';
        return;
    }

    bookingForm.style.display = 'block';
    listContainer.innerHTML = ''; 

    chosenOutfits.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'selected-item';
        itemDiv.innerHTML = `
            <span><i class="fa-solid fa-check text-gold"></i> ${item}</span>
            <button class="btn-remove" data-name="${item}"><i class="fa-solid fa-trash-can"></i></button>
        `;
        listContainer.appendChild(itemDiv);
    });

    const removeButtons = listContainer.querySelectorAll('.btn-remove');
    removeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetBtn = e.target.closest('.btn-remove');
            const nameToRemove = targetBtn.getAttribute('data-name');
            chosenOutfits = chosenOutfits.filter(outfit => outfit !== nameToRemove);
            updateSidebarUI(); 
        });
    });
}

function initSubmitEvent() {
    const submitBtn = document.getElementById('btnSubmitAll');
    
    submitBtn.addEventListener('click', () => {
        const name = document.getElementById('custName').value.trim();
        const phone = document.getElementById('custPhone').value.trim();

        if (!name || !phone) {
            alert("Vui lòng điền đầy đủ Tên và Số điện thoại để Studio liên hệ nhé!");
            return;
        }

        const orderData = {
            customerName: name,
            customerPhone: phone,
            selectedOutfits: chosenOutfits,
            createdAt: new Date().toISOString()
        };

        alert(`🎉 Đăng ký thành công!\nStudio đã nhận được yêu cầu của bạn.\n\nThông tin gửi đi:\n${JSON.stringify(orderData, null, 2)}`);
        chosenOutfits = [];
        document.getElementById('custName').value = '';
        document.getElementById('custPhone').value = '';
        updateSidebarUI();
    });
}

/* XỬ LÝ CLICK COPY SỐ ĐIỆN THOẠI VÀ HIỂN THỊ TOOLTIP MƯỢT MÀ */
function initZaloCopyEvent() {
    const zaloBtn = document.getElementById('zaloCopyBtn');
    const zaloText = document.getElementById('zaloNumber').innerText;
    const tooltip = document.getElementById('zaloTooltip');

    if (!zaloBtn || !tooltip) return;

    zaloBtn.addEventListener('click', () => {
        // Sao chép chuỗi số điện thoại vào bộ nhớ đệm
        navigator.clipboard.writeText(zaloText).then(() => {
            // Hiện chữ "Đã sao chép!"
            tooltip.classList.add('show');
            
            // Tự động ẩn thông báo sau 2 giây
            setTimeout(() => {
                tooltip.classList.remove('show');
            }, 2000);
        }).catch(err => {
            console.error('Không thể sao chép số Zalo: ', err);
        });
    });
}