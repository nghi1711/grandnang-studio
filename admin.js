let currentCalendarDate = new Date();
let trendChartInstances = {};

function getOrders() {
    try {
        return JSON.parse(localStorage.getItem('grandnang_all_bookings') || '[]');
    } catch(e) { return []; }
}

function saveOrders(orders) {
    localStorage.setItem('grandnang_all_bookings', JSON.stringify(orders));
}

const PLATFORM_OPTIONS = [
    { value: 'Facebook', label: 'Facebook' },
    { value: 'Instagram', label: 'Instagram' },
    { value: 'TikTok', label: 'TikTok' },
    { value: 'Threads', label: 'Threads' },
    { value: 'Lớp khác giới thiệu', label: 'Lớp khác / Bạn bè giới thiệu' },
    { value: 'Trực tiếp', label: 'Trực tiếp / Liên hệ trực tiếp' },
    { value: 'Khác', label: 'Khác' }
];

document.addEventListener("DOMContentLoaded", function() {
    renderAdminOrders();
    renderRevenueStats();
    renderGoogleCalendar();
});

window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-menu .btn-tab').forEach(el => el.classList.remove('active'));

    if (tabName === 'orders') {
        document.getElementById('contentOrders').style.display = 'block';
        document.getElementById('tabOrders').classList.add('active');
        renderAdminOrders();
    } else if (tabName === 'revenue') {
        document.getElementById('contentRevenue').style.display = 'block';
        document.getElementById('tabRevenue').classList.add('active');
        renderRevenueStats();
    } else if (tabName === 'calendar') {
        document.getElementById('contentCalendar').style.display = 'block';
        document.getElementById('tabCalendar').classList.add('active');
        renderGoogleCalendar();
    } else if (tabName === 'staff') {
        document.getElementById('contentStaff').style.display = 'block';
        document.getElementById('tabStaff').classList.add('active');
    } else if (tabName === 'images') {
        document.getElementById('contentImages').style.display = 'block';
        document.getElementById('tabImages').classList.add('active');
        if (typeof renderImageManagerTab === 'function') {
            renderImageManagerTab(document.getElementById('imageManagerContainer'));
        }
    } else if (tabName === 'accounts') {
        document.getElementById('contentAccounts').style.display = 'block';
        document.getElementById('tabAccounts').classList.add('active');
        if (typeof renderAdminAccountsList === 'function') renderAdminAccountsList();
    }
};

function formatDateVN(dateStr) {
    if (!dateStr) return 'Chưa rõ';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
}

function getPlatformIcon(source) {
    if (!source) source = 'Trực tiếp';
    let s = source.toLowerCase();
    if (s.includes('facebook') || s.includes('fb')) return { icon: '<i class="fa-brands fa-facebook" style="color: rgba(255,255,255,0.4);"></i>', label: 'Facebook' };
    if (s.includes('instagram') || s.includes('ig')) return { icon: '<i class="fa-brands fa-instagram" style="color: rgba(255,255,255,0.4);"></i>', label: 'Instagram' };
    if (s.includes('tiktok')) return { icon: '<i class="fa-brands fa-tiktok" style="color: rgba(255,255,255,0.4);"></i>', label: 'TikTok' };
    if (s.includes('threads')) return { icon: '<i class="fa-brands fa-threads" style="color: rgba(255,255,255,0.4);"></i>', label: 'Threads' };
    return { icon: '<i class="fa-solid fa-users" style="color: rgba(255,255,255,0.4);"></i>', label: source };
}

function getSourceBadge(source, orderId) {
    const p = getPlatformIcon(source);
    const isMember = typeof window.isMemberOnly === 'function' && window.isMemberOnly();
    if (isMember) {
        return `<span style="color: var(--text-muted); font-weight: 500; font-size:0.85rem;">${p.icon} ${p.label}</span>`;
    }
    return `<span onclick="editSource('${orderId}')" title="Bấm để đổi nền tảng" style="cursor:pointer; color: var(--text-muted); font-weight: 500; font-size:0.85rem;">${p.icon} ${p.label} <i class="fa-solid fa-pen" style="font-size:0.65rem; opacity:0.5;"></i></span>`;
}

window.editSource = function(orderId) {
    if (window.isMemberOnly()) {
        alert('Tài khoản thành viên chỉ có quyền xem, không được chỉnh sửa!');
        return;
    }
    let orders = getOrders();
    let ord = orders.find(o => o.orderId === orderId);
    if (!ord) return;

    showModal(
        '<i class="fa-solid fa-bullhorn" style="color: var(--gold);"></i> Cập nhật nền tảng biết đến',
        `Chọn nền tảng mà lớp <strong>${ord.className}</strong> đã biết đến Grandnang Studio:`,
        function() {
            const val = document.getElementById('modalPromptInput').value;
            ord.source = val;
            saveOrders(orders);
            renderAdminOrders();
            renderRevenueStats();
            closeModal();
        },
        function() { renderAdminOrders(); },
        { type: 'select', value: ord.source || ord.surveySource || 'Trực tiếp', options: PLATFORM_OPTIONS }
    );
};

function renderAdminOrders() {
    const activeTbody = document.getElementById('adminActiveOrderTableBody');
    const doneCountNum = document.getElementById('doneCountNum');
    if (!activeTbody) return;

    let orders = [];
    try {
        orders = JSON.parse(localStorage.getItem('grandnang_all_bookings') || '[]');
    } catch(e) { orders = []; }

    orders.forEach((ord, idx) => {
        if (!ord.orderId) {
            ord.orderId = 'GD-' + (1000 + idx);
        }
    });
    localStorage.setItem('grandnang_all_bookings', JSON.stringify(orders));

    orders.sort((a, b) => {
        if (a.status === 'Đã xong' && b.status !== 'Đã xong') return 1;
        if (a.status !== 'Đã xong' && b.status === 'Đã xong') return -1;
        return new Date(a.date || '2026-01-01') - new Date(b.date || '2026-01-01');
    });

    let doneOrders = orders.filter(o => o.status === 'Đã xong');
    doneCountNum.innerText = doneOrders.length;

    const isMember = typeof window.isMemberOnly === 'function' && window.isMemberOnly();

    activeTbody.innerHTML = '';
    orders.forEach((ord) => {
        let schoolDisplay = ord.school ? ord.school.split('|')[0].trim() : 'Trường học';
        let hasNightNote = ord.school && ord.school.includes('Tối') ? '<span style="color:#4ade80; font-size:0.75rem; display:block;">(Có chụp Tối)</span>' : '';
        let sourceHtml = getSourceBadge(ord.source || ord.surveySource, ord.orderId);

        let isPaidDeposit = ord.isPaidDeposit !== undefined ? ord.isPaidDeposit : true;
        let depositBadgeHtml = isPaidDeposit 
            ? `<span class="deposit-badge deposit-paid" ${isMember ? '' : `onclick="toggleDeposit('${ord.orderId}')" title="Bấm để đổi trạng thái"`}><i class="fa-solid fa-check"></i> Đã cọc</span>${ord.depositDate ? `<div style="font-size:0.7rem; color: var(--text-muted); margin-top:4px;">Cọc: ${formatDateVN(ord.depositDate)}</div>` : ''}`
            : `<span class="deposit-badge deposit-unpaid" ${isMember ? '' : `onclick="toggleDeposit('${ord.orderId}')" title="Bấm để đổi trạng thái"`}><i class="fa-solid fa-xmark"></i> Chưa cọc</span>`;

        let isShooted = ord.isShooted || false;
        let isFinished = ord.status === 'Đã xong';

        let tr = document.createElement('tr');
        if (isFinished) {
            tr.style.opacity = "0.6";
        }

        tr.innerHTML = `
            <td style="font-weight: bold; color: var(--gold);">${formatDateVN(ord.date)}</td>
            <td>${ord.orderId}</td>
            <td><strong>${ord.className}</strong><br><small style="color:var(--text-muted);">${schoolDisplay}</small>${hasNightNote}</td>
            <td>${sourceHtml}</td>
            <td>${depositBadgeHtml}</td>
            <td>${ord.totalStudents} bạn</td>
            <td><strong style="color:var(--gold);">${ord.packageName}</strong><br>${ord.grandTotal.toLocaleString('vi-VN')}đ</td>
            <td>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                    <label style="cursor: ${isMember ? 'default' : 'pointer'}; font-size: 0.85rem; display: flex; align-items: center; gap: 6px;">
                        <input type="checkbox" ${isShooted ? 'checked' : ''} ${isMember ? 'disabled' : `onchange="toggleShooted('${ord.orderId}', this.checked)"`} style="accent-color: var(--gold); width: 16px; height: 16px;">
                        <span>Đã chụp</span>
                    </label>
                    <label style="cursor: ${isMember ? 'default' : 'pointer'}; font-size: 0.85rem; display: flex; align-items: center; gap: 6px;">
                        <input type="checkbox" ${isFinished ? 'checked' : ''} ${isMember ? 'disabled' : `onchange="toggleFinished('${ord.orderId}', this.checked)"`} style="accent-color: #4ade80; width: 16px; height: 16px;">
                        <span style="color: ${isFinished ? '#4ade80' : '#fff'}; font-weight: ${isFinished ? 'bold' : 'normal'};">Đã trả sản phẩm</span>
                    </label>
                </div>
            </td>
            <td style="text-align: center;">
                <button class="btn-action btn-view" onclick="viewOrderDetail('${ord.orderId}')">Xem</button>
                <button class="btn-action btn-expense" ${isMember ? 'style="opacity:0.5; cursor:not-allowed;" title="Thành viên không được sửa chi phí"' : `onclick="manageExpense('${ord.orderId}')"`}>Chi phí</button>
                ${isMember ? '' : `<button class="btn-action btn-delete" onclick="deleteOrder('${ord.orderId}')"><i class="fa-solid fa-trash"></i></button>`}
            </td>
        `;
        activeTbody.appendChild(tr);
    });
}

window.toggleDeposit = function(orderId) {
    if (window.isMemberOnly()) {
        alert('Tài khoản thành viên chỉ có quyền xem, không được chỉnh sửa!');
        return;
    }
    let orders = getOrders();
    let ord = orders.find(o => o.orderId === orderId);
    if (!ord) return;

    let isPaidDeposit = ord.isPaidDeposit !== undefined ? ord.isPaidDeposit : true;

    if (!isPaidDeposit) {
        showModal(
            '<i class="fa-solid fa-hand-holding-dollar" style="color:#4ade80;"></i> Xác nhận đã cọc',
            `Xác nhận lớp <strong>${ord.className}</strong> đã đặt cọc. Vui lòng chọn ngày nhận cọc:`,
            function() {
                const val = document.getElementById('modalPromptInput').value;
                ord.isPaidDeposit = true;
                ord.depositDate = val || new Date().toISOString().split('T')[0];
                saveOrders(orders);
                renderAdminOrders();
                renderRevenueStats();
                closeModal();
            },
            function() { renderAdminOrders(); },
            { type: 'date', value: ord.depositDate || new Date().toISOString().split('T')[0] }
        );
    } else {
        showModal(
            '<i class="fa-solid fa-triangle-exclamation" style="color:#ff6b6b;"></i> Hủy trạng thái cọc',
            `Xác nhận đánh dấu lớp <strong>${ord.className}</strong> là <strong>chưa cọc</strong>?`,
            function() {
                ord.isPaidDeposit = false;
                saveOrders(orders);
                renderAdminOrders();
                renderRevenueStats();
                closeModal();
            },
            function() { renderAdminOrders(); }
        );
    }
};

window.toggleShooted = function(orderId, isChecked) {
    if (window.isMemberOnly()) return;
    let orders = JSON.parse(localStorage.getItem('grandnang_all_bookings') || '[]');
    let ord = orders.find(o => o.orderId === orderId);
    if (ord) {
        ord.isShooted = isChecked;
        localStorage.setItem('grandnang_all_bookings', JSON.stringify(orders));
    }
};

window.toggleFinished = function(orderId, isChecked) {
    if (window.isMemberOnly()) {
        alert('Tài khoản thành viên chỉ có quyền xem, không được chỉnh sửa!');
        renderAdminOrders();
        return;
    }
    let orders = JSON.parse(localStorage.getItem('grandnang_all_bookings') || '[]');
    let ord = orders.find(o => o.orderId === orderId);
    if (!ord) return;

    if (isChecked) {
        showModal(
            '<i class="fa-solid fa-circle-check" style="color: #4ade80;"></i> Xác nhận hoàn tất đơn',
            `Xác nhận lớp <strong>${ord.className}</strong> đã trả toàn bộ sản phẩm và hoàn tất?<br><br>Hệ thống sẽ chính thức cộng doanh thu và tính lợi nhuận ròng tài chính.`,
            function() {
                ord.status = 'Đã xong';
                ord.isShooted = true;
                localStorage.setItem('grandnang_all_bookings', JSON.stringify(orders));
                renderAdminOrders();
                renderRevenueStats();
                renderGoogleCalendar();
                closeModal();
            },
            function() {
                renderAdminOrders();
                closeModal();
            }
        );
    } else {
        promptReopenOrder(orderId);
    }
};

window.promptReopenOrder = function(orderId) {
    if (window.isMemberOnly()) {
        alert('Tài khoản thành viên không có quyền mở lại đơn!');
        return;
    }
    let orders = JSON.parse(localStorage.getItem('grandnang_all_bookings') || '[]');
    let ord = orders.find(o => o.orderId === orderId);
    if (!ord) return;

    showModal(
        '<i class="fa-solid fa-triangle-exclamation" style="color: #ff6b6b;"></i> Cảnh báo mở lại đơn (Lần 1/2)',
        `Bạn đang yêu cầu mở lại đơn của lớp <strong>${ord.className}</strong>.<br><br>Thao tác này sẽ <strong>tước bỏ trạng thái hoàn tất</strong> và <strong>trừ ngược lại doanh thu/lãi</strong> đã ghi nhận. Bạn có chắc chắn muốn tiếp tục không?`,
        function() {
            showModal(
                '<i class="fa-solid fa-shield-halved" style="color: #ff6b6b;"></i> Xác nhận tuyệt đối (Lần 2/2)',
                `Xác nhận lần cuối: Mở khóa và đưa lớp <strong>${ord.className}</strong> quay lại tiến độ thực hiện?`,
                function() {
                    ord.status = 'Đã nhận cọc nhưng chưa chụp';
                    localStorage.setItem('grandnang_all_bookings', JSON.stringify(orders));
                    renderAdminOrders();
                    renderRevenueStats();
                    renderGoogleCalendar();
                    closeModal();
                    alert("Đã mở lại đơn thành công!");
                },
                function() { renderAdminOrders(); closeModal(); }
            );
        },
        function() { renderAdminOrders(); closeModal(); }
    );
};

window.changeMonth = function(direction) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
    renderGoogleCalendar();
};

window.renderGoogleCalendar = function() {
    const gridDays = document.getElementById('calendarGridDays');
    const monthTitle = document.getElementById('calCurrentMonthTitle');
    if (!gridDays || !monthTitle) return;

    let year = currentCalendarDate.getFullYear();
    let month = currentCalendarDate.getMonth();

    monthTitle.innerText = `Tháng ${month + 1}, ${year}`;

    let orders = [];
    try {
        orders = JSON.parse(localStorage.getItem('grandnang_all_bookings') || '[]');
    } catch(e) { orders = []; }

    let firstDayIndex = new Date(year, month, 1).getDay();
    firstDayIndex = (firstDayIndex === 0) ? 6 : firstDayIndex - 1;
    let totalDays = new Date(year, month + 1, 0).getDate();

    let htmlContent = '';
    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < firstDayIndex; i++) {
        htmlContent += `<div class="cal-cell" style="background: rgba(1, 18, 14, 0.4);"></div>`;
    }

    for (let day = 1; day <= totalDays; day++) {
        let mStr = String(month + 1).padStart(2, '0');
        let dStr = String(day).padStart(2, '0');
        let dateKey = `${year}-${mStr}-${dStr}`;

        let isToday = (dateKey === todayStr) ? 'today' : '';
        let dayOrders = orders.filter(o => o.date === dateKey);

        let pillsHtml = '';
        dayOrders.forEach(ord => {
            let schoolShort = ord.school ? ord.school.split('|')[0].trim() : 'Trường';
            pillsHtml += `<div class="cal-event-pill" title="Lớp ${ord.className} - ${schoolShort}" onclick="alert('Lớp: ${ord.className}\\nTrường: ${schoolShort}\\nĐại diện: ${ord.repName} (${ord.repPhone})\\nGói: ${ord.packageName}')">Lớp ${ord.className}</div>`;
        });

        htmlContent += `
            <div class="cal-cell ${isToday}">
                <div class="cal-date-num">${day}</div>
                ${pillsHtml}
            </div>
        `;
    }

    gridDays.innerHTML = htmlContent;
};

window.openDoneOrdersModal = function() {
    let orders = [];
    try {
        orders = JSON.parse(localStorage.getItem('grandnang_all_bookings') || '[]');
    } catch(e) { orders = []; }

    let doneOrders = orders.filter(o => o.status === 'Đã xong');
    const isMember = typeof window.isMemberOnly === 'function' && window.isMemberOnly();

    if (doneOrders.length === 0) {
        showModal(
            '<i class="fa-solid fa-circle-check" style="color: #4ade80;"></i> Danh sách đơn đã hoàn tất',
            '<p style="color: var(--text-muted); text-align: center; margin: 20px 0;">Chưa có đơn hàng nào hoàn tất.</p>',
            null, null
        );
        document.getElementById('modalBtnConfirm').style.display = 'none';
        document.getElementById('modalBtnCancel').innerText = 'Đóng';
        return;
    }

    let htmlContent = '';
    doneOrders.forEach((ord) => {
        let schoolDisplay = ord.school ? ord.school.split('|')[0].trim() : 'Trường học';
        let netProfit = (ord.grandTotal || 0) - (ord.expense || 0);

        htmlContent += `
            <div class="done-card-modal">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <strong style="color: #4ade80; font-size: 0.95rem;"><i class="fa-solid fa-check-circle"></i> Lớp ${ord.className} (${schoolDisplay})</strong>
                        <p style="margin: 3px 0; font-size: 0.8rem; color: #fff;">Ngày: ${formatDateVN(ord.date)} | ${ord.totalStudents} bạn | Gói: ${ord.packageName}</p>
                        <p style="margin: 0; font-size: 0.8rem; color: var(--gold); font-weight: bold;">Tổng tiền: ${ord.grandTotal.toLocaleString('vi-VN')}đ (Lãi ròng: ${netProfit.toLocaleString('vi-VN')}đ)</p>
                    </div>
                    <button onclick="viewOrderDetail('${ord.orderId}')" style="background: var(--gold); color: #000; border: none; padding: 4px 8px; font-size: 0.75rem; font-weight: bold; border-radius: 4px; cursor: pointer;">Xem</button>
                </div>
                <div style="margin-top: 8px; border-top: 1px dashed rgba(74, 222, 128, 0.2); padding-top: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.75rem; color: #4ade80; font-weight: bold;">ĐÃ XONG & ĐÃ CỘNG DOANH THU</span>
                    ${isMember ? '' : `<button onclick="closeModal(); promptReopenOrder('${ord.orderId}')" style="background: transparent; color: #ff6b6b; border: 1px solid #ff6b6b; font-size: 0.7rem; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-weight: bold;">Mở lại đơn</button>`}
                </div>
            </div>
        `;
    });

    showModal(
        `<i class="fa-solid fa-circle-check" style="color: #4ade80;"></i> Danh sách đơn đã hoàn tất (${doneOrders.length})`,
        htmlContent,
        null, null
    );
    document.getElementById('modalBtnConfirm').style.display = 'none';
    document.getElementById('modalBtnCancel').innerText = 'Đóng';
};

window.manageExpense = function(orderId) {
    if (window.isMemberOnly()) {
        alert('Tài khoản thành viên chỉ có quyền xem, không được kê khai chi phí!');
        return;
    }
    let orders = getOrders();
    let ord = orders.find(o => o.orderId === orderId);
    if (!ord) return;

    const currentExpThousand = Math.round((ord.expense || 0) / 1000);
    const currentNote = ord.expenseNote || '';

    const bodyHtml = `
        <p style="margin-bottom: 15px;">Nhập chi phí phát sinh cho lớp <strong>${ord.className}</strong> (tiền ăn, xe cộ, phụ kiện...):</p>
        <div style="display:flex; flex-direction:column; gap:16px;">
            <div>
                <label style="display:block; color:var(--text-muted); font-size:0.85rem; margin-bottom:6px;">Số tiền <span style="color:var(--gold);">(đơn vị: nghìn đồng)</span></label>
                <div style="position:relative;">
                    <input type="number" id="expenseInputThousand" class="modal-input" value="${currentExpThousand || ''}" placeholder="Ví dụ: 500" style="padding-right: 85px;" min="0" step="1">
                    <span style="position:absolute; right:12px; top:50%; transform:translateY(-50%); color:var(--gold); font-weight:bold; font-size:0.85rem; pointer-events:none;">nghìn đ</span>
                </div>
                <p id="expensePreviewText" style="margin:8px 0 0 0; font-size:0.85rem; color:var(--text-muted);">Tương đương: <strong style="color:#fff;">${(currentExpThousand * 1000).toLocaleString('vi-VN')}đ</strong></p>
            </div>
            <div>
                <label style="display:block; color:var(--text-muted); font-size:0.85rem; margin-bottom:6px;"><i class="fa-solid fa-note-sticky"></i> Ghi chú chi phí <span style="opacity:0.7;">(không bắt buộc)</span></label>
                <textarea id="expenseNoteInput" class="modal-input" rows="3" placeholder="Ví dụ: tiền xăng xe di chuyển, ăn trưa cho ekip, thuê thêm phụ kiện..." style="resize: vertical; font-family: inherit; line-height: 1.5;">${currentNote}</textarea>
            </div>
        </div>
    `;

    showModal(
        '<i class="fa-solid fa-receipt" style="color: #60a5fa;"></i> Kê khai chi phí thợ',
        bodyHtml,
        function() {
            const thousandVal = parseFloat(document.getElementById('expenseInputThousand').value) || 0;
            const noteVal = document.getElementById('expenseNoteInput').value.trim();
            ord.expense = Math.round(thousandVal * 1000);
            ord.expenseNote = noteVal;
            saveOrders(orders);
            alert("Đã cập nhật chi phí thành công!");
            renderRevenueStats();
            closeModal();
        },
        null
    );

    setTimeout(() => {
        const inputEl = document.getElementById('expenseInputThousand');
        const previewEl = document.getElementById('expensePreviewText');
        if (inputEl && previewEl) {
            inputEl.addEventListener('input', () => {
                const val = parseFloat(inputEl.value) || 0;
                previewEl.innerHTML = `Tương đương: <strong style="color:#fff;">${(val * 1000).toLocaleString('vi-VN')}đ</strong>`;
            });
            inputEl.focus();
            inputEl.select();
        }
    }, 100);
};

window.deleteOrder = function(orderId) {
    if (window.isMemberOnly()) {
        alert('Tài khoản thành viên không có quyền xóa đơn!');
        return;
    }
    let orders = JSON.parse(localStorage.getItem('grandnang_all_bookings') || '[]');
    let ord = orders.find(o => o.orderId === orderId);
    if (!ord) return;

    showModal(
        '<i class="fa-solid fa-triangle-exclamation" style="color: #ff6b6b;"></i> Xóa đơn đặt lịch',
        `Bạn có chắc chắn muốn xóa vĩnh viễn đơn đặt lịch của lớp <strong>${ord.className}</strong> không?`,
        function() {
            let newOrders = orders.filter(o => o.orderId !== orderId);
            localStorage.setItem('grandnang_all_bookings', JSON.stringify(newOrders));
            renderAdminOrders();
            renderRevenueStats();
            renderGoogleCalendar();
            closeModal();
        }
    );
};

function showModal(title, htmlContent, onConfirmCallback, onCancelCallback = null, inputConfig = false, legacyDefaultValue = 0) {
    document.getElementById('modalTitle').innerHTML = title;
    document.getElementById('modalBody').innerHTML = htmlContent;

    if (inputConfig === true) {
        inputConfig = { type: 'number', value: legacyDefaultValue, placeholder: 'Nhập số tiền...' };
    }

    const inputArea = document.getElementById('modalInputArea');
    if (inputConfig && inputConfig.type === 'select') {
        let optionsHtml = (inputConfig.options || []).map(o =>
            `<option value="${o.value}" ${o.value === inputConfig.value ? 'selected' : ''}>${o.label}</option>`
        ).join('');
        inputArea.innerHTML = `<select id="modalPromptInput" class="modal-input">${optionsHtml}</select>`;
    } else if (inputConfig && inputConfig.type) {
        inputArea.innerHTML = `<input type="${inputConfig.type}" id="modalPromptInput" class="modal-input" value="${inputConfig.value !== undefined ? inputConfig.value : ''}" placeholder="${inputConfig.placeholder || ''}">`;
        setTimeout(() => document.getElementById('modalPromptInput')?.focus(), 100);
    } else {
        inputArea.innerHTML = '';
    }

    const confirmBtn = document.getElementById('modalBtnConfirm');
    const cancelBtn = document.getElementById('modalBtnCancel');
    confirmBtn.style.display = window.isMemberOnly() ? 'none' : 'inline-block';
    cancelBtn.innerText = window.isMemberOnly() ? 'Đóng' : 'Hủy bỏ';

    let newConfirm = confirmBtn.cloneNode(true);
    let newCancel = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

    newConfirm.addEventListener('click', function() {
        if (typeof onConfirmCallback === 'function') onConfirmCallback();
    });

    newCancel.addEventListener('click', function() {
        if (typeof onCancelCallback === 'function') onCancelCallback();
        closeModal();
    });

    document.getElementById('customModal').style.display = 'flex';
}

window.closeModal = function() {
    document.getElementById('customModal').style.display = 'none';
};

function renderRevenueStats() {
    let orders = getOrders();

    let actualRev = 0;
    let totalExp = 0;
    let totalDep = orders.length * 2000000;

    orders.forEach(ord => {
        if (ord.status === 'Đã xong') {
            actualRev += (ord.grandTotal || 0);
            totalExp += (ord.expense || 0);
        }
    });

    let netProfit = Math.max(0, actualRev - totalExp);

    document.getElementById('statActualRevenue').innerText = actualRev.toLocaleString('vi-VN') + 'đ';
    document.getElementById('statTotalExpense').innerText = totalExp.toLocaleString('vi-VN') + 'đ';
    document.getElementById('statNetProfit').innerText = netProfit.toLocaleString('vi-VN') + 'đ';
    document.getElementById('statTotalDeposit').innerText = totalDep.toLocaleString('vi-VN') + 'đ';

    renderTrendCharts(orders);
}

function monthKeyFromDateStr(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const year = parts[0], month = parseInt(parts[1], 10);
    return { key: `${year}-${parts[1]}`, label: `T${month}/${year}` };
}

function buildMonthSeries(orders, dateField) {
    let counts = {};
    let labels = {};
    orders.forEach(ord => {
        const mk = monthKeyFromDateStr(ord[dateField]);
        if (!mk) return;
        counts[mk.key] = (counts[mk.key] || 0) + 1;
        labels[mk.key] = mk.label;
    });
    const sortedKeys = Object.keys(counts).sort();
    return {
        keys: sortedKeys,
        labels: sortedKeys.map(k => labels[k]),
        values: sortedKeys.map(k => counts[k])
    };
}

function destroyChart(id) {
    if (trendChartInstances[id]) {
        trendChartInstances[id].destroy();
        delete trendChartInstances[id];
    }
}

function renderTrendCharts(orders) {
    const highlightGrid = document.getElementById('trendHighlightGrid');
    const canvasMonth = document.getElementById('chartByMonth');
    const canvasPlatform = document.getElementById('chartByPlatform');
    const canvasDeposit = document.getElementById('chartDepositTrend');
    if (!highlightGrid || !canvasMonth || !canvasPlatform || !canvasDeposit || typeof Chart === 'undefined') return;

    const shootSeries = buildMonthSeries(orders, 'date');

    let platformCounts = {};
    orders.forEach(ord => {
        const p = getPlatformIcon(ord.source || ord.surveySource).label;
        platformCounts[p] = (platformCounts[p] || 0) + 1;
    });
    const platformLabels = Object.keys(platformCounts);
    const platformValues = platformLabels.map(k => platformCounts[k]);

    const depositOrders = orders.filter(o => o.depositDate);
    const depositSeries = buildMonthSeries(depositOrders, 'depositDate');

    let topMonthIdx = shootSeries.values.length ? shootSeries.values.indexOf(Math.max(...shootSeries.values)) : -1;
    let topMonthText = topMonthIdx >= 0 ? `${shootSeries.labels[topMonthIdx]} (${shootSeries.values[topMonthIdx]} đơn)` : 'Chưa có dữ liệu';

    let topPlatformIdx = platformValues.length ? platformValues.indexOf(Math.max(...platformValues)) : -1;
    let topPlatformText = topPlatformIdx >= 0 ? `${platformLabels[topPlatformIdx]} (${platformValues[topPlatformIdx]} đơn)` : 'Chưa có dữ liệu';

    let topDepositIdx = depositSeries.values.length ? depositSeries.values.indexOf(Math.max(...depositSeries.values)) : -1;
    let topDepositText = topDepositIdx >= 0 ? `${depositSeries.labels[topDepositIdx]} (${depositSeries.values[topDepositIdx]} đơn cọc)` : 'Chưa có dữ liệu';

    highlightGrid.innerHTML = `
        <div class="stat-card">
            <span><i class="fa-solid fa-camera-retro"></i> Tháng Chụp Nhiều Nhất</span>
            <h3 style="color:#4ade80;">${topMonthText}</h3>
        </div>
        <div class="stat-card">
            <span><i class="fa-solid fa-share-nodes"></i> Nền Tảng Hiệu Quả Nhất</span>
            <h3 style="color:var(--gold);">${topPlatformText}</h3>
        </div>
        <div class="stat-card">
            <span><i class="fa-solid fa-hand-holding-dollar"></i> Tháng Cọc Nhiều Nhất</span>
            <h3 style="color:#60a5fa;">${topDepositText}</h3>
        </div>
    `;

    const goldColor = '#dfb76c';
    const chartOptsBase = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#c5d1cb' } } },
        scales: {
            x: { ticks: { color: '#8fa39b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#8fa39b', precision: 0 }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true }
        }
    };

    destroyChart('month');
    trendChartInstances.month = new Chart(canvasMonth.getContext('2d'), {
        type: 'bar',
        data: {
            labels: shootSeries.labels.length ? shootSeries.labels : ['Chưa có dữ liệu'],
            datasets: [{
                label: 'Số đơn đã chụp',
                data: shootSeries.values.length ? shootSeries.values : [0],
                backgroundColor: goldColor,
                borderRadius: 4
            }]
        },
        options: chartOptsBase
    });

    destroyChart('platform');
    const pieColors = ['#dfb76c', '#60a5fa', '#4ade80', '#ff6b6b', '#a78bfa', '#f472b6', '#c5d1cb'];
    trendChartInstances.platform = new Chart(canvasPlatform.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: platformLabels.length ? platformLabels : ['Chưa có dữ liệu'],
            datasets: [{
                data: platformValues.length ? platformValues : [1],
                backgroundColor: pieColors
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#c5d1cb' } } }
        }
    });

    destroyChart('deposit');
    trendChartInstances.deposit = new Chart(canvasDeposit.getContext('2d'), {
        type: 'line',
        data: {
            labels: depositSeries.labels.length ? depositSeries.labels : ['Chưa có dữ liệu'],
            datasets: [{
                label: 'Số đơn nhận cọc',
                data: depositSeries.values.length ? depositSeries.values : [0],
                borderColor: '#60a5fa',
                backgroundColor: 'rgba(96, 165, 250, 0.2)',
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#60a5fa'
            }]
        },
        options: chartOptsBase
    });
}

window.viewOrderDetail = function(orderId) {
    let orders = JSON.parse(localStorage.getItem('grandnang_all_bookings') || '[]');
    let ord = orders.find(o => o.orderId === orderId);
    if (ord) {
        let sourceText = ord.source || ord.surveySource || 'Trực tiếp';
        let netProfit = (ord.grandTotal || 0) - (ord.expense || 0);
        let statusColor = ord.status === 'Đã xong' ? '#4ade80' : '#dfb76c';

        let bodyHtml = `
            <div style="display:flex; flex-direction:column; gap:14px;">

                <div style="background:#01120e; border:1px solid var(--border-color); border-radius:8px; padding:16px;">
                    <h4 style="color:var(--gold); margin:0 0 12px 0; font-size:0.8rem; text-transform:uppercase; letter-spacing:0.5px;">
                        <i class="fa-solid fa-users"></i> Thông Tin Lớp
                    </h4>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px 20px; font-size:0.9rem;">
                        <div><span style="color:var(--text-muted); font-size:0.8rem;">Lớp</span><br><strong>${ord.className}</strong></div>
                        <div><span style="color:var(--text-muted); font-size:0.8rem;">Trường</span><br><strong>${ord.school || 'Chưa cập nhật'}</strong></div>
                        <div><span style="color:var(--text-muted); font-size:0.8rem;">Người đại diện</span><br><strong>${ord.repName} (${ord.repPhone})</strong></div>
                        <div><span style="color:var(--text-muted); font-size:0.8rem;">Email</span><br><strong>${ord.email || 'Không có'}</strong></div>
                        <div><span style="color:var(--text-muted); font-size:0.8rem;">Sĩ số</span><br><strong>${ord.totalStudents} học sinh</strong></div>
                        <div><span style="color:var(--text-muted); font-size:0.8rem;">Nguồn biết đến</span><br><strong>${sourceText}</strong></div>
                    </div>
                </div>

                <div style="background:#01120e; border:1px solid var(--border-color); border-radius:8px; padding:16px;">
                    <h4 style="color:var(--gold); margin:0 0 12px 0; font-size:0.8rem; text-transform:uppercase; letter-spacing:0.5px;">
                        <i class="fa-solid fa-calendar-check"></i> Lịch Trình
                    </h4>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px 20px; font-size:0.9rem;">
                        <div><span style="color:var(--text-muted); font-size:0.8rem;">Gói dịch vụ</span><br><strong style="color:var(--gold);">${ord.packageName}</strong></div>
                        <div><span style="color:var(--text-muted); font-size:0.8rem;">Ngày bấm máy</span><br><strong>${formatDateVN(ord.date)}</strong></div>
                        <div><span style="color:var(--text-muted); font-size:0.8rem;">Ngày nhận cọc</span><br><strong>${ord.depositDate ? formatDateVN(ord.depositDate) : 'Chưa cọc'}</strong></div>
                        <div><span style="color:var(--text-muted); font-size:0.8rem;">Trạng thái</span><br><strong style="color:${statusColor};">${ord.status || 'Đang thực hiện'}</strong></div>
                    </div>
                </div>

                <div style="background:#01120e; border:1px solid rgba(223,183,108,0.35); border-radius:8px; padding:16px;">
                    <h4 style="color:var(--gold); margin:0 0 10px 0; font-size:0.8rem; text-transform:uppercase; letter-spacing:0.5px;">
                        <i class="fa-solid fa-sack-dollar"></i> Tài Chính
                    </h4>
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:7px 0; border-bottom:1px dashed var(--border-color);">
                        <span style="color:var(--text-muted); font-size:0.9rem;">Tổng hóa đơn</span>
                        <strong style="color:var(--gold); font-size:1.05rem;">${ord.grandTotal.toLocaleString('vi-VN')}đ</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:7px 0; border-bottom:1px dashed var(--border-color);">
                        <span style="color:var(--text-muted); font-size:0.9rem;">Chi phí thợ kê khai</span>
                        <strong style="color:#ff6b6b; font-size:1.05rem;">${(ord.expense || 0).toLocaleString('vi-VN')}đ</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:7px 0 0 0;">
                        <span style="color:var(--text-muted); font-size:0.9rem;">Lãi ròng tạm tính</span>
                        <strong style="color:#4ade80; font-size:1.05rem;">${netProfit.toLocaleString('vi-VN')}đ</strong>
                    </div>
                    ${ord.expenseNote ? `
                    <div style="margin-top:12px; padding-top:10px; border-top:1px dashed var(--border-color); font-size:0.85rem; color:var(--text-muted);">
                        <i class="fa-solid fa-note-sticky" style="color:var(--gold);"></i> <em>${ord.expenseNote}</em>
                    </div>` : ''}
                </div>

            </div>
        `;

        showModal(
            `<i class="fa-solid fa-file-invoice" style="color: var(--gold);"></i> Chi tiết đơn hàng #${ord.orderId}`,
            bodyHtml,
            null,
            null
        );
        document.getElementById('modalBtnConfirm').style.display = 'none';
        document.getElementById('modalBtnCancel').innerText = 'Đóng';
    }
};