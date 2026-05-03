// ============================================================
// ECO PNEUS - Firebase Configuration (Shared)
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyCnO3B_Px9KkQUl79MVq3zcxwoxa3x87XU",
    authDomain: "eco-pneus.firebaseapp.com",
    projectId: "eco-pneus",
    storageBucket: "eco-pneus.firebasestorage.app",
    messagingSenderId: "621224107269",
    appId: "1:621224107269:web:13cd1e804ee275621b2b6c"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// --- Toast notification helper ---
function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3200);
}

// --- Loading button helper ---
function setLoading(btn, loading) {
    if (loading) {
        btn.dataset.originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner"></span>';
        btn.disabled = true;
        btn.style.opacity = '0.8';
    } else {
        btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
        btn.disabled = false;
        btn.style.opacity = '1';
    }
}
