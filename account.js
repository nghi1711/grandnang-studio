let tempUserData = null; 

// Bật/tắt hiện mật khẩu khi bấm icon con mắt (dùng chung cho mọi ô mật khẩu trong trang Tài khoản)
function togglePasswordVisibility(inputId, iconEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        iconEl.classList.remove('fa-eye');
        iconEl.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        iconEl.classList.remove('fa-eye-slash');
        iconEl.classList.add('fa-eye');
    }
}

function initAccountPage() { 
    checkLoginStatus(); 
}

function switchAuthTab(tab) {
    const tabContainer = document.getElementById('authTabsContainer');
    if(tabContainer) tabContainer.style.display = 'flex'; 

    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    if(tab === 'login') {
        document.querySelectorAll('.auth-tab')[0].classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.querySelectorAll('.auth-tab')[1].classList.add('active');
        document.getElementById('registerForm').classList.add('active');
    }
}

function handleRegister(e) {
    e.preventDefault();

    // Kiểm tra Mật khẩu và Nhập lại mật khẩu phải trùng khớp trước khi tạo tài khoản
    const regPassVal = document.getElementById('regPassword').value;
    const regPassConfirmVal = document.getElementById('regPasswordConfirm').value;
    if (regPassVal !== regPassConfirmVal) {
        alert("Mật khẩu nhập lại không khớp, vui lòng kiểm tra lại!");
        return;
    }

    tempUserData = {
        fullName: document.getElementById('regFullName').value,
        className: document.getElementById('regClass').value,
        role: document.getElementById('regRole').value,
        username: document.getElementById('regUsername').value,
        pass: regPassVal,
        email: document.getElementById('regEmail').value,
        phone: document.getElementById('regPhone').value,
        bookings: []
    };

    if(localStorage.getItem('grandnang_user_' + tempUserData.username)) {
        alert("Tên đăng nhập này đã tồn tại, vui lòng chọn tên khác!");
        return;
    }

    document.getElementById('authTabsContainer').style.display = 'none';
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.getElementById('otpForm').classList.add('active');
    document.getElementById('showRegEmail').innerText = tempUserData.email;
    
    alert(`Mã xác nhận đã được gửi tự động đến Gmail: ${tempUserData.email}`);
}

function handleVerifyOTP(e) {
    e.preventDefault();
    const otpInp = document.getElementById('regOtpCode').value;
    
    if (otpInp === "123456") {
        localStorage.setItem('grandnang_user_' + tempUserData.username, JSON.stringify(tempUserData));
        alert("Xác thực Gmail thành công! Tài khoản lớp đã được khởi tạo.");
        
        document.getElementById('registerForm').reset();
        document.getElementById('otpForm').reset();
        tempUserData = null;
        switchAuthTab('login');
        
        // Cập nhật thanh Navbar
        if (typeof updateNavbarUser === 'function') updateNavbarUser(); 
    } else {
        alert("Mã xác nhận OTP không chính xác. Vui lòng thử lại!");
    }
}

// Tìm tài khoản Lớp (khách hàng) theo TÊN ĐĂNG NHẬP hoặc SỐ ĐIỆN THOẠI, để hỗ trợ đăng nhập bằng 1 trong 2.
// Lưu ý: Tài khoản Admin/Thành viên KHÔNG có trường SĐT nên không áp dụng hàm này, chỉ áp dụng cho tài khoản Lớp.
function findCustomerAccountByLogin(loginInput) {
    // Ưu tiên khớp theo username trước (tra thẳng bằng key localStorage, nhanh nhất)
    const directMatch = localStorage.getItem('grandnang_user_' + loginInput);
    if (directMatch) return JSON.parse(directMatch);

    // Không khớp username -> quét toàn bộ tài khoản Lớp để tìm theo Số điện thoại
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('grandnang_user_')) {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                if (data && data.phone === loginInput) return data;
            } catch (err) { /* bỏ qua key bị lỗi định dạng */ }
        }
    }
    return null;
}

function handleLogin(e) {
    e.preventDefault();
    const userInp = document.getElementById('loginUsername').value.trim();
    const passInp = document.getElementById('loginPassword').value;

    // 1) Ưu tiên kiểm tra xem đây có phải tài khoản QUẢN TRỊ (Admin/Thành viên nội bộ) không.
    // Nếu đúng, tự đăng nhập vào khu vực quản trị luôn, không cần đăng nhập lại ở admin.html.
    // (Tài khoản quản trị chỉ có username, không có SĐT, nên chỉ so khớp theo username.)
    let adminAccounts = [];
    try {
        adminAccounts = JSON.parse(localStorage.getItem('grandnang_admin_accounts') || '[]');
    } catch (err) { adminAccounts = []; }

    const adminMatch = adminAccounts.find(a =>
        a.username.toLowerCase() === userInp.toLowerCase() && a.password === passInp
    );

    if (adminMatch) {
        sessionStorage.setItem('grandnang_admin_current_user', adminMatch.username);
        alert(`Xin chào ${adminMatch.fullName || adminMatch.username}! Đang chuyển vào khu vực Quản Trị...`);
        window.location.href = 'admin.html';
        return;
    }

    // 2) Không phải tài khoản quản trị -> kiểm tra tài khoản Lớp (khách hàng), cho phép đăng nhập bằng username HOẶC SĐT
    const userData = findCustomerAccountByLogin(userInp);

    if(userData && userData.pass === passInp) {
        sessionStorage.setItem('current_logged_in_user', userData.username);

        // Cập nhật thanh Navbar
        if (typeof updateNavbarUser === 'function') updateNavbarUser();

        // Nếu người dùng bị chuyển sang đăng nhập từ nút Đặt Lịch, tự động đưa thẳng vào Booking
        if (window.pendingBookingRedirect) {
            window.pendingBookingRedirect = false;
            globalSwitchPage('booking');
        } else {
            checkLoginStatus();
        }
    } else {
        alert("Tên đăng nhập hoặc mật khẩu không chính xác!");
    }
}

function handleChangePassword(e) {
    e.preventDefault();
    const currentUser = sessionStorage.getItem('current_logged_in_user');
    if(!currentUser) return;
    
    let userData = JSON.parse(localStorage.getItem('grandnang_user_' + currentUser));
    const oldPass = document.getElementById('oldPass').value;
    const newPass = document.getElementById('newPass').value;

    if (userData.pass !== oldPass) {
        alert("Mật khẩu cũ không chính xác!");
        return;
    }

    userData.pass = newPass;
    localStorage.setItem('grandnang_user_' + currentUser, JSON.stringify(userData));
    alert("Cập nhật mật khẩu mới thành công!");
    document.getElementById('changePassForm').reset();
}

function handleLogout() {
    sessionStorage.removeItem('current_logged_in_user');
    checkLoginStatus();
    
    // Cập nhật thanh Navbar
    if (typeof updateNavbarUser === 'function') updateNavbarUser(); 
}

function checkLoginStatus() {
    const currentUser = sessionStorage.getItem('current_logged_in_user');
    const authSec = document.getElementById('authSection');
    const dashSec = document.getElementById('dashboardSection');
    if(!authSec || !dashSec) return;

    if(currentUser) {
        authSec.style.display = 'none';
        dashSec.style.display = 'block';
        
        const userData = JSON.parse(localStorage.getItem('grandnang_user_' + currentUser));
        document.getElementById('dashFullName').innerText = userData.fullName;
        document.getElementById('dashClass').innerText = userData.className;
        document.getElementById('dashRole').innerText = userData.role;
        document.getElementById('dashUsername').innerText = userData.username;
        document.getElementById('dashPhone').innerText = userData.phone;
        document.getElementById('dashEmail').innerText = userData.email;

        const bookingList = document.getElementById('bookingListContainer');
        bookingList.innerHTML = '';
        if(userData.bookings && userData.bookings.length > 0) {
            userData.bookings.forEach(bk => {
                bookingList.innerHTML += `
                    <div class="booking-item">
                        <span class="status"><i class="fa-solid fa-circle-check"></i> Đã Ghi Nhận</span>
                        <h4>Ngày chụp: ${bk.date}</h4>
                        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 5px;"><strong>Gói:</strong> ${bk.package}</p>
                        <p style="color: var(--text-muted); font-size: 0.9rem;"><strong>Địa điểm:</strong> ${bk.school}</p>
                    </div>`;
            });
        } else {
            bookingList.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">Chưa có lịch đặt nào.</p>';
        }
    } else {
        authSec.style.display = 'block';
        dashSec.style.display = 'none';
    }
}

// XỬ LÝ CHUYỂN TAB TRONG DASHBOARD
function switchDashTab(tab) {
    document.querySelectorAll('.dash-content-pane').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.dash-tab-btn').forEach(btn => {
        btn.style.background = '#021a15';
        btn.style.borderColor = 'var(--border-color)';
        btn.style.color = 'var(--text-muted)';
    });
    
    if (tab === 'info') {
        document.getElementById('dash-info').style.display = 'block';
        const btn = document.getElementById('btnTabInfo');
        if(btn) { btn.style.background = 'rgba(223,183,108,0.1)'; btn.style.borderColor = 'var(--gold)'; btn.style.color = 'var(--gold)'; }
    } else if (tab === 'password') {
        document.getElementById('dash-password').style.display = 'block';
        const btn = document.getElementById('btnTabPass');
        if(btn) { btn.style.background = 'rgba(223,183,108,0.1)'; btn.style.borderColor = 'var(--gold)'; btn.style.color = 'var(--gold)'; }
    }
}