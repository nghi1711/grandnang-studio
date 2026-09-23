window.maxStepReached = 8;

// ================== CẤU HÌNH TẠO SHEET SIZE ĐỒ TỰ ĐỘNG (GOOGLE APPS SCRIPT) ==================
// Sau khi deploy Apps Script (xem hướng dẫn), dán URL Web App (.../exec) vào đây.
// Để trống "" thì web vẫn hoạt động bình thường, chỉ là sẽ không tự tạo link Sheet.
const SIZE_SHEET_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx2snQLVVG4Qh58LEIfcAMDaOtv2rvFvpAxxt4zas57BPnXsa4Rwmu-XXj9ZE5o3o83/exec";

// ================== LOGIC TẢI TRANG PHỤC ĐỘNG TỪ ADMIN ==================
function parsePriceStr(str) {
    if (!str) return 0;
    const match = str.replace(/\./g, '').match(/\d+/);
    return match ? parseInt(match[0]) : 0;
}

async function renderDynamicBookingOutfits() {
    const catTruyenThong = await loadGalleryItems('outfit_categories', 'truyen-thong', []);
    const catConcept = await loadGalleryItems('outfit_categories', 'concept', []);
    const catVest = await loadGalleryItems('outfit_categories', 'vest', []);

    const buildHTMLInputs = (items) => items.map(it => `
        <div class="rentable-outfit-card" style="background: #032b1d; border: 1px solid #053d29; border-radius: 6px; overflow: hidden; display: flex; flex-direction: column;">
            <div class="rentable-outfit-img-wrap" style="height: 260px; background: #000;" onclick="openOutfitDetailPopup('${it.name}', '${it.img}', '${it.hImg1||it.img}', '${it.hImg2||it.img}')">
                <img src="${it.img || 'placeholder.jpg'}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div style="padding: 12px; display: flex; flex-direction: column; flex: 1; justify-content: space-between;">
                <div style="margin-bottom: 10px;"><h5 style="color: #fff; margin: 0 0 5px 0; font-size: 1rem;">${it.name}</h5><span style="color: var(--gold); font-size: 0.85rem; font-weight: bold;">${it.price}</span></div>
                <input type="number" class="dynamic-outfit-qty" data-name="${it.name}" data-price="${parsePriceStr(it.price)}" min="0" placeholder="Số lượng..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--gold); background: #021a15; color: #fff;">
            </div>
        </div>
    `).join('');

    const buildHTMLRadios = (items) => items.map((it, idx) => `
        <div class="concept-card-selectable rentable-outfit-card" style="background: #032b1d; border: 1px solid #053d29; border-radius: 6px; overflow: hidden; display: flex; flex-direction: column;">
            <div class="rentable-outfit-img-wrap" style="height: 260px; background: #000;" onclick="openOutfitDetailPopup('${it.name}', '${it.img}', '${it.hImg1||it.img}', '${it.hImg2||it.img}')">
                <img src="${it.img || 'placeholder.jpg'}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div style="padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                <h5 style="color: #fff; margin: 0; font-size: 1rem;">${it.name}</h5>
                <span class="concept-price-item" style="color: var(--gold); font-size: 0.85rem; font-weight: bold;">${it.price}</span>
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-top: 4px;">
                    <input type="radio" name="conceptThanhXuan" class="dynamic-concept-radio" value="${it.name}" data-price="${parsePriceStr(it.price) || 70000}" ${idx === 0 ? 'checked' : ''} style="accent-color: var(--gold); width: 17px; height: 17px;">
                    <span style="color: #fff; font-size: 0.85rem;">Chọn Concept này</span>
                </label>
            </div>
        </div>
    `).join('');

    if (document.getElementById('booking-truyen-thong-grid')) document.getElementById('booking-truyen-thong-grid').innerHTML = buildHTMLInputs(catTruyenThong);
    if (document.getElementById('booking-concept-grid')) document.getElementById('booking-concept-grid').innerHTML = buildHTMLRadios(catConcept);
    if (document.getElementById('booking-vest-grid')) document.getElementById('booking-vest-grid').innerHTML = buildHTMLInputs(catVest);
}
// ==============================================================================

async function requestSizeSheetLink() {
    const statusEl = document.getElementById('sizeSheetStatus');
    if (!statusEl) return;

    if (!SIZE_SHEET_SCRIPT_URL) {
        statusEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Chưa cấu hình tạo Sheet tự động — vui lòng gửi file size đồ mẫu thủ công cho lớp.';
        return;
    }

    try {
        const res = await fetch(SIZE_SHEET_SCRIPT_URL, {
            method: 'POST',
            // Dùng text/plain để tránh trình duyệt gửi preflight OPTIONS (Apps Script Web App không xử lý OPTIONS)
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                className: window.currentClassName || '',
                schoolName: window.currentSchoolName || '',
                maleCount: window.currentMaleCount || '',
                femaleCount: window.currentFemaleCount || ''
            })
        });
        const data = await res.json();
        if (data.success) {
            statusEl.innerHTML = `<i class="fa-solid fa-circle-check" style="color:#4ade80;"></i> Đã tạo file đăng ký size đồ cho lớp: <a href="${data.url}" target="_blank" style="color: var(--gold); font-weight: bold;">${data.title} <i class="fa-solid fa-arrow-up-right-from-square"></i></a>`;
        } else {
            throw new Error(data.error || 'Không rõ lỗi từ script');
        }
    } catch (err) {
        console.error('[Grandnang] Lỗi tạo Sheet size đồ:', err);
        statusEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Không tạo được link tự động (có thể do chưa deploy đúng cách). Vui lòng gửi file mẫu thủ công cho lớp.';
    }
}

window.jumpToStep = function(stepNum) {
    for(let i = 1; i <= 8; i++) {
        let st = document.getElementById(`step-${i}-${getStepName(i)}`);
        if(st) st.style.display = 'none';
    }
    const target = document.getElementById(`step-${stepNum}-${getStepName(stepNum)}`);
    if(target) target.style.display = 'block';

    const layout = document.getElementById('bookingMainLayout');
    if (layout) {
        if (stepNum === 8) {
            layout.classList.add('summary-mode');
        } else {
            layout.classList.remove('summary-mode');
        }
    }

    updateTrackerUI(stepNum);
};

function getStepName(num) {
    const names = {1: 'info', 2: 'packages', 3: 'style', 4: 'outfits', 5: 'schedule', 6: 'timeline', 7: 'deposit', 8: 'summary'};
    return names[num];
}

function removeVietnameseTones(str) {
    if (!str) return '';
    str = str.replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a');
    str = str.replace(/[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]/g, 'A');
    str = str.replace(/[èéẹẻẽêềếệểễ]/g, 'e');
    str = str.replace(/[ÈÉẸẺẼÊỀẾỆỂỄ]/g, 'E');
    str = str.replace(/[ìíịỉĩ]/g, 'i');
    str = str.replace(/[ÌÍỊỈĨ]/g, 'I');
    str = str.replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o');
    str = str.replace(/[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]/g, 'O');
    str = str.replace(/[ùúụủũưừứựửữ]/g, 'u');
    str = str.replace(/[ÙÚỤỦŨƯỪỨỰỬỮ]/g, 'U');
    str = str.replace(/[ỳýỵỷỹ]/g, 'y');
    str = str.replace(/[ỲÝỴỶỸ]/g, 'Y');
    str = str.replace(/đ/g, 'd');
    str = str.replace(/Đ/g, 'D');
    str = str.replace(/[^a-zA-Z0-9\s]/g, '');
    return str.trim();
}

function updateTrackerUI(currentStep) {
    const steps = document.querySelectorAll('.bk-step-vert');
    steps.forEach((el, idx) => {
        let stepIndex = idx + 1;
        el.classList.remove('active', 'completed');
        if (stepIndex === currentStep) {
            el.classList.add('active');
        } else {
            el.classList.add('completed');
        }
    });
}

async function calculateRealDistanceAPI(originBranch, destinationAddress) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const isCity = ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "TP"].some(city => destinationAddress.includes(city));
            resolve(isCity ? Math.floor(Math.random() * 20) + 5 : Math.floor(Math.random() * 150) + 50); 
        }, 300); 
    });
}

// ================= BƯỚC 4: CẬP NHẬT NHÃN GIÁ & KHÓA ĐÈN GIẢ NẮNG =================
function updateStep4Elements(selectedPkg) {
    const isOption1 = selectedPkg && (selectedPkg.includes("Option 1") || selectedPkg.includes("180k"));
    const isOption3 = selectedPkg && (selectedPkg.includes("Option 3") || selectedPkg.includes("530k"));
    const isNightOpt2 = !isOption1 && !isOption3 && document.getElementById('checkNight')?.checked;

    const conceptPriceItems = document.querySelectorAll('.concept-price-item');
    conceptPriceItems.forEach(item => {
        if (isOption1) {
            const radio = item.parentElement.querySelector('.dynamic-concept-radio');
            const price = radio ? radio.getAttribute('data-price') : 70000;
            item.innerText = `+${parseInt(price).toLocaleString('vi-VN')}đ / bộ`;
            item.style.color = "var(--gold)";
        } else {
            item.innerText = "Free (Gói chụp)";
            item.style.color = "#4ade80";
        }
    });

    const denTag = document.getElementById('denGiaNangPriceTag');
    const inpDen = document.getElementById('qtyDenNang');
    if (denTag && inpDen) {
        if (isOption3 || isNightOpt2) {
            denTag.innerText = "Free tặng kèm (Gói chụp)";
            denTag.style.color = "#4ade80";
            inpDen.value = 1;
            inpDen.disabled = true;
            inpDen.style.backgroundColor = "rgba(3, 43, 29, 0.4)";
            inpDen.style.cursor = "not-allowed";
        } else {
            denTag.innerText = "500.000đ / đèn";
            denTag.style.color = "var(--gold)";
            inpDen.disabled = false;
            inpDen.style.backgroundColor = "#021a15";
            inpDen.style.cursor = "text";
        }
    }
}

// ================= BƯỚC 5: FORM ĐỊA ĐIỂM =================
window.toggleLocBox = function(sessionKey, index, isNgoai) {
    const box = document.getElementById(`${sessionKey}_loc_${index}_box`);
    if (box) {
        box.style.display = isNgoai ? 'flex' : 'none';
        if (isNgoai) {
            const inp = document.getElementById(`${sessionKey}_loc_${index}_name`);
            if (inp) inp.focus();
        }
    }
};

window.toggleLocCount = function(sessionKey) {
    const sel = document.getElementById(`${sessionKey}LocCount`);
    const wrap2 = document.getElementById(`${sessionKey}_loc_2_wrapper`);
    if (sel && wrap2) {
        wrap2.style.display = (sel.value === '2') ? 'block' : 'none';
    }
};

window.previewMapDirect = function(sessionKey, index) {
    const linkInput = document.getElementById(`${sessionKey}_loc_${index}_map`);
    const previewBox = document.getElementById(`${sessionKey}_loc_${index}_preview`);
    if (!linkInput || !previewBox) return;

    let link = linkInput.value.trim();
    if (!link) {
        const nameInput = document.getElementById(`${sessionKey}_loc_${index}_name`);
        link = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : "Địa điểm ngoại cảnh";
    }

    previewBox.style.display = 'block';
    previewBox.innerHTML = `<iframe width="100%" height="100%" frameborder="0" style="border:0" src="https://maps.google.com/maps?q=${encodeURIComponent(link)}&t=&z=16&ie=UTF8&iwloc=&output=embed" allowfullscreen></iframe>`;
};

function updateStep5LayoutByPackage(selectedPkg) {
    const morningBox = document.getElementById('sessionMorning');
    const afternoonBox = document.getElementById('sessionAfternoon');
    if (!morningBox || !afternoonBox) return;

    if (selectedPkg && selectedPkg.includes("Option 1")) {
        morningBox.style.display = 'block';
        afternoonBox.style.display = 'none';
    } else {
        morningBox.style.display = 'block';
        afternoonBox.style.display = 'block';
    }
}

function getResolvedLocations() {
    const schoolName = document.getElementById('bkSchoolName')?.value.trim() || "Trường học";
    
    const m1Type = document.querySelector('input[name="morning_loc_1_type"]:checked')?.value;
    const m1Name = document.getElementById('morning_loc_1_name')?.value.trim();
    let m1 = (m1Type === 'ngoai' && m1Name) ? m1Name : schoolName;

    let m2 = null;
    if (document.getElementById('morningLocCount')?.value === '2') {
        const m2Type = document.querySelector('input[name="morning_loc_2_type"]:checked')?.value;
        const m2Name = document.getElementById('morning_loc_2_name')?.value.trim();
        m2 = (m2Type === 'ngoai' && m2Name) ? m2Name : schoolName;
    }

    const a1Type = document.querySelector('input[name="afternoon_loc_1_type"]:checked')?.value;
    const a1Name = document.getElementById('afternoon_loc_1_name')?.value.trim();
    let a1 = (a1Type === 'ngoai' && a1Name) ? a1Name : schoolName;

    let a2 = null;
    if (document.getElementById('afternoonLocCount')?.value === '2') {
        const a2Type = document.querySelector('input[name="afternoon_loc_2_type"]:checked')?.value;
        const a2Name = document.getElementById('afternoon_loc_2_name')?.value.trim();
        a2 = (a2Type === 'ngoai' && a2Name) ? a2Name : schoolName;
    }

    return { schoolName, m1, m2, a1, a2 };
}

// ================= BƯỚC 6: TIMELINE LOGIC =================
function addMinutesToTime(timeStr, minsToAdd) {
    if (!timeStr) return "08:00";
    let [h, m] = timeStr.split(':').map(Number);
    let totalMins = (h || 0) * 60 + (m || 0) + minsToAdd;
    if (totalMins < 0) totalMins += 24 * 60;
    let newH = Math.floor(totalMins / 60) % 24;
    let newM = totalMins % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

let fixedTimelineRows = [];

function generateSmartTimeline() {
    const locs = getResolvedLocations();
    const afternoonCount = parseInt(document.getElementById('afternoonLocCount')?.value || 1);
    
    const isOption3 = window.selectedPackageGlobal && (window.selectedPackageGlobal.includes("Option 3") || window.selectedPackageGlobal.includes("530k"));
    const isNightChecked = isOption3 || document.getElementById('checkNight')?.checked;
    const isSingleSessionPkg = window.selectedPackageGlobal && window.selectedPackageGlobal.includes("Option 1");

    const shootStart = document.getElementById('customStartTime')?.value || "08:00";
    const isPersonalFirst = document.getElementById('checkPersonalFirst')?.checked;

    const warningBox = document.getElementById('warningPersonalFirst');
    if (warningBox) warningBox.style.display = isPersonalFirst ? 'block' : 'none';

    fixedTimelineRows = [];

    const gatherStart = addMinutesToTime(shootStart, -30);
    fixedTimelineRows.push({
        time: `${gatherStart} → ${shootStart}`,
        act: "Học sinh có mặt tại trường",
        outfit: "Đồng phục trường",
        note: locs.schoolName
    });

    let currentPointer = shootStart;

    if (isPersonalFirst) {
        const personalEnd = addMinutesToTime(currentPointer, 30);
        fixedTimelineRows.push({
            time: `${currentPointer} → ${personalEnd}`,
            act: "Chụp cá nhân trước (Ưu tiên)",
            outfit: "Vest / Áo dài",
            note: locs.schoolName
        });
        currentPointer = personalEnd;
    }

    const groupEnd = addMinutesToTime(currentPointer, 90);
    fixedTimelineRows.push({
        time: `${currentPointer} → ${groupEnd}`,
        act: "Chụp tập thể (Ở Lớp -> Sân trường)",
        outfit: "Vest / Áo dài + Cử nhân",
        note: locs.m1
    });

    fixedTimelineRows.push({
        time: `${groupEnd} → 12:00`,
        act: "Chụp tự do (Cá nhân, nhóm, bạn bè)",
        outfit: "Vest / Áo dài + Cử nhân",
        note: (locs.m2 ? locs.m2 : locs.m1)
    });

    if (!isSingleSessionPkg) {
        fixedTimelineRows.push({
            time: "12:00 → 14:00",
            act: "Ăn trưa / Nghỉ trưa tự do",
            outfit: "Tự do",
            note: "Nghỉ ngơi chuẩn bị ca chiều"
        });

        if (afternoonCount === 1) {
            fixedTimelineRows.push({
                time: "14:00 → 17:30",
                act: "Chụp concept thanh xuân",
                outfit: "Thanh xuân Vườn trường",
                note: locs.a1
            });
        } else {
            fixedTimelineRows.push({
                time: "14:00 → 15:30",
                act: "Chụp concept thanh xuân (Địa điểm 1)",
                outfit: "Thanh xuân Vườn trường",
                note: locs.a1
            });
            fixedTimelineRows.push({
                time: "15:30 → 16:00",
                act: "Di chuyển sang địa điểm thứ 2",
                outfit: "Thanh xuân Vườn trường",
                note: `Di chuyển sang ${locs.a2 || 'Địa điểm 2'}`
            });
            fixedTimelineRows.push({
                time: "16:00 → 17:30",
                act: "Chụp concept thanh xuân (Địa điểm 2)",
                outfit: "Thanh xuân Vườn trường",
                note: locs.a2 || locs.a1
            });
        }

        if (isNightChecked) {
            fixedTimelineRows.push({
                time: "18:00 → 18:15",
                act: "Bắn pháo hoa",
                outfit: "Concept Party / Prom",
                note: "Khu vực chụp tối"
            });
            fixedTimelineRows.push({
                time: "18:15 → 20:00",
                act: "Chụp tâm sự & Đêm tiệc",
                outfit: "Concept Party / Prom",
                note: "Khu vực chụp tối"
            });
        }
    }

    renderTimelineTable();
}

function renderTimelineTable() {
    const tbody = document.getElementById('interactiveTimelineTbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    fixedTimelineRows.forEach((row, idx) => {
        const tr = document.createElement('tr');
        tr.style = "border-bottom: 1px solid rgba(143, 163, 155, 0.15); vertical-align: middle;";

        tr.innerHTML = `
            <td style="padding: 10px;">
                <input type="text" value="${row.time}" oninput="fixedTimelineRows[${idx}].time = this.value" style="width: 100%; padding: 8px; background: #01120e; color: var(--gold); border: 1px solid #053d29; border-radius: 4px; font-size: 0.85rem; font-weight: bold; font-family: monospace; outline: none;">
            </td>
            <td style="padding: 10px;">
                <input type="text" value="${row.act}" oninput="fixedTimelineRows[${idx}].act = this.value" style="width: 100%; padding: 8px; background: #01120e; color: #fff; border: 1px solid #053d29; border-radius: 4px; font-size: 0.85rem; outline: none;">
            </td>
            <td style="padding: 10px;">
                <input type="text" value="${row.outfit}" oninput="fixedTimelineRows[${idx}].outfit = this.value" style="width: 100%; padding: 8px; background: #01120e; color: #fff; border: 1px solid #053d29; border-radius: 4px; font-size: 0.85rem; outline: none;">
            </td>
            <td style="padding: 10px;">
                <input type="text" value="${row.note}" oninput="fixedTimelineRows[${idx}].note = this.value" style="width: 100%; padding: 8px; background: #01120e; color: var(--gold); border: 1px solid #053d29; border-radius: 4px; font-size: 0.85rem; outline: none;">
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ================= KHỞI TẠO FLOW =================
function initBookingFlow() {
    renderDynamicBookingOutfits(); // Tải trang phục động từ CSDL

    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('wheel', function(e) { e.preventDefault(); }, { passive: false });
    });

    const currentUser = sessionStorage.getItem('current_logged_in_user');
    if (currentUser) {
        const userData = JSON.parse(localStorage.getItem('grandnang_user_' + currentUser));
        setTimeout(() => {
            if (userData) {
                if (document.getElementById('bkName')) document.getElementById('bkName').value = userData.fullName || "";
                if (document.getElementById('bkClass')) document.getElementById('bkClass').value = userData.className || "";
                if (document.getElementById('bkRepName')) document.getElementById('bkRepName').value = userData.fullName || "";
                if (document.getElementById('bkRepPhone')) document.getElementById('bkRepPhone').value = userData.phone || "";
                if (document.getElementById('bkEmail')) document.getElementById('bkEmail').value = userData.email || "";
            }
        }, 100);
    }

    const bkMale = document.getElementById('bkMale');
    const bkFemale = document.getElementById('bkFemale');
    const bkTotalStudents = document.getElementById('bkTotalStudents');
    
    if (bkMale && bkFemale && bkTotalStudents) {
        const calcTotalStudents = () => {
            const maleCount = parseInt(bkMale.value) || 0;
            const femaleCount = parseInt(bkFemale.value) || 0;
            bkTotalStudents.value = maleCount + femaleCount;
        };
        bkMale.addEventListener('input', calcTotalStudents);
        bkFemale.addEventListener('input', calcTotalStudents);
    }
    
    const provincesData = {
        mienbac: ["Hà Nội", "Hà Giang", "Cao Bằng", "Bắc Kạn", "Tuyên Quang", "Lào Cai", "Điện Biên", "Lai Châu", "Sơn La", "Yên Bái", "Hoà Bình", "Thái Nguyên", "Lạng Sơn", "Quảng Ninh", "Bắc Giang", "Phú Thọ", "Vĩnh Phúc", "Bắc Ninh", "Hải Dương", "Hải Phòng", "Hưng Yên", "Thái Bình", "Hà Nam", "Nam Định", "Ninh Bình"],
        mientrung: ["Thanh Hóa", "Nghệ An", "Hà Tĩnh", "Quảng Bình", "Quảng Trị", "Thừa Thiên Huế", "Đà Nẵng", "Quảng Nam", "Quảng Ngãi", "Bình Định", "Phú Yên", "Khánh Hòa", "Ninh Thuận", "Bình Thuận", "Kon Tum", "Gia Lai", "Đắk Lắk", "Đắk Nông", "Lâm Đồng"],
        miennam: ["Bình Phước", "Tây Ninh", "Bình Dương", "Đồng Nai", "Bà Rịa - Vũng Tàu", "TP Hồ Chí Minh", "Long An", "Tiền Giang", "Bến Tre", "Trà Vinh", "Vĩnh Long", "Đồng Tháp", "An Giang", "Kiên Giang", "Cần Thơ", "Hậu Giang", "Sóc Trăng", "Bạc Liêu", "Cà Mau"]
    };

    const districtsData = {
        "Hà Nội": ["Quận Ba Đình", "Quận Hoàn Kiếm", "Quận Tây Hồ", "Quận Long Biên", "Quận Cầu Giấy", "Quận Đống Đa", "Quận Hai Bà Trưng", "Quận Hoàng Mai", "Quận Thanh Xuân", "Thị xã Sơn Tây", "Huyện Ba Vì", "Huyện Chương Mỹ", "Huyện Đan Phượng", "Huyện Đông Anh", "Huyện Gia Lâm", "Huyện Hoài Đức", "Huyện Mê Linh", "Huyện Mỹ Đức", "Huyện Phú Xuyên", "Huyện Phúc Thọ", "Huyện Quốc Oai", "Huyện Sóc Sơn", "Huyện Thạch Thất", "Huyện Thanh Oai", "Huyện Thanh Trì", "Huyện Thường Tín", "Huyện Ứng Hòa"],
        "TP Hồ Chí Minh": ["Quận 1", "Quận 3", "Quận 4", "Quận 5", "Quận 6", "Quận 7", "Quận 8", "Quận 10", "Quận 11", "Quận 12", "Quận Bình Tân", "Quận Bình Thạnh", "Quận Gò Vấp", "Quận Phú Nhuận", "Quận Tân Bình", "Quận Tân Phú", "TP Thủ Đức", "Huyện Bình Chánh", "Huyện Cần Giờ", "Huyện Củ Chi", "Huyện Hóc Môn", "Huyện Nhà Bè"],
        "Đà Nẵng": ["Quận Cẩm Lệ", "Quận Hải Châu", "Quận Liên Chiểu", "Quận Ngũ Hành Sơn", "Quận Sơn Trà", "Quận Thanh Khê", "Huyện Hòa Vang", "Huyện Hoàng Sa"],
        "Quảng Nam": ["TP Tam Kỳ", "TP Hội An", "Thị xã Điện Bàn", "Huyện Thăng Bình", "Huyện Bắc Trà My", "Huyện Nam Trà My", "Huyện Núi Thành", "Huyện Phước Sơn", "Huyện Tiên Phước", "Huyện Hiệp Đức", "Huyện Nông Sơn", "Huyện Đông Giang", "Huyện Nam Giang", "Huyện Đại Lộc", "Huyện Phú Ninh", "Huyện Tây Giang", "Huyện Duy Xuyên", "Huyện Quế Sơn"]
    };

    const bkRegion = document.getElementById('bkRegion');
    const bkOldProvince = document.getElementById('bkProvince');
    const bkDistrict = document.getElementById('bkDistrict');

    if (bkRegion && bkOldProvince) {
        bkRegion.addEventListener('change', function() {
            const region = this.value;
            bkOldProvince.innerHTML = '<option value="" disabled selected>-- Chọn Tỉnh / Thành phố --</option>';
            bkDistrict.innerHTML = '<option value="" disabled selected>-- Vui lòng chọn Tỉnh/TP trước --</option>';
            bkDistrict.disabled = true;

            if (region && provincesData[region]) {
                provincesData[region].forEach(prov => {
                    const option = document.createElement('option');
                    option.value = prov; option.textContent = prov;
                    bkOldProvince.appendChild(option);
                });
                bkOldProvince.disabled = false;
            } else {
                bkOldProvince.disabled = true;
            }
        });
    }

    if (bkOldProvince && bkDistrict) {
        bkOldProvince.addEventListener('change', function() {
            const provName = this.value;
            bkDistrict.innerHTML = '<option value="" disabled selected>-- Chọn Quận / Huyện --</option>';
            let distList = districtsData[provName] || [`Thành phố thuộc ${provName}`, `Thị xã thuộc ${provName}`, `Các Huyện thuộc ${provName}`];
            distList.forEach(dist => {
                const option = document.createElement('option');
                option.value = dist; option.textContent = dist;
                bkDistrict.appendChild(option);
            });
            bkDistrict.disabled = false;
        });
    }

    // Đảm bảo highlight ô đã chọn hoạt động trên MỌI trình duyệt (không chỉ trình duyệt hỗ trợ CSS :has())
    document.querySelectorAll('input[name="surveySource"]').forEach(radio => {
        radio.addEventListener('change', () => {
            document.querySelectorAll('.survey-opt').forEach(opt => opt.classList.remove('selected'));
            const parentLabel = radio.closest('.survey-opt');
            if (parentLabel) parentLabel.classList.add('selected');
        });
    });

    const surveyOverlay = document.getElementById('survey-overlay');
    const bookingMainLayout = document.getElementById('bookingMainLayout');
    const btnStartBooking = document.getElementById('btnStartBooking');
    const btnNextStep = document.getElementById('btnNextStep');         
    const btnBackToStep1 = document.getElementById('btnBackToStep1');   
    const btnNextToStep3 = document.getElementById('btnNextToStep3');   
    const btnBackToStep2 = document.getElementById('btnBackToStep2');   
    const btnNextToStep4 = document.getElementById('btnNextToStep4');   
    const btnBackToStep3 = document.getElementById('btnBackToStep3');   
    const btnNextToStep5 = document.getElementById('btnNextToStep5');   
    const btnBackToStep4 = document.getElementById('btnBackToStep4');   
    const btnNextToStep6 = document.getElementById('btnNextToStep6');   
    const btnBackToStep5 = document.getElementById('btnBackToStep5');   
    const btnResetTimeline = document.getElementById('btnResetTimeline');
    const btnFinalSubmit = document.getElementById('btnFinalSubmit');
    const btnBackToStep6 = document.getElementById('btnBackToStep6');
    const btnConfirmDeposit = document.getElementById('btnConfirmDeposit');
    
    const step1 = document.getElementById('step-1-info');
    const step2 = document.getElementById('step-2-packages');
    const step3 = document.getElementById('step-3-style');
    const step4 = document.getElementById('step-4-outfits');
    const step5 = document.getElementById('step-5-schedule');
    const step6 = document.getElementById('step-6-timeline');
    const step7 = document.getElementById('step-7-deposit');
    const step8 = document.getElementById('step-8-summary');
    
    if (!step1 || !step2 || !step3 || !step4 || !step5 || !step6) {
        console.error('[Grandnang Booking] Thiếu phần tử bước trong booking.html, toàn bộ nút của form đặt lịch sẽ KHÔNG hoạt động:', {
            step1: !!step1, step2: !!step2, step3: !!step3, step4: !!step4, step5: !!step5, step6: !!step6
        });
        return;
    }

    if (btnStartBooking) {
        btnStartBooking.addEventListener('click', () => {
            const checked = document.querySelector('input[name="surveySource"]:checked');
            if (!checked) {
                alert("Vui lòng chọn 1 kênh mạng xã hội trước khi tiếp tục!");
                return;
            }
            window.surveySource = checked.value;
            // Lưu dự phòng vào sessionStorage để không bị mất giá trị này
            // nếu window.surveySource bị reset trước khi tới bước xác nhận cuối.
            try { sessionStorage.setItem('grandnang_survey_source', window.surveySource); } catch(e) {}
            
            // LƯU KHÁCH HÀNG TIỀM NĂNG (LEAD) KHI BẮT ĐẦU ĐIỀN FORM
            const leadRecord = {
                time: new Date().toLocaleDateString('vi-VN'),
                name: document.getElementById('bkName')?.value || "Khách ghé thăm",
                className: document.getElementById('bkClass')?.value || "Chưa rõ lớp",
                phone: document.getElementById('bkRepPhone')?.value || "Chưa nhập SĐT",
                source: window.surveySource
            };
            let leads = [];
            try { leads = JSON.parse(localStorage.getItem('grandnang_all_leads') || '[]'); } catch(e) { leads = []; }
            leads.unshift(leadRecord);
            localStorage.setItem('grandnang_all_leads', JSON.stringify(leads));

            surveyOverlay.style.display = 'none';
            bookingMainLayout.style.display = 'flex';
            bookingMainLayout.classList.remove('summary-mode');
            updateTrackerUI(1);
        });
    }

    if (btnBackToStep6) {
        btnBackToStep6.addEventListener('click', () => {
            step7.style.display = 'none';
            step6.style.display = 'block';
            bookingMainLayout.classList.remove('summary-mode');
            updateTrackerUI(6);
        });
    }

    if (btnConfirmDeposit) {
        btnConfirmDeposit.addEventListener('click', () => {
            step7.style.display = 'none';
            step8.style.display = 'block';
            bookingMainLayout.classList.add('summary-mode');
            updateTrackerUI(8);
            requestSizeSheetLink();
        });
    }

    window.selectedPackageGlobal = "Option 2: 350k"; 
    window.chosenBookingStyle = "Thanh Xuân Vườn Trường";

    const btnPreviewMap = document.getElementById('btnPreviewMap');
    const mapLinkInput = document.getElementById('bkMapLink');
    const mapPreviewContainer = document.getElementById('mapPreviewContainer');

    if (btnPreviewMap && mapLinkInput && mapPreviewContainer) {
        btnPreviewMap.addEventListener('click', () => {
            let link = mapLinkInput.value.trim();
            if (!link) link = "THPT";
            mapPreviewContainer.style.display = 'block';
            mapPreviewContainer.innerHTML = `<iframe width="100%" height="100%" frameborder="0" style="border:0" src="https://maps.google.com/maps?q=${encodeURIComponent(link)}&t=&z=16&ie=UTF8&iwloc=&output=embed" allowfullscreen></iframe>`;
        });
    }

    btnNextStep.addEventListener('click', () => {
        const bkName = document.getElementById('bkName').value.trim();
        const bkClass = document.getElementById('bkClass').value.trim();
        const bkTotal = parseInt(document.getElementById('bkTotalStudents').value) || 0;
        const bkDate = document.getElementById('bkDate').value;
        const bkRegion = document.getElementById('bkRegion').value;
        const bkProvince = document.getElementById('bkProvince').value;
        const bkRepPhone = document.getElementById('bkRepPhone').value.trim();

        // Kiểm tra rỗng
        if (!bkName || !bkClass || !bkDate || !bkRegion || !bkProvince || !bkRepPhone) {
            alert("⚠️ Vui lòng điền đầy đủ các thông tin bắt buộc (Họ tên, Lớp, Ngày chụp, Khu vực, Tỉnh/TP, SĐT) trước khi tiếp tục!");
            return;
        }

        // Kiểm tra sĩ số
        if (bkTotal < 1) {
            alert("⚠️ Vui lòng nhập số lượng học sinh Nam/Nữ để tính sĩ số lớp!");
            return;
        }

        step1.style.display = 'none'; 
        step2.style.display = 'block';
        bookingMainLayout.classList.remove('summary-mode');
        updateTrackerUI(2);
    });

    btnBackToStep1.addEventListener('click', () => { 
        step2.style.display = 'none'; 
        step1.style.display = 'block'; 
        bookingMainLayout.classList.remove('summary-mode');
        updateTrackerUI(1); 
    });

    document.querySelectorAll('.btn-select-pkg').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.btn-select-pkg').forEach(b => { b.classList.remove('active'); b.innerText = 'Chọn gói này'; });
            const targetBtn = e.currentTarget;
            targetBtn.classList.add('active'); 
            targetBtn.innerText = 'Đã chọn gói này';
            window.selectedPackageGlobal = targetBtn.getAttribute('data-pkg');
        });
    });

    btnNextToStep3.addEventListener('click', () => { 
        step2.style.display = 'none'; 
        step3.style.display = 'block'; 
        bookingMainLayout.classList.remove('summary-mode');
        updateTrackerUI(3); 
    });
    
    btnBackToStep2.addEventListener('click', () => { 
        step3.style.display = 'none'; 
        step2.style.display = 'block'; 
        bookingMainLayout.classList.remove('summary-mode');
        updateTrackerUI(2); 
    });

    window.selectBookingStyle = function(element, styleName) {
        document.querySelectorAll('.style-card-horizontal').forEach(card => {
            card.classList.remove('selected');
        });
        element.classList.add('selected');
        window.chosenBookingStyle = styleName;
    };

    btnNextToStep4.addEventListener('click', () => { 
        step3.style.display = 'none'; 
        step4.style.display = 'block'; 
        bookingMainLayout.classList.remove('summary-mode');
        updateTrackerUI(4);

        updateStep4Elements(window.selectedPackageGlobal);
    });

    btnBackToStep3.addEventListener('click', () => { 
        step4.style.display = 'none'; 
        step3.style.display = 'block'; 
        bookingMainLayout.classList.remove('summary-mode');
        updateTrackerUI(3); 
    });

    const checkNight = document.getElementById('checkNight');
    if(checkNight) {
        checkNight.addEventListener('change', function() {
            updateStep4Elements(window.selectedPackageGlobal);
        });
    }

    btnNextToStep5.addEventListener('click', () => { 
        step4.style.display = 'none'; 
        step5.style.display = 'block'; 
        bookingMainLayout.classList.remove('summary-mode');
        updateTrackerUI(5);

        updateStep5LayoutByPackage(window.selectedPackageGlobal);
    });

    btnBackToStep4.addEventListener('click', () => { 
        step5.style.display = 'none'; 
        step4.style.display = 'block'; 
        bookingMainLayout.classList.remove('summary-mode');
        updateTrackerUI(4); 
    });

    btnNextToStep6.addEventListener('click', () => { 
        const checkLocationValid = (sessionKey, index) => {
            const typeRadio = document.querySelector(`input[name="${sessionKey}_loc_${index}_type"]:checked`);
            if (typeRadio && typeRadio.value === 'ngoai') {
                const locName = document.getElementById(`${sessionKey}_loc_${index}_name`).value.trim();
                if (!locName) return false;
            }
            return true;
        };

        const isMorning1Valid = checkLocationValid('morning', 1);
        const isMorning2Valid = document.getElementById('morningLocCount')?.value === '2' ? checkLocationValid('morning', 2) : true;
        
        let isAfternoon1Valid = true;
        let isAfternoon2Valid = true;
        
        // Buổi chiều chỉ kiểm tra nếu không phải gói Option 1
        if (!(window.selectedPackageGlobal && window.selectedPackageGlobal.includes("Option 1"))) {
            isAfternoon1Valid = checkLocationValid('afternoon', 1);
            isAfternoon2Valid = document.getElementById('afternoonLocCount')?.value === '2' ? checkLocationValid('afternoon', 2) : true;
        }

        if (!isMorning1Valid || !isMorning2Valid || !isAfternoon1Valid || !isAfternoon2Valid) {
            alert("⚠️ Bạn đã chọn chụp Ngoại cảnh. Vui lòng điền rõ Tên địa điểm ngoại cảnh vào ô trống!");
            return;
        }

        generateSmartTimeline();
        step5.style.display = 'none'; 
        step6.style.display = 'block'; 
        bookingMainLayout.classList.remove('summary-mode');
        updateTrackerUI(6);
    });

    btnBackToStep5.addEventListener('click', () => { 
        step6.style.display = 'none'; 
        step5.style.display = 'block'; 
        bookingMainLayout.classList.remove('summary-mode');
        updateTrackerUI(5); 
    });

    if (btnResetTimeline) {
        btnResetTimeline.addEventListener('click', () => {
            generateSmartTimeline();
        });
    }

    // ================= BƯỚC 6 -> BƯỚC 7: TÍNH TOÁN BẢNG GIÁ & LƯU VÀO LOCALSTORAGE =================
    if (btnFinalSubmit) {
        btnFinalSubmit.addEventListener('click', async () => {
            const oldProvince = bkOldProvince.value || "Hà Nội";
            const district = bkDistrict.value || "Quận Ba Đình";
            const schoolAddr = (document.getElementById('bkAddress')?.value || "Địa chỉ trường").trim();
            const rawTotalStudents = parseInt(document.getElementById('bkTotalStudents')?.value || 0);
            const totalStudents = rawTotalStudents > 0 ? rawTotalStudents : 30;
            const numMale = parseInt(document.getElementById('bkMale')?.value || 0);
            const numFemale = parseInt(document.getElementById('bkFemale')?.value || 0);

            let branchName = "Cơ sở 1 (Hà Nội)";
            if(oldProvince.toLowerCase().includes("hồ chí minh") || oldProvince.toLowerCase().includes("hcm") || oldProvince.toLowerCase().includes("tây ninh") || oldProvince.toLowerCase().includes("bình dương") || oldProvince.toLowerCase().includes("đồng nai")) branchName = "Cơ sở 2 (TP. Hồ Chí Minh)";
            if(oldProvince.toLowerCase().includes("đà nẵng") || oldProvince.toLowerCase().includes("quảng nam") || oldProvince.toLowerCase().includes("thừa thiên huế")) branchName = "Cơ sở 3 (Đà Nẵng)";
            
            const originalBtnHtml = btnFinalSubmit.innerHTML;
            btnFinalSubmit.disabled = true;
            btnFinalSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tính toán quãng đường...';
            
            const fullAddress = `${schoolAddr}, ${district}, ${oldProvince}`;
            let rawDistance = await calculateRealDistanceAPI(branchName, fullAddress);
            
            let billableDistance = 0;
            if (rawDistance >= 70) {
                let hundreds = Math.floor(rawDistance / 100);
                if ((rawDistance % 100) >= 70) billableDistance = (hundreds + 1) * 100;
                else billableDistance = hundreds * 100;
            }

            const numPhotogs = totalStudents >= 40 ? 3 : 2;
            const travelFee = (billableDistance / 100) * 200000 * numPhotogs;

            // CẬP NHẬT ĐƠN GIÁ MỚI: 180k - 350k - 530k
            const selectedPkg = window.selectedPackageGlobal || "Option 2: 350k";
            const packageName = selectedPkg.split(':')[0];
            const isOption1 = selectedPkg.includes("180k") || selectedPkg.includes("Option 1");
            const isOption3 = selectedPkg.includes("530k") || selectedPkg.includes("Option 3");
            const isNightOpt2 = !isOption1 && !isOption3 && document.getElementById('checkNight')?.checked;

            let basePkgRate = 350000;
            if (isOption1) basePkgRate = 180000;
            else if (isOption3) basePkgRate = 530000;

            let actualPricePerStudent = basePkgRate;
            if (totalStudents < 30) {
                actualPricePerStudent = Math.floor((basePkgRate * 30) / totalStudents);
            }

            const totalPackageCost = actualPricePerStudent * totalStudents;
            const nightCost = isNightOpt2 ? (50000 * totalStudents) : 0;

            let extraCost = 0;
            let extraItems = [];

            // Thu thập toàn bộ trang phục động do Admin chỉnh sửa
            document.querySelectorAll('.dynamic-outfit-qty').forEach(inp => {
                const qty = parseInt(inp.value) || 0;
                if (qty > 0) {
                    const name = inp.getAttribute('data-name');
                    const price = parseInt(inp.getAttribute('data-price')) || 0;
                    const cost = qty * price;
                    extraCost += cost;
                    extraItems.push({ name: name, qty: qty, cost: cost });
                }
            });

            const hasFreeSunLamp = isOption3 || isNightOpt2;
            const requestedSunLamps = parseInt(document.getElementById('qtyDenNang')?.value || 1);

            if (hasFreeSunLamp) {
                extraItems.push({
                    name: "Quà tặng: Đèn Giả Nắng chuyên dụng",
                    qty: 1,
                    cost: 0,
                    isGift: true
                });
                if (requestedSunLamps > 1) {
                    const extraLampCost = (requestedSunLamps - 1) * 500000;
                    extraCost += extraLampCost;
                    extraItems.push({ name: "Thuê thêm: Đèn Giả Nắng bổ sung", qty: requestedSunLamps - 1, cost: extraLampCost });
                }
            } else if (requestedSunLamps > 0) {
                const lampCost = requestedSunLamps * 500000;
                extraCost += lampCost;
                extraItems.push({ name: "Thuê Đèn Giả Nắng", qty: requestedSunLamps, cost: lampCost });
            }

            const selectedConcept = document.querySelector('input[name="conceptThanhXuan"]:checked');
            const selectedConceptName = selectedConcept ? selectedConcept.value : "Concept Thanh Xuân";
            const parsedConceptPrice = selectedConcept ? parseInt(selectedConcept.getAttribute('data-price')) || 70000 : 70000;

            let isOption1WithConcept = false;

            if (isOption1) {
                const conceptCost = parsedConceptPrice * totalStudents;
                extraCost += conceptCost;
                isOption1WithConcept = true;
                extraItems.push({
                    name: `Thuê thêm: ${selectedConceptName}`,
                    qty: totalStudents,
                    cost: conceptCost
                });
            }

            if (!isOption1 || isOption1WithConcept) {
                extraItems.push({
                    name: "Free quà tặng: Chong chóng (Sĩ số + 1)",
                    qty: totalStudents + 1,
                    cost: 0,
                    isGift: true
                });
            }

            extraItems.push({
                name: "Free quà tặng: Giấy màu (Sĩ số + 1)",
                qty: totalStudents + 1,
                cost: 0,
                isGift: true
            });

            extraItems.push({
                name: "Free quà tặng: Súng bắn bong bóng (Theo số thợ)",
                qty: numPhotogs,
                cost: 0,
                isGift: true
            });

            if (isOption3 || isNightOpt2) {
                extraItems.push({
                    name: "Free quà tặng: Loa thùng tâm sự & Pháo hoa đêm tiệc",
                    qty: 1,
                    cost: 0,
                    isGift: true
                });
            }

            let grandTotal = totalPackageCost + nightCost + travelFee + extraCost;

            const referralCode = document.getElementById('bkReferral') ? document.getElementById('bkReferral').value.trim().toUpperCase() : "";
            let discountValue = 0;
            let discountDesc = "";

            if (referralCode === "GRAND2026") {
                discountValue = 500000;
                discountDesc = "Mã ưu đãi GRAND2026 (-500.000đ)";
            } else if (referralCode !== "") {
                discountValue = 300000;
                discountDesc = `Mã giới thiệu: ${referralCode} (-300.000đ)`;
            }

            grandTotal = Math.max(0, grandTotal - discountValue);
            
            const DEPOSIT_VALUE = 2000000;
            const remainingValue = Math.max(0, grandTotal - DEPOSIT_VALUE);

            if(document.getElementById('invDate')) document.getElementById('invDate').innerText = document.getElementById('bkDate')?.value || "Theo thỏa thuận";
            if(document.getElementById('invBranch')) document.getElementById('invBranch').innerText = branchName;
            if(document.getElementById('invDistance')) document.getElementById('invDistance').innerText = rawDistance <= 15 ? "Nội Thành (0đ)" : `${rawDistance}km (Làm tròn: ${billableDistance}km)`;

            const locs = getResolvedLocations();
            const chosenLocArr = [locs.m1];
            if (locs.m2) chosenLocArr.push(locs.m2);
            if (locs.a1 && !isOption1) chosenLocArr.push(locs.a1);
            if (locs.a2 && !isOption1) chosenLocArr.push(locs.a2);

            const repNameVal = document.getElementById('bkName')?.value || "Đại diện lớp";
            const repPhoneVal = document.getElementById('bkRepPhone')?.value || "Chưa nhập";
            const emailVal = document.getElementById('bkEmail')?.value || "Chưa nhập";
            const classVal = document.getElementById('bkClass')?.value || "Lớp";

            // LƯU LẠI ĐỂ DÙNG KHI TẠO SHEET ĐĂNG KÝ SIZE ĐỒ (sau khi đặt cọc)
            window.currentClassName = classVal;
            window.currentSchoolName = chosenLocArr.join(' | ');
            window.currentMaleCount = numMale;
            window.currentFemaleCount = numFemale;

            if(document.getElementById('invCusName')) {
                document.getElementById('invCusName').innerText = repNameVal;
                document.getElementById('invCusPhone').innerText = repPhoneVal;
                document.getElementById('invCusEmail').innerText = emailVal;
                document.getElementById('invCusClass').innerText = classVal;
                document.getElementById('invCusTotal').innerText = `${totalStudents} ${totalStudents < 30 ? '(Tính theo giá chia đều dưới 30 bạn)' : ''}`;
                document.getElementById('invCusMale').innerText = numMale;
                document.getElementById('invCusFemale').innerText = numFemale;
                document.getElementById('invCusSchool').innerText = chosenLocArr.join(' | ');
            }

            let tableHtml = `
                <tr>
                    <td style="padding: 8px 10px;">
                        Gói ${packageName} 
                        ${totalStudents < 30 ? `<br><small style="color:var(--gold);">(${actualPricePriceNote(basePkgRate, totalStudents)})</small>` : ''}
                    </td>
                    <td style="padding: 8px; text-align: center;">${totalStudents}</td>
                    <td style="padding: 8px 10px; text-align: right;">${totalPackageCost.toLocaleString('vi-VN')}đ</td>
                </tr>
            `;

            function actualPricePriceNote(base, count) {
                return `Đơn giá: ${Math.floor((base * 30) / count).toLocaleString('vi-VN')}đ/bạn (Dưới 30 bạn)`;
            }

            if (nightCost > 0) {
                tableHtml += `<tr><td style="padding: 8px 10px;">Phụ thu chụp Tối & Tâm sự</td><td style="padding: 8px; text-align: center;">${totalStudents}</td><td style="padding: 8px 10px; text-align: right;">${nightCost.toLocaleString('vi-VN')}đ</td></tr>`;
            }

            if (travelFee > 0) {
                tableHtml += `<tr><td style="padding: 8px 10px;">Phí di chuyển (${rawDistance}km -> Tính ${billableDistance}km)</td><td style="padding: 8px; text-align: center;">-</td><td style="padding: 8px 10px; text-align: right;">${travelFee.toLocaleString('vi-VN')}đ</td></tr>`;
            }

            extraItems.forEach(item => {
                if (item.isGift) {
                    tableHtml += `<tr><td style="padding: 8px 10px; color: #4ade80;"><i class="fa-solid fa-gift"></i> ${item.name}</td><td style="padding: 8px; text-align: center; color: #4ade80;">${item.qty}</td><td style="padding: 8px 10px; text-align: right; color: #4ade80;">0đ (Free)</td></tr>`;
                } else {
                    tableHtml += `<tr><td style="padding: 8px 10px;">${item.name}</td><td style="padding: 8px; text-align: center;">${item.qty}</td><td style="padding: 8px 10px; text-align: right;">${item.cost.toLocaleString('vi-VN')}đ</td></tr>`;
                }
            });

            if (discountValue > 0) {
                tableHtml += `<tr><td style="color: #4ade80; padding: 8px 10px;">${discountDesc}</td><td style="padding: 8px; text-align: center;">-</td><td style="color: #4ade80; padding: 8px 10px; text-align: right;">-${discountValue.toLocaleString('vi-VN')}đ</td></tr>`;
            }
            
            if(document.getElementById('invoiceTableBody')) document.getElementById('invoiceTableBody').innerHTML = tableHtml;
            if(document.getElementById('invTotal')) document.getElementById('invTotal').innerText = grandTotal.toLocaleString('vi-VN') + "đ";
            if(document.getElementById('invDeposit')) document.getElementById('invDeposit').innerText = "- " + DEPOSIT_VALUE.toLocaleString('vi-VN') + "đ";
            if(document.getElementById('invRemaining')) document.getElementById('invRemaining').innerText = remainingValue.toLocaleString('vi-VN') + "đ";

            // BẢNG TÓM TẮT Ở BƯỚC 7 (TRƯỚC KHI ĐẶT CỌC) - DÙNG CHUNG SỐ LIỆU, KHÔNG HIỂN THỊ PHẦN ĐÃ CỌC
            if(document.getElementById('preDepositInvoiceBody')) document.getElementById('preDepositInvoiceBody').innerHTML = tableHtml;
            if(document.getElementById('preDepositTotal')) document.getElementById('preDepositTotal').innerText = grandTotal.toLocaleString('vi-VN') + "đ";

            let timelineHtml = fixedTimelineRows.map(r => `
                <div class="inv-time-row" style="display: flex; gap: 12px; padding-bottom: 8px; border-bottom: 1px dashed rgba(223, 183, 108, 0.2);">
                    <div class="inv-time" style="color: var(--gold); font-weight: bold; font-family: monospace; min-width: 125px; font-size: 0.88rem;">${r.time}</div>
                    <div style="flex: 1;">
                        <div class="inv-act" style="color: #fff; font-weight: 500; font-size: 0.9rem;">${r.act}</div>
                        <div class="inv-desc" style="color: var(--text-muted); font-size: 0.8rem; margin-top: 2px;">
                            <i class="fa-solid fa-shirt"></i> ${r.outfit} &nbsp;|&nbsp; <i class="fa-solid fa-location-dot"></i> ${r.note}
                        </div>
                    </div>
                </div>
            `).join('');

            if(document.getElementById('invTimeline')) document.getElementById('invTimeline').innerHTML = timelineHtml;

            // LƯU ĐƠN HÀNG VÀO LOCALSTORAGE CHO ADMIN
            const orderRecord = {
                orderId: 'GD-' + Math.floor(100000 + Math.random() * 900000),
                createdAt: new Date().toLocaleDateString('vi-VN'),
                className: classVal,
                repName: repNameVal,
                repPhone: repPhoneVal,
                email: emailVal,
                totalStudents: totalStudents,
                packageName: packageName,
                grandTotal: grandTotal,
                date: document.getElementById('bkDate')?.value || "Chưa chọn",
                school: chosenLocArr.join(' | '),
                source: window.surveySource || sessionStorage.getItem('grandnang_survey_source') || 'Trực tiếp'
            };

            let allOrders = [];
            try {
                allOrders = JSON.parse(localStorage.getItem('grandnang_all_bookings') || '[]');
            } catch(e) {
                allOrders = [];
            }
            allOrders.unshift(orderRecord);
            localStorage.setItem('grandnang_all_bookings', JSON.stringify(allOrders));

            window.currentGrandTotal = grandTotal;

            const depositClassRaw = document.getElementById('bkClass')?.value || 'DEMO';
            const transferNote = `COC ${removeVietnameseTones(depositClassRaw || 'GRANDNANG')}`.trim().toUpperCase();

            if (document.getElementById('depositAmount')) document.getElementById('depositAmount').innerText = DEPOSIT_VALUE.toLocaleString('vi-VN') + 'đ';
            if (document.getElementById('depositRemaining')) document.getElementById('depositRemaining').innerText = remainingValue.toLocaleString('vi-VN') + 'đ';
            if (document.getElementById('depositNote')) document.getElementById('depositNote').innerText = transferNote;

            const qrImg = document.getElementById('depositQRImg');
            if (qrImg) {
                const bankBin = '970422';
                const accountNo = '171120062003';
                const accountName = 'VO HOANG NGHI';
                qrImg.src = `https://img.vietqr.io/image/${bankBin}-${accountNo}-qr_only.png?amount=${DEPOSIT_VALUE}&addInfo=${encodeURIComponent(transferNote)}&accountName=${encodeURIComponent(accountName)}`;
            }

            btnFinalSubmit.disabled = false;
            btnFinalSubmit.innerHTML = originalBtnHtml;

            step6.style.display = 'none';
            step7.style.display = 'block';
            bookingMainLayout.classList.remove('summary-mode');
            updateTrackerUI(7);
        });
    }

    const btnExportPDF = document.getElementById('btnExportPDF');
    if (btnExportPDF) {
        btnExportPDF.addEventListener('click', () => {
            const invoiceElement = document.querySelector('.invoice-container');
            if (!invoiceElement) return;

            if (typeof html2canvas === 'undefined') {
                alert('Không tải được thư viện xuất ảnh. Vui lòng kiểm tra kết nối mạng và thử lại!');
                return;
            }

            const originalBtnHtml = btnExportPDF.innerHTML;
            btnExportPDF.disabled = true;
            btnExportPDF.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tạo ảnh...';

            html2canvas(invoiceElement, {
                scale: 2.5,
                useCORS: true,
                backgroundColor: '#01120e',
                windowWidth: 1050,
                logging: false
            }).then(canvas => {
                const classNameInput = document.getElementById('bkClass');
                const safeClassName = (classNameInput && classNameInput.value ? classNameInput.value : 'KhachHang').replace(/[^a-zA-Z0-9À-ỹ]+/g, '');
                const link = document.createElement('a');
                link.download = `HoaDon_Grandnang_${safeClassName}.png`;
                link.href = canvas.toDataURL('image/png', 1.0);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                btnExportPDF.disabled = false;
                btnExportPDF.innerHTML = originalBtnHtml;
            }).catch(err => {
                console.error('Lỗi khi tạo ảnh hóa đơn:', err);
                alert('Rất tiếc, đã có lỗi xảy ra khi tạo ảnh hóa đơn. Vui lòng thử lại!');
                btnExportPDF.disabled = false;
                btnExportPDF.innerHTML = originalBtnHtml;
            });
        });
    }
}

// ================= HÀM ĐỔI SỐ THÀNH CHỮ TIẾNG VIỆT CHUẨN XÁC =================
function docSo(SoTien) {
    if (SoTien === 0) return "Không đồng";
    let ChuSo = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
    let Tien = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];

    function dochangchuc(so, daydu) {
        let textNum = "";
        let chuc = Math.floor(so / 10);
        let donvi = so % 10;
        if (chuc > 1) {
            textNum = " " + ChuSo[chuc] + " mươi";
            if (donvi === 1) textNum += " mốt";
            else if (donvi === 5) textNum += " lăm";
            else if (donvi > 0) textNum += " " + ChuSo[donvi];
        } else if (chuc === 1) {
            textNum = " mười";
            if (donvi === 1) textNum += " một";
            else if (donvi === 5) textNum += " lăm";
            else if (donvi > 0) textNum += " " + ChuSo[donvi];
        } else if (daydu && donvi > 0) {
            textNum = " lẻ " + ChuSo[donvi];
        }
        if (chuc === 0 && donvi > 0 && daydu) textNum = " " + ChuSo[donvi];
        return textNum;
    }

    let vi_tri = [];
    if (SoTien < 0) return "Số tiền âm!";
    if (SoTien === 0) return "Không đồng";

    vi_tri[0] = SoTien % 1000;
    SoTien = Math.floor(SoTien / 1000);
    vi_tri[1] = SoTien % 1000;
    SoTien = Math.floor(SoTien / 1000);
    vi_tri[2] = SoTien % 1000;
    SoTien = Math.floor(SoTien / 1000);
    vi_tri[3] = SoTien % 1000;

    let lan = 3;
    while (lan > 0 && vi_tri[lan] === 0) lan--;

    let ketqua = "";
    for (let i = lan; i >= 0; i--) {
        let blockVal = vi_tri[i];
        if (blockVal > 0) {
            let tram = Math.floor(blockVal / 100);
            let chuc = blockVal % 100;
            
            if (i < lan && blockVal < 100 && blockVal > 0) {
                ketqua += " không trăm";
                if (chuc < 10 && chuc > 0) {
                    ketqua += " lẻ";
                }
            } else if (tram > 0) {
                ketqua += " " + ChuSo[tram] + " trăm";
            }

            if (chuc > 0) {
                ketqua += dochangchuc(chuc, tram > 0 || (i < lan && blockVal < 100));
            }

            ketqua += " " + Tien[i];
        }
    }

    ketqua = ketqua.trim().replace(/\s+/g, ' ');
    return ketqua.substring(0, 1).toUpperCase() + ketqua.substring(1) + " đồng";
}

// ================= HÀM IN BẢN CỨNG A4 TRẮNG ĐEN =================
window.printBlackWhiteContract = function() {
    const invDate = document.getElementById('invDate')?.innerText || '';
    const invBranch = document.getElementById('invBranch')?.innerText || '';
    const cusName = document.getElementById('invCusName')?.innerText || '';
    const cusPhone = document.getElementById('invCusPhone')?.innerText || '';
    const cusEmail = document.getElementById('bkEmail')?.value || document.getElementById('invCusEmail')?.innerText || '';
    const cusClass = document.getElementById('invCusClass')?.innerText || '';
    const cusTotal = document.getElementById('invCusTotal')?.innerText || '';
    const cusSchool = document.getElementById('invCusSchool')?.innerText || '';
    const invTotal = document.getElementById('invTotal')?.innerText || '';
    
    const totalNum = window.currentGrandTotal || 0;
    const dot1Num = 2000000;
    const dot2Num = Math.max(0, totalNum - dot1Num);
    
    const dot1Str = dot1Num.toLocaleString('vi-VN') + " VNĐ";
    const dot2Str = dot2Num.toLocaleString('vi-VN') + " VNĐ";
    const dot1Text = docSo(dot1Num);
    const dot2Text = docSo(dot2Num);

    const tableBodyHtml = document.getElementById('invoiceTableBody')?.innerHTML || '';
    
    let timelinePrintHtml = '';
    if (typeof fixedTimelineRows !== 'undefined') {
        timelinePrintHtml = fixedTimelineRows.map(r => `
            <tr>
                <td style="border: 1px solid #000; padding: 5px 8px; font-family: monospace; font-weight: bold; width: 130px; text-align: center;">${r.time}</td>
                <td style="border: 1px solid #000; padding: 5px 8px; font-weight: bold;">${r.act}</td>
                <td style="border: 1px solid #000; padding: 5px 8px;">${r.outfit}</td>
                <td style="border: 1px solid #000; padding: 5px 8px;">${r.note}</td>
            </tr>
        `).join('');
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
            <title>Hop Dong Dich Vu Ky Yeu - ${cusClass}</title>
            <style>
                @page { size: A4; margin: 12mm 15mm; }
                body {
                    font-family: Arial, Helvetica, sans-serif;
                    color: #000000;
                    background: #ffffff;
                    line-height: 1.35;
                    font-size: 11pt;
                    margin: 0;
                    padding: 0;
                }
                .header-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
                .header-table td { vertical-align: top; border: none; font-size: 10.5pt; }
                .title-doc { text-align: center; text-transform: uppercase; font-size: 13pt; font-weight: bold; margin: 10px 0 3px 0; }
                .sub-title { text-align: center; font-style: italic; font-size: 10pt; margin-bottom: 12px; }
                .section-title { font-weight: bold; text-transform: uppercase; margin: 10px 0 5px 0; font-size: 10.5pt; border-bottom: 1.5px solid #000; padding-bottom: 2px; }
                .data-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
                .data-table th, .data-table td { border: 1px solid #000000; padding: 4px 6px; font-size: 10pt; }
                .data-table th { background-color: #e6e6e6; text-align: center; font-weight: bold; }
                .info-grid { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
                .info-grid td { border: none; padding: 3px 0; font-size: 10.5pt; }
                .clause-text { font-size: 10pt; text-align: justify; margin-bottom: 4px; }
                .sign-table { width: 100%; margin-top: 20px; border-collapse: collapse; }
                .sign-table td { border: none; text-align: center; vertical-align: top; font-size: 10.5pt; width: 50%; }
            </style>
        </head>
        <body>
            <table class="header-table">
                <tr>
                    <td style="text-align: left; width: 45%;">
                        <strong>GRANDNANG STUDIO</strong><br>
                        <em>Film & Cinematic Yearbook</em><br>
                        Hotline: 0913.196.356
                    </td>
                    <td style="text-align: center; width: 55%;">
                        <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br>
                        <span style="font-size: 10pt; font-weight: bold; text-decoration: underline;">Độc lập - Tự do - Hạnh phúc</span>
                    </td>
                </tr>
            </table>

            <div class="title-doc">BIÊN BẢN THỎA THUẬN & HỢP ĐỒNG ĐẶT LỊCH KỶ YẾU</div>
            <div class="sub-title">Số: GD-${Date.now().toString().slice(-6)} / HĐKY</div>

            <div class="section-title">I. THÔNG TIN CÁC BÊN THAM GIA</div>
            
            <p style="font-weight: bold; margin: 5px 0 3px 0; font-size: 10.5pt;">BÊN A (BÊN ĐẶT DỊCH VỤ):</p>
            <table class="info-grid" style="margin-bottom: 8px;">
                <tr>
                    <td style="width: 50%;"><strong>Đại diện lớp:</strong> ${cusName}</td>
                    <td style="width: 50%;"><strong>Số điện thoại:</strong> ${cusPhone}</td>
                </tr>
                <tr>
                    <td><strong>Email liên hệ:</strong> ${cusEmail}</td>
                    <td><strong>Lớp:</strong> ${cusClass} (Sĩ số: ${cusTotal})</td>
                </tr>
                <tr>
                    <td colspan="2"><strong>Địa điểm thực hiện:</strong> ${cusSchool}</td>
                </tr>
                <tr>
                    <td><strong>Ngày bấm máy dự kiến:</strong> ${invDate}</td>
                    <td><strong>Cơ sở phụ trách:</strong> ${invBranch}</td>
                </tr>
            </table>

            <p style="font-weight: bold; margin: 5px 0 3px 0; font-size: 10.5pt;">BÊN B (BÊN CUNG CẤP DỊCH VỤ CHỤP ẢNH KỶ YẾU):</p>
            <table class="data-table" style="margin-bottom: 12px;">
                <tr>
                    <td style="width: 25%; font-weight: bold;">Tên</td>
                    <td>Grandnang st – Chụp ảnh kỷ yếu Đà Nẵng</td>
                </tr>
                <tr>
                    <td style="font-weight: bold;">Đại diện</td>
                    <td>Võ Hoàng Nghi</td>
                </tr>
                <tr>
                    <td style="font-weight: bold;">Địa chỉ</td>
                    <td>Đà Nẵng / Hà Nội / TP. Hồ Chí Minh</td>
                </tr>
                <tr>
                    <td style="font-weight: bold;">Số điện thoại</td>
                    <td>0913196356</td>
                </tr>
                <tr>
                    <td style="font-weight: bold;">Số tài khoản</td>
                    <td>
                        Ngân hàng: MB Bank<br>
                        Số tài khoản: 171120062003<br>
                        Chủ tài khoản: Vo Hoang Nghi
                    </td>
                </tr>
            </table>

            <div class="section-title">II. DỰ TOÁN KINH PHÍ DỊCH VỤ</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="text-align: left;">Hạng mục dịch vụ</th>
                        <th style="width: 45px;">SL</th>
                        <th style="text-align: right; width: 110px;">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableBodyHtml}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="2" style="text-align: right; font-weight: bold;">TỔNG KINH PHÍ:</td>
                        <td style="text-align: right; font-weight: bold;">${invTotal}</td>
                    </tr>
                </tfoot>
            </table>

            <div class="section-title">III. PHƯƠNG THỨC THANH TOÁN (CHIA 2 ĐỢT)</div>
            <div class="clause-text">
                <strong>+ Đợt 1:</strong> Bên A đặt cọc cho bên B số tiền sau khi hợp đồng được ký.<br>
                &nbsp;&nbsp;&nbsp;&nbsp;- Số tiền: <strong>${dot1Str}</strong> (Bằng chữ: <em>${dot1Text}</em>).
            </div>
            <div class="clause-text">
                <strong>+ Đợt 2:</strong> Bên A thanh toán cho bên B số tiền: <strong>${dot2Str}</strong> (Bằng chữ: <em>${dot2Text}</em>) sau khi chụp xong.
            </div>

            <div class="section-title">IV. QUYỀN VÀ NGHĨA VỤ CỦA BÊN A (LỚP)</div>
            <div class="clause-text">
                1. Yêu cầu bên B thực hiện dịch vụ chụp ảnh như đã thỏa thuận với tinh thần nhiệt tình, trách nhiệm.<br>
                2. Có trách nhiệm bảo quản và trả đồ cho studio sau khi chụp xong. Nếu ở xa, bên B sẽ hỗ trợ gửi đồ về.<br>
                3. Thanh toán đầy đủ các chi phí theo thỏa thuận tại Điều III.<br>
                4. Việc tổ chức chụp ảnh do Bên A tự tổ chức, thống nhất của các thành viên và phụ huynh, mọi vấn đề phát sinh do Bên A hoàn toàn chịu trách nhiệm.
            </div>

            <div class="section-title">V. QUYỀN VÀ NGHĨA VỤ CỦA BÊN B (STUDIO)</div>
            <div class="clause-text">
                1. Được thanh toán đầy đủ các chi phí đã thỏa thuận; cung cấp đầy đủ dịch vụ cam kết.<br>
                2. Bàn giao trang phục cho bên A trước 1-2 ngày trước thời điểm ngày chụp diễn ra.<br>
                3. Lưu trữ toàn bộ file ảnh gốc và chỉnh sửa trong vòng 6 tháng kể từ ngày bàn giao hết file.<br>
                4. Trả toàn bộ file ảnh gốc và chỉnh sửa cho lớp sau từ 7-14 ngày kể từ ngày chụp.
            </div>

            <div class="section-title">VI. BẤT KHẢ KHÁNG & THAY ĐỔI LỊCH CHỤP</div>
            <div class="clause-text">
                - Trường hợp thiên tai, dịch bệnh hoặc bất khả kháng, hai bên dời lịch sang thời gian phù hợp (báo trước 07 ngày).<br>
                - Thời tiết không ủng hộ (mưa, bão) hoặc thi cử đột xuất được phép dời lịch nếu báo trước 05 ngày (trước khi nhận trang phục). Lịch dời do studio sắp xếp và báo trước 1 tuần.
            </div>

            <div class="section-title">VII. PHẠT HỢP ĐỒNG & ĐỀN BÙ TRANG PHỤC</div>
            <div class="clause-text">
                - Bên A không nhận lại cọc nếu do lỗi của Bên A hủy hợp đồng. Bên B hoàn cọc nếu đơn phương hủy không có lý do.<br>
                - Bên tự ý hủy hợp đồng ngoài mất cọc phải bồi thường 50% giá trị hợp đồng.<br>
                - <strong>Đền bù trang phục:</strong> Áo cử nhân: 250k/bộ | Cử nhân QT: 300k/bộ | Mũ/Bằng: 50k | Sơ mi: 200k | Quần: 300k | Cà vạt/Nơ: 50k | Vest 1 cúc: 300k | Vest 6 cúc: 400k | Súng bong bóng: 100k.
            </div>

            <table class="sign-table">
                <tr>
                    <td>
                        <strong>ĐẠI DIỆN TẬP THỂ LỚP (BÊN A)</strong><br>
                        <em>(Ký và ghi rõ họ tên)</em>
                        <br><br><br><br>
                        <strong>${cusName}</strong>
                    </td>
                    <td>
                        <strong>ĐẠI DIỆN GRANDNANG STUDIO (BÊN B)</strong><br>
                        <em>(Ký và ghi rõ họ tên)</em>
                        <br><br><br><br>
                        <strong>VO HOANG NGHI</strong>
                    </td>
                </tr>
            </table>

            <script>
                window.onload = function() {
                    window.print();
                };
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
};