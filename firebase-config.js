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

    const tc = ecoPneusResolveTipoConta(doc);
    if (tc === 'pessoa_fisica') return 'Cliente Eco Pneus';
    if (tc === 'transportadora') return 'Gestor logístico';
    if (tc === 'recicladora') return 'Gestor da reciclagem';
    if (tc === 'empresa') return 'Gestor ambiental';
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

// --- Código de confirmação (registrar / empresas) ---
function ecoPneusGerarCodigoConfirmacaoCliente() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let part = '';
    for (let i = 0; i < 4; i++) {
        part += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const part2 = Math.floor(1000 + Math.random() * 9000);
    return `EC-${part}-${part2}`;
}

// --- ViaCEP (perfil / endereço) ---
function ecoPneusBuscarCepBrasil(cepDigits) {
    const c = String(cepDigits || '').replace(/\D/g, '');
    if (c.length !== 8) {
        return Promise.reject(new Error('CEP deve ter 8 dígitos.'));
    }
    return fetch(`https://viacep.com.br/ws/${c}/json/`)
        .then((r) => r.json())
        .then((j) => {
            if (j.erro) throw new Error('CEP não encontrado.');
            return {
                cep: c,
                logradouro: j.logradouro || '',
                bairro: j.bairro || '',
                cidade: j.localidade || '',
                uf: (j.uf || '').toUpperCase()
            };
        });
}

/**
 * Salva ou atualiza avaliação de parceiro (uma por usuário).
 * Usa id de documento estável: parceiroId_avaliadorUid
 */
function ecoPneusSalvarAvaliacaoParceiro(parceiroId, user, estrelas, comentario) {
    if (!db || !parceiroId || !user || !user.uid) return Promise.reject(new Error('Dados inválidos'));
    const docId = `${String(parceiroId).replace(/\//g, '_')}_${user.uid}`;
    const ref = db.collection('avaliacoes').doc(docId);
    return ref.set(
        {
            parceiroId: String(parceiroId),
            empresaId: null,
            avaliadorId: user.uid,
            nomeAvaliador: user.displayName || 'Usuário',
            estrelas: Math.min(5, Math.max(1, Number(estrelas) || 0)),
            comentario: String(comentario || '').trim(),
            data: firebase.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
    );
}

/**
 * Normaliza tipo de conta usado nas permissões do app.
 * Valores: pessoa_fisica | empresa | transportadora | recicladora
 */
function ecoPneusResolveTipoConta(d) {
    const doc = d || {};
    const raw = String(doc.tipoConta || '').toLowerCase().trim();
    if (raw === 'pessoa_fisica' || raw === 'pessoa') return 'pessoa_fisica';
    if (raw === 'transportadora') return 'transportadora';
    if (raw === 'recicladora') return 'recicladora';
    if (raw === 'empresa') return 'empresa';

    if (doc.tipo === 'empresa' || doc.tipo === 'empresa_pf') {
        const te = String(doc.tipoEmpresa || '').toLowerCase();
        if (te === 'transportadores') return 'transportadora';
        if (te === 'recicladores') return 'recicladora';
        if (te === 'geradores') return 'empresa';
        return 'empresa';
    }
    if (doc.tipo === 'pessoa' || doc.tipo === 'pessoa_fisica') return 'pessoa_fisica';
    return 'pessoa_fisica';
}

/** Conta que pode aceitar coletas da rede, entrar em rota e finalizar (não pessoa física). */
function ecoPneusPodeOperarLogistica(tipoConta) {
    const t = String(tipoConta || '');
    return t === 'empresa' || t === 'transportadora' || t === 'recicladora';
}

/** Apenas o criador da coleta (uid) pode ver o código salvo no Firestore. */
function ecoPneusPodeVerCodigoConfirmacaoColeta(viewerUid, coletaData) {
    const uid = String(viewerUid || '').trim();
    if (!uid || !coletaData) return false;
    const criador = String(coletaData.uid || coletaData.criadorUid || '').trim();
    return criador === uid;
}

/** Conta de empresa que pode operar rede (recicladora / transportadora / geradora). */
function ecoPneusContaEmpresaRede(d) {
    return ecoPneusPodeOperarLogistica(ecoPneusResolveTipoConta(d));
}

/** tipoConta + tipoEmpresa gravados no Firestore ao cadastrar/editar empresa. */
function ecoPneusTipoContaFromTipoEmpresa(tipoEmpresaSlug) {
    const te = String(tipoEmpresaSlug || '').toLowerCase();
    if (te === 'transportadores') return 'transportadora';
    if (te === 'recicladores') return 'recicladora';
    if (te === 'geradores') return 'empresa';
    return 'empresa';
}

/**
 * Notificação in-app (subcoleção do usuário). Requer regras Firestore que permitam escrita/leitura.
 * Falha silenciosa se as regras bloquearem — a página Coletas também usa diff local + toasts.
 */
function ecoPneusCriarNotificacaoUsuario(toUid, payload) {
    if (!db || !toUid) return Promise.resolve(null);
    const ref = db.collection('usuarios').doc(toUid).collection('notificacoes').doc();
    return ref
        .set({
            tipo: String(payload.tipo || 'info'),
            titulo: String(payload.titulo || 'Eco Pneus'),
            mensagem: String(payload.mensagem || ''),
            coletaId: payload.coletaId || null,
            protocolo: String(payload.protocolo || ''),
            lida: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => ref.id)
        .catch(function () {
            return null;
        });
}
