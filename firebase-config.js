/* ============================================================
   FIREBASE CONFIG — GRANDNANG STUDIO
   Dán config thật từ Firebase Console vào đây:
   Project Settings → General → "Your apps" → SDK setup and configuration
   (apiKey KHÔNG phải bí mật, an toàn khi để trong file JS phía client —
   bảo mật thật sự nằm ở Firestore Security Rules, không phải ở apiKey)
   ============================================================ */
const firebaseConfig = {
    apiKey: "AIzaSyA2ojRDf_TlW0bhwqivhbTFhod0DDagtvY",
    authDomain: "grandnang-studio.firebaseapp.com",
    projectId: "grandnang-studio",
    storageBucket: "grandnang-studio.firebasestorage.app",
    messagingSenderId: "178468996597",
    appId: "1:178468996597:web:e289bfa7a29a557b030cbc",
    measurementId: "G-73NFVJE80W"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

/* ============================================================
   CLOUDINARY — upload ảnh (không cần thẻ ngân hàng)
   Dùng ở admin.js khi Admin bấm nút "Tải ảnh lên"
   ============================================================ */
const CLOUDINARY_CLOUD_NAME = "r8goy7y9";
const CLOUDINARY_UPLOAD_PRESET = "grandnang_upload";

/**
 * Upload 1 file ảnh lên Cloudinary, trả về Promise<string> (secure_url của ảnh).
 * Dùng: const url = await uploadImageToCloudinary(fileInput.files[0]);
 */
async function uploadImageToCloudinary(file) {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const res = await fetch(url, { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) {
        // Cloudinary trả lỗi cụ thể trong data.error.message (vd: "Upload preset not found")
        const detail = (data && data.error && data.error.message) ? data.error.message : `HTTP ${res.status}`;
        throw new Error('Cloudinary: ' + detail);
    }
    return data.secure_url;
}