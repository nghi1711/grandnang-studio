function initCamNangPage() {
    // Không cần khởi tạo gì thêm, mục đầu tiên đã mở sẵn qua class "active" trong HTML
}

function toggleCamNangItem(headerEl) {
    const item = headerEl.closest('.camnang-item');
    if (!item) return;
    item.classList.toggle('active');
}