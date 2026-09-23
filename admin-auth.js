/* ============================================================
   ADMIN-AUTH.JS — Dùng localStorage để đồng bộ phiên đăng nhập
   ============================================================ */

const ADMIN_ACCOUNTS_KEY = 'grandnang_admin_accounts';
const ADMIN_SESSION_KEY = 'grandnang_admin_current_user';

window.togglePasswordVisibility = function (inputId, iconEl) {
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
};

function getAdminAccounts() {
    try {
        return JSON.parse(localStorage.getItem(ADMIN_ACCOUNTS_KEY) || '[]');
    } catch (e) {
        return [];
    }
}

function saveAdminAccounts(accounts) {
    localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(accounts));
}

function ensureDefaultAdminAccount() {
    const accounts = getAdminAccounts();
    if (accounts.length === 0) {
        accounts.push({
            username: 'admin',
            password: 'Grandnang@2026',
            fullName: 'Quản Trị Viên',
            role: 'admin',
            createdAt: new Date().toISOString().split('T')[0]
        });
        saveAdminAccounts(accounts);
    }
}

function getCurrentAdminAccount() {
    const username = localStorage.getItem(ADMIN_SESSION_KEY) || sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!username) return null;
    return getAdminAccounts().find(a => a.username === username) || null;
}

window.isMemberOnly = function() {
    const acc = getCurrentAdminAccount();
    return acc && acc.role === 'member';
};

window.handleAdminLogin = function (e) {
    e.preventDefault();
    const username = document.getElementById('adminLoginUsername').value.trim();
    const password = document.getElementById('adminLoginPassword').value;

    const account = getAdminAccounts().find(a =>
        a.username.toLowerCase() === username.toLowerCase() && a.password === password
    );

    if (account) {
        localStorage.setItem(ADMIN_SESSION_KEY, account.username);
        sessionStorage.setItem(ADMIN_SESSION_KEY, account.username);
        document.getElementById('adminLoginForm').reset();
        showAdminDashboard(account);
        return;
    }

    let customerAccount = null;
    try {
        const directRaw = localStorage.getItem('grandnang_user_' + username);
        if (directRaw) {
            customerAccount = JSON.parse(directRaw);
        } else {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('grandnang_user_')) {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data && data.phone === username) { customerAccount = data; break; }
                }
            }
        }
    } catch (e) { customerAccount = null; }

    if (customerAccount && customerAccount.pass === password) {
        alert('Đây là tài khoản Lớp (khách hàng), không phải tài khoản Quản trị. Đang chuyển bạn về trang chính...');
        localStorage.setItem('current_logged_in_user', customerAccount.username);
        window.location.href = 'index.html';
        return;
    }

    alert('Tên đăng nhập hoặc mật khẩu không chính xác!');
};

window.handleAdminLogout = function () {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    const loginScreen = document.getElementById('adminLoginScreen');
    const container = document.getElementById('adminContainer');
    if (container) container.style.display = 'none';
    if (loginScreen) loginScreen.style.display = 'flex';
};

function checkAdminLoginStatus() {
    const loginScreen = document.getElementById('adminLoginScreen');
    const container = document.getElementById('adminContainer');
    if (!loginScreen || !container) return;

    const account = getCurrentAdminAccount();
    if (account) {
        showAdminDashboard(account);
    } else {
        container.style.display = 'none';
        loginScreen.style.display = 'flex';
    }
}

function showAdminDashboard(account) {
    const loginScreen = document.getElementById('adminLoginScreen');
    const container = document.getElementById('adminContainer');
    const nameEl = document.getElementById('adminCurrentUserName');

    if (loginScreen) loginScreen.style.display = 'none';
    if (container) container.style.display = 'block';
    if (nameEl) nameEl.innerText = account.fullName || account.username;

    applyRoleRestrictions(account);

    if (typeof renderAdminOrders === 'function') renderAdminOrders();
    if (typeof renderRevenueStats === 'function') renderRevenueStats();
    if (typeof renderGoogleCalendar === 'function') renderGoogleCalendar();
    if (typeof renderAdminAccountsList === 'function') renderAdminAccountsList();
}

function applyRoleRestrictions(account) {
    const tabRevenue = document.getElementById('tabRevenue');
    const tabAccounts = document.getElementById('tabAccounts');
    const isAdmin = account.role === 'admin';

    if (tabRevenue) tabRevenue.style.display = ''; 
    if (tabAccounts) tabAccounts.style.display = isAdmin ? '' : 'none';

    if (!isAdmin) {
        const activeTab = document.querySelector('.tab-menu .btn-tab.active');
        if (activeTab && activeTab.id === 'tabAccounts') {
            if (typeof switchTab === 'function') switchTab('orders');
        }
    }
}

window.openCreateAccountModal = function (role) {
    if (window.isMemberOnly()) {
        alert('Tài khoản thành viên không có quyền tạo tài khoản mới!');
        return;
    }
    const roleLabel = role === 'admin' ? 'Admin' : 'Thành viên';

    const bodyHtml = `
        <p style="margin-bottom:15px;">Tạo tài khoản <strong>${roleLabel}</strong> mới để truy cập trang quản trị.</p>
        <div style="display:flex; flex-direction:column; gap:12px;">
            <div>
                <label style="display:block; color:var(--text-muted); font-size:0.85rem; margin-bottom:5px;">Họ và tên</label>
                <input type="text" id="newAccFullName" class="modal-input" placeholder="Nguyễn Văn A">
            </div>
            <div>
                <label style="display:block; color:var(--text-muted); font-size:0.85rem; margin-bottom:5px;">Tên đăng nhập</label>
                <input type="text" id="newAccUsername" class="modal-input" placeholder="username">
            </div>
            <div>
                <label style="display:block; color:var(--text-muted); font-size:0.85rem; margin-bottom:5px;">Mật khẩu</label>
                <div class="password-input-wrapper">
                    <input type="password" id="newAccPassword" class="modal-input" placeholder="Mật khẩu đăng nhập">
                    <i class="fa-solid fa-eye toggle-password-icon" onclick="togglePasswordVisibility('newAccPassword', this)"></i>
                </div>
            </div>
            <div>
                <label style="display:block; color:var(--text-muted); font-size:0.85rem; margin-bottom:5px;">Nhập lại mật khẩu</label>
                <div class="password-input-wrapper">
                    <input type="password" id="newAccPasswordConfirm" class="modal-input" placeholder="Nhập lại mật khẩu">
                    <i class="fa-solid fa-eye toggle-password-icon" onclick="togglePasswordVisibility('newAccPasswordConfirm', this)"></i>
                </div>
            </div>
        </div>
    `;

    showModal(
        `<i class="fa-solid fa-user-plus" style="color: var(--gold);"></i> Tạo tài khoản ${roleLabel}`,
        bodyHtml,
        function () {
            const fullName = document.getElementById('newAccFullName').value.trim();
            const username = document.getElementById('newAccUsername').value.trim();
            const password = document.getElementById('newAccPassword').value;
            const passwordConfirm = document.getElementById('newAccPasswordConfirm').value;

            if (!fullName || !username || !password || !passwordConfirm) {
                alert('Vui lòng điền đầy đủ thông tin!');
                return;
            }

            if (password !== passwordConfirm) {
                alert('Mật khẩu nhập lại không khớp, vui lòng kiểm tra lại!');
                return;
            }

            const accounts = getAdminAccounts();
            if (accounts.find(a => a.username.toLowerCase() === username.toLowerCase())) {
                alert('Tên đăng nhập này đã tồn tại, vui lòng chọn tên khác!');
                return;
            }

            accounts.push({
                username,
                password,
                fullName,
                role,
                createdAt: new Date().toISOString().split('T')[0]
            });
            saveAdminAccounts(accounts);
            renderAdminAccountsList();
            closeModal();
            alert(`Đã tạo tài khoản ${roleLabel} "${username}" thành công!`);
        },
        null
    );
};

window.renderAdminAccountsList = function () {
    const tbody = document.getElementById('adminAccountsTableBody');
    if (!tbody) return;

    const accounts = getAdminAccounts();
    const currentUsername = localStorage.getItem(ADMIN_SESSION_KEY) || sessionStorage.getItem(ADMIN_SESSION_KEY);

    tbody.innerHTML = '';
    accounts.forEach(acc => {
        const roleLabel = acc.role === 'admin'
            ? '<span style="color: var(--gold); font-weight:bold;"><i class="fa-solid fa-user-shield"></i> Admin</span>'
            : '<span style="color:#60a5fa; font-weight:bold;"><i class="fa-solid fa-user"></i> Thành viên</span>';
        const isSelf = acc.username === currentUsername;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${acc.username}</strong>${isSelf ? ' <span style="color:var(--text-muted); font-size:0.75rem;">(Bạn)</span>' : ''}</td>
            <td>${acc.fullName || '-'}</td>
            <td>${roleLabel}</td>
            <td>${acc.createdAt || '-'}</td>
            <td style="text-align:center;">
                ${window.isMemberOnly() || isSelf
                    ? '<span style="color:var(--text-muted); font-size:0.8rem;">—</span>'
                    : `<button class="btn-action btn-delete" onclick="deleteAdminAccount('${acc.username}')"><i class="fa-solid fa-trash"></i></button>`}
            </td>
        `;
        tbody.appendChild(tr);
    });
};

window.deleteAdminAccount = function (username) {
    if (window.isMemberOnly()) {
        alert('Tài khoản thành viên không có quyền xóa tài khoản!');
        return;
    }
    const currentUsername = localStorage.getItem(ADMIN_SESSION_KEY) || sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (username === currentUsername) {
        alert('Bạn không thể tự xóa tài khoản đang đăng nhập!');
        return;
    }

    let accounts = getAdminAccounts();
    const acc = accounts.find(a => a.username === username);
    if (!acc) return;

    showModal(
        '<i class="fa-solid fa-triangle-exclamation" style="color:#ff6b6b;"></i> Xóa tài khoản',
        `Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản <strong>${acc.username}</strong> (${acc.fullName || ''}) không?`,
        function () {
            accounts = accounts.filter(a => a.username !== username);
            saveAdminAccounts(accounts);
            renderAdminAccountsList();
            closeModal();
        }
    );
};

document.addEventListener('DOMContentLoaded', function () {
    ensureDefaultAdminAccount();

    if (typeof window.switchTab === 'function' && !window.switchTab.__wrappedByAuth) {
        const originalSwitchTab = window.switchTab;
        const wrappedSwitchTab = function (tabName) {
            const account = getCurrentAdminAccount();
            if (account && account.role !== 'admin' && tabName === 'accounts') {
                alert('Bạn không có quyền truy cập mục này!');
                return originalSwitchTab('orders');
            }
            return originalSwitchTab(tabName);
        };
        wrappedSwitchTab.__wrappedByAuth = true;
        window.switchTab = wrappedSwitchTab;
    }

    checkAdminLoginStatus();
});