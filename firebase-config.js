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
const storage = firebase.storage();

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

// --- Perfil / cabeçalho compartilhado (Firestore `usuarios` + Firebase Auth) ---

/** Nome principal para exibir (igual conceito da tela Perfil). */
function ecoPneusNomePerfilFirebase(user, d) {
    if (!user && !d) return 'Usuário';
    const doc = d || {};
    const em = user && user.email ? user.email.split('@')[0] : 'Usuário';
    if (doc.tipo === 'empresa') {
        return doc.razaoSocial || (user && user.displayName) || doc.nome || em;
    }
    return doc.nome || (user && user.displayName) || doc.razaoSocial || em;
}

/** Primeiro nome (chip compacto no header). */
function ecoPneusPrimeiroNome(nomeCompleto) {
    const partes = String(nomeCompleto || '').trim().split(/\s+/).filter(Boolean);
    return partes[0] || 'Usuário';
}

function ecoPneusIniciaisNome(nome = '') {
    const partes = String(nome).trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return 'US';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
}

/** Foto de perfil: doc Firestore tem prioridade sobre photoURL do Auth. */
function ecoPneusFotoPerfilFirebase(user, d) {
    const doc = d || {};
    if (typeof doc.perfilFotoDataUrl === 'string' && doc.perfilFotoDataUrl.length) return doc.perfilFotoDataUrl;
    if (typeof doc.fotoPerfilUrl === 'string' && doc.fotoPerfilUrl.length) return doc.fotoPerfilUrl;
    return (user && user.photoURL) || '';
}

/** Subtítulo do chip (cargo) — campo opcional `cargoTitulo` ou derivação por tipo de conta. */
function ecoPneusCargoChipFirebase(d) {
    const doc = d || {};
    if (typeof doc.cargoTitulo === 'string' && doc.cargoTitulo.trim()) return doc.cargoTitulo.trim();

    if (doc.tipo === 'pessoa') return 'Cliente Eco Pneus';
    if (doc.tipo === 'empresa') {
        const te = String(doc.tipoEmpresa || '').toLowerCase();
        if (te === 'transportadores') return 'Gestor logístico';
        if (te === 'recicladores') return 'Gestor da reciclagem';
        if (te === 'geradores') return 'Gestor ambiental';
    }
    return 'Gestor logístico';
}

/**
 * Preenche avatar circular (dashboard chip, páginas com #user-avatar).
 */
function ecoPneusAplicarAvatarElemento(el, fotoUrl, nomeCompleto) {
    if (!el) return;

    el.style.backgroundImage = '';
    el.style.backgroundSize = '';
    el.style.backgroundPosition = '';
    try {
        el.removeAttribute('aria-label');
    } catch (e2) {}

    const url = String(fotoUrl || '').trim();
    const safeUrl =
        url &&
        (url.indexOf('http') === 0 || url.indexOf('data:image') === 0 || url.indexOf('blob:') === 0);

    if (safeUrl) {
        el.style.backgroundImage = 'url(' + JSON.stringify(url) + ')';
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        el.textContent = '';
        el.setAttribute('aria-label', 'Foto de perfil');
        return;
    }

    el.textContent = ecoPneusIniciaisNome(nomeCompleto);
}

/**
 * Aplica nome, foto e cargo aos elementos típicos das páginas logadas.
 */
function ecoPneusAplicarHeaderPerfilFirebase(user, userDocData) {
    const nomeCompleto = ecoPneusNomePerfilFirebase(user, userDocData);
    const foto = ecoPneusFotoPerfilFirebase(user, userDocData);
    const cargo = ecoPneusCargoChipFirebase(userDocData);
    const primeiro = ecoPneusPrimeiroNome(nomeCompleto);
    const isDashboard = typeof document.body !== 'undefined' && document.body.getAttribute('data-page') === 'dashboard';

    const elWelcome = document.getElementById('user-name');
    if (elWelcome) elWelcome.textContent = isDashboard ? nomeCompleto : primeiro;

    const elChipShort = document.getElementById('user-short-name');
    if (elChipShort) elChipShort.textContent = primeiro;

    const elAvatarDash = document.getElementById('user-avatar');
    ecoPneusAplicarAvatarElemento(elAvatarDash, foto, nomeCompleto);

    ['user-chip-role', 'user-role'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = cargo;
    });
}
