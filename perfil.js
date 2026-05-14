/* ==========================================================
   ECO PNEUS - PERFIL (HTML/CSS iguais ao original)
   Persistência: Firebase Auth + Firestore (Storage só se foto > limite Firestore).
   ========================================================== */

(function () {
  'use strict';

  const icons = {
    'arrow-left': `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>`,
    settings: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-.33-1 1.65 1.65 0 0 0-1-.6 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 3.63 17l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1-.33H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1-.33 1.65 1.65 0 0 0 .6-1 1.65 1.65 0 0 0-.33-1.82L4.3 6.46A2 2 0 1 1 7.13 3.63l.06.06A1.65 1.65 0 0 0 9 4.6h0a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .33-1V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 .33 1 1.65 1.65 0 0 0 1 .6h0a1.65 1.65 0 0 0 1.82-.33l.06-.06A2 2 0 1 1 20.37 7.1l-.06.06A1.65 1.65 0 0 0 19.4 9v0a1.65 1.65 0 0 0 .6 1 1.65 1.65 0 0 0 1 .33H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1 .33 1.65 1.65 0 0 0-.51.34z"></path></svg>`,
    camera: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>`,
    edit: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path></svg>`,
    phone: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07A19.5 19.5 0 0 1 5.15 12.8 19.86 19.86 0 0 1 2.08 4.09 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.79.61 2.65a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.43-1.22a2 2 0 0 1 2.11-.45c.86.28 1.75.49 2.65.61A2 2 0 0 1 22 16.92z"></path></svg>`,
    'map-pin': `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
    lock: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
    logout: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><path d="M16 17l5-5-5-5"></path><path d="M21 12H9"></path></svg>`,
    trash: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>`,
    x: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"></path><path d="M6 6l12 12"></path></svg>`,
    user: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21a8 8 0 0 0-16 0"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
    briefcase: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"></path></svg>`,
    box: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><path d="M3.27 6.96L12 12.01l8.73-5.05"></path><path d="M12 22.08V12"></path></svg>`,
    clock: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>`,
    'check-circle': `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`,
    leaf: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 4 13C4 8 8 4 13 4c4 0 7 2 7 7 0 5-4 9-9 9z"></path><path d="M8 12c2-2 4-3 8-4"></path></svg>`
  };

  function applyIcons() {
    document.querySelectorAll('[data-icon]').forEach(function (node) {
      var iconName = node.getAttribute('data-icon');
      if (icons[iconName]) node.innerHTML = icons[iconName];
    });
  }

  applyIcons();

  var firebaseUser = null;
  var unsubUsuarioPerfil = null;

  /** @type {firebase.firestore.DocumentSnapshot | firebase.firestore.QueryDocumentSnapshot | null} último snapshot */
  var cachedUserSnap = null;

  var confirmAction = null;

  /** Mesmo objeto lógico do perfil anterior (usuário atual na tela) */
  var currentUser = null;

  var refs = {
    pageShell: document.getElementById('pageShell'),
    pageOverlay: document.getElementById('pageOverlay'),
    settingsDrawer: document.getElementById('settingsDrawer'),
    btnConfiguracoes: document.getElementById('btnConfiguracoes'),
    btnFecharDrawer: document.getElementById('btnFecharDrawer'),
    btnVoltar: document.getElementById('btnVoltar'),
    btnUploadFoto: document.getElementById('btnUploadFoto'),
    fotoInput: document.getElementById('fotoInput'),
    topbarAvatarBox: document.getElementById('topbarAvatarBox'),
    topbarAvatar: document.getElementById('topbarAvatar'),
    topbarAvatarFallback: document.getElementById('topbarAvatarFallback'),
    topbarUserName: document.getElementById('topbarUserName'),
    profileAvatarBox: document.getElementById('profileAvatarBox'),
    profileAvatar: document.getElementById('profileAvatar'),
    profileAvatarFallback: document.getElementById('profileAvatarFallback'),
    profileName: document.getElementById('profileName'),
    accountBadge: document.getElementById('accountBadge'),
    leftInfoStack: document.getElementById('leftInfoStack'),
    summaryGrid: document.getElementById('summaryGrid'),
    activityArea: document.getElementById('activityArea'),
    btnVerTodas: document.getElementById('btnVerTodas'),
    editModalBackdrop: document.getElementById('editModalBackdrop'),
    passwordModalBackdrop: document.getElementById('passwordModalBackdrop'),
    confirmModalBackdrop: document.getElementById('confirmModalBackdrop'),
    btnFecharEditModal: document.getElementById('btnFecharEditModal'),
    btnCancelarEdicao: document.getElementById('btnCancelarEdicao'),
    editForm: document.getElementById('editForm'),
    btnFecharPasswordModal: document.getElementById('btnFecharPasswordModal'),
    btnCancelarSenha: document.getElementById('btnCancelarSenha'),
    passwordForm: document.getElementById('passwordForm'),
    btnFecharConfirmModal: document.getElementById('btnFecharConfirmModal'),
    btnCancelConfirm: document.getElementById('btnCancelConfirm'),
    btnProceedConfirm: document.getElementById('btnProceedConfirm'),
    confirmTitle: document.getElementById('confirmTitle'),
    confirmText: document.getElementById('confirmText'),
    confirmEyebrow: document.getElementById('confirmEyebrow'),
    inputNome: document.getElementById('inputNome'),
    inputRazaoSocial: document.getElementById('inputRazaoSocial'),
    inputEmail: document.getElementById('inputEmail'),
    inputTelefone: document.getElementById('inputTelefone'),
    inputDocumento: document.getElementById('inputDocumento'),
    inputCompanyRole: document.getElementById('inputCompanyRole'),
    inputEndereco: document.getElementById('inputEndereco'),
    inputCidade: document.getElementById('inputCidade'),
    inputUF: document.getElementById('inputUF'),
    inputCreatedAt: document.getElementById('inputCreatedAt'),
    inputCep: document.getElementById('inputCep'),
    btnBuscarCep: document.getElementById('btnBuscarCep'),
    cepHint: document.getElementById('cep-hint'),
    groupStatusEmpresa: document.getElementById('groupStatusEmpresa'),
    inputStatus: document.getElementById('inputStatus'),
    groupRazaoSocial: document.getElementById('groupRazaoSocial'),
    groupDocumento: document.getElementById('groupDocumento'),
    groupCompanyRole: document.getElementById('groupCompanyRole'),
    groupEndereco: document.getElementById('groupEndereco'),
    inputSenhaAtual: document.getElementById('inputSenhaAtual'),
    inputNovaSenha: document.getElementById('inputNovaSenha'),
    inputConfirmarSenha: document.getElementById('inputConfirmarSenha'),
    toastStack: document.getElementById('toastStack')
  };

  function computeNivelSustentavel(totalColetas, isEmpresa) {
    var n = parseInt(totalColetas, 10) || 0;
    var score = n * 2 + (isEmpresa ? 8 : 0);
    if (score < 6) return 'Bronze';
    if (score < 18) return 'Prata';
    if (score < 40) return 'Ouro';
    return 'Platina';
  }

  function nivelBadgeClass(level) {
    var k = String(level || 'Bronze').toLowerCase();
    if (k === 'prata') return 'nivel-badge nivel-badge--prata';
    if (k === 'ouro') return 'nivel-badge nivel-badge--ouro';
    if (k === 'platina' || k === 'diamante') return 'nivel-badge nivel-badge--platina';
    return 'nivel-badge nivel-badge--bronze';
  }

  function mapTipoEmpresaToRole(te) {
    if (!te) return 'Gerador';
    var m = { geradores: 'Gerador', transportadores: 'Transportadora', recicladores: 'Recicladora' };
    return m[String(te).toLowerCase()] || 'Gerador';
  }

  function mapRoleToTipoEmpresa(role) {
    var m = { Gerador: 'geradores', Transportadora: 'transportadores', Recicladora: 'recicladores' };
    return m[role] || 'geradores';
  }

  function createdAtToYMD(v) {
    if (!v) return '';
    try {
      if (v.seconds) return new Date(v.seconds * 1000).toISOString().slice(0, 10);
      if (typeof v === 'string') return v.slice(0, 10);
      var d = new Date(v);
      return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
    } catch (e) {
      return '';
    }
  }

  function isGoogleOnlyAccount(user) {
    if (!user || !user.providerData || !user.providerData.length) return false;
    return user.providerData.every(function (p) {
      return p.providerId === 'google.com';
    });
  }

  function hasEmailPassword(user) {
    if (!user || !user.providerData) return false;
    return user.providerData.some(function (p) {
      return p.providerId === 'password';
    });
  }

  function authAccountCreatedYmd(user) {
    if (!user || !user.metadata || !user.metadata.creationTime) return '';
    try {
      return new Date(user.metadata.creationTime).toISOString().slice(0, 10);
    } catch (e) {
      return '';
    }
  }

  function buildCurrentUserFromFirebase(user, snap) {
    var d = snap && snap.exists ? snap.data() : {};
    cachedUserSnap = snap;

    var isEmpresa = d.tipo === 'empresa';
    var enderecoObj = d.endereco && typeof d.endereco === 'object' ? d.endereco : {};

    var address = String(enderecoObj.endereco || d.enderecoLinha || '').trim();
    var city = String(enderecoObj.cidade || d.cidade || '').trim();
    var state = String(enderecoObj.uf || enderecoObj.estado || d.uf || '').trim();

    var displayNomeEmpresa =
      d.razaoSocial ||
      user.displayName ||
      (user.email ? user.email.split('@')[0] : 'Usuário');
    var displayNomePF = d.nome || user.displayName || (user.email ? user.email.split('@')[0] : 'Usuário');
    var name = isEmpresa ? displayNomeEmpresa : displayNomePF;

    var photo =
      typeof d.perfilFotoDataUrl === 'string' && d.perfilFotoDataUrl.length
        ? d.perfilFotoDataUrl
        : typeof d.fotoPerfilUrl === 'string' && d.fotoPerfilUrl.length
          ? d.fotoPerfilUrl
          : '';

    var googlePhoto = '';
    if (!photo && user.photoURL) googlePhoto = user.photoURL;

    var firestoreYmd =
      typeof d.createdAt === 'string' && d.createdAt.length >= 10
        ? d.createdAt.slice(0, 10)
        : createdAtToYMD(d.criadoEm) || '';
    var authYmd = authAccountCreatedYmd(user);
    var createdYmd = authYmd || firestoreYmd;

    var tipoConta =
      typeof ecoPneusResolveTipoConta === 'function' ? ecoPneusResolveTipoConta(d) : isEmpresa ? 'empresa' : 'pessoa_fisica';

    return {
      id: user.uid,
      loginType: isGoogleOnlyAccount(user) && !hasEmailPassword(user) ? 'google' : 'normal',
      accountType: isEmpresa ? 'empresa' : 'pessoa_fisica',
      tipoConta: tipoConta,
      name: name,
      email: user.email || d.email || '',
      phone: formatPhoneDigits(d.telefone || ''),
      googlePhoto: googlePhoto,
      photo: photo,
      companyName: d.razaoSocial || '',
      companyRole: isEmpresa ? mapTipoEmpresaToRole(d.tipoEmpresa) : '',
      cnpj: d.cnpj || '',
      cpf: d.cpf || '',
      address: address || (typeof d.address === 'string' ? d.address : ''),
      city: city || (typeof d.city === 'string' ? d.city : ''),
      state: state || (typeof d.state === 'string' ? d.state : ''),
      createdAt: createdYmd,
      sustainableLevel: d.nivelSustentavel || d.sustainableLevel || 'Bronze',
      totalCollections:
        typeof d.totalColetasInformado === 'number' ? d.totalColetasInformado : parseInt(d.totalColetasInformado, 10) || 0,
      lastCollection: typeof d.ultimaColetaInformada === 'string' ? d.ultimaColetaInformada : '',
      password: '',
      cep: String(enderecoObj.cep || '')
        .replace(/\D/g, '')
        .slice(0, 8)
    };
  }

  function mergeCurrentFromDoc(snap, user) {
    currentUser = buildCurrentUserFromFirebase(user, snap);
    var d = snap && snap.exists ? snap.data() : {};
    currentUser.status = d.statusConta || d.status || 'Ativa';
  }

  function formatPhoneDigits(v) {
    return formatPhone(String(v || '').replace(/\D/g, '').slice(0, 11));
  }

  function formatPhone(value) {
    var digits = String(value || '').replace(/\D/g, '').slice(0, 11);
    if (!digits) return '';
    if (digits.length <= 2) return '(' + digits;
    if (digits.length <= 6) return '(' + digits.slice(0, 2) + ') ' + digits.slice(2);
    if (digits.length <= 10) return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 6) + '-' + digits.slice(6);
    return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 7) + '-' + digits.slice(7);
  }

  function getCurrentUser() {
    return currentUser;
  }

  /** Grava apenas camadas de dados (Firestore + Auth opcional); mantém objeto currentUser igual ao fluxo anterior */
  async function updateCurrentUser(patch) {
    if (!firebaseUser || !currentUser) return;
    Object.assign(currentUser, patch);

    try {
      if (firebaseUser && patch.email && patch.email !== firebaseUser.email) {
        await firebaseUser.updateEmail(patch.email);
      }
    } catch (err) {
      console.warn(err);
      showToast('E-mail pode exigir reautenticação para atualizar.', 'info');
    }

    try {
      if (firebaseUser && patch.name) await firebaseUser.updateProfile({ displayName: patch.name });
    } catch (e2) {}

    await writeCurrentUserFirestore();
  }

  async function writeCurrentUserFirestore() {
    var u = currentUser;
    if (!firebaseUser || !u) return;

    var cepDigits =
      String(u.cep || '')
        .replace(/\D/g, '')
        .slice(0, 8) ||
      (cachedUserSnap && cachedUserSnap.exists && cachedUserSnap.data().endereco
        ? String(cachedUserSnap.data().endereco.cep || '').replace(/\D/g, '').slice(0, 8)
        : '');

    /** @type {Record<string, unknown>} */
    var payload = {};

    var nColetas = parseInt(u.totalCollections, 10) || 0;
    var isEmp = u.accountType === 'empresa';
    var nivelAuto = computeNivelSustentavel(nColetas, isEmp);

    payload.email = u.email || '';
    payload.telefone = u.phone || '';
    payload.nivelSustentavel = nivelAuto;
    payload.statusConta = isEmp ? u.status || 'Ativa' : 'Ativa';
    payload.totalColetasInformado = nColetas;
    payload.ultimaColetaInformada = u.lastCollection || '';

    if (u.accountType === 'empresa') {
      payload.tipo = 'empresa';
      payload.tipoConta =
        typeof ecoPneusTipoContaFromTipoEmpresa === 'function'
          ? ecoPneusTipoContaFromTipoEmpresa(mapRoleToTipoEmpresa(u.companyRole || 'Gerador'))
          : 'empresa';
      payload.razaoSocial = u.companyName || u.name;
      payload.nome = u.companyName || u.name;
      payload.cnpj = u.cnpj || '';
      payload.tipoEmpresa = mapRoleToTipoEmpresa(u.companyRole || 'Gerador');
      payload.cpf = firebase.firestore.FieldValue.delete();
      payload.endereco = {
        endereco: u.address || '',
        cidade: u.city || '',
        uf: (u.state || '').toUpperCase(),
        cep: cepDigits
      };
    } else {
      payload.tipo = 'pessoa';
      payload.tipoConta = 'pessoa_fisica';
      payload.nome = u.name;
      payload.cpf = u.cpf || '';
      payload.cnpj = firebase.firestore.FieldValue.delete();
      payload.endereco = {
        endereco: u.address || '',
        cidade: u.city || '',
        uf: (u.state || '').toUpperCase(),
        cep: cepDigits
      };
    }

    if (u.photo && /^data:image\//.test(u.photo)) {
      if (u.photo.length < 780000) {
        payload.perfilFotoDataUrl = u.photo;
        payload.fotoPerfilUrl = firebase.firestore.FieldValue.delete();
      }
    } else if (u.photo && /^https?:\/\//.test(u.photo)) {
      payload.fotoPerfilUrl = u.photo;
      payload.perfilFotoDataUrl = firebase.firestore.FieldValue.delete();
      try {
        await firebaseUser.updateProfile({ photoURL: u.photo });
      } catch (_) {}
    }

    await db.collection('usuarios').doc(firebaseUser.uid).set(payload, { merge: true });

    var readBack = await db.collection('usuarios').doc(firebaseUser.uid).get();
    mergeCurrentFromDoc(readBack, firebaseUser);
    await syncColetasStats();
  }

  function formatDateBR(dateStr) {
    if (!dateStr) return '—';
    var parts = dateStr.split('-');
    if (parts.length < 3) return '—';
    var year = Number(parts[0]);
    var month = Number(parts[1]);
    var day = Number(parts[2]);
    var date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  }

  function initialsFromName(name) {
    if (!name) return 'U';
    var parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'U';
    return parts
      .slice(0, 2)
      .map(function (p) {
        return p[0].toUpperCase();
      })
      .join('');
  }

  function sanitize(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function openDrawer() {
    refs.pageShell.classList.add('drawer-open');
    refs.settingsDrawer.setAttribute('aria-hidden', 'false');
  }

  function closeDrawer() {
    refs.pageShell.classList.remove('drawer-open');
    refs.settingsDrawer.setAttribute('aria-hidden', 'true');
  }

  function openModal(backdrop) {
    backdrop.classList.add('active');
    backdrop.setAttribute('aria-hidden', 'false');
  }

  function closeModal(backdrop) {
    backdrop.classList.remove('active');
    backdrop.setAttribute('aria-hidden', 'true');
  }

  function showToast(message, type) {
    type = type || 'success';
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    refs.toastStack.appendChild(toast);

    setTimeout(function () {
      toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(function () {
        toast.remove();
      }, 280);
    }, 3200);
  }

  function renderAvatar(container, imgEl, fallbackEl, imageUrl, name) {
    var initials = initialsFromName(name);
    fallbackEl.textContent = initials;

    if (imageUrl) {
      imgEl.src = imageUrl;
      imgEl.alt = 'Foto de ' + name;
      container.classList.add('has-image');
    } else {
      imgEl.removeAttribute('src');
      container.classList.remove('has-image');
    }
  }

  function buildInfoMiniCard(label, value) {
    return (
      '<div class="info-mini-card">' +
      '<span class="label">' +
      sanitize(label) +
      '</span>' +
      '<span class="value">' +
      sanitize(value || '—') +
      '</span>' +
      '</div>'
    );
  }

  function renderLeftInfo() {
    var u = currentUser;
    var html = '';

    if (u.accountType === 'empresa') {
      if (u.cnpj) html += buildInfoMiniCard('CNPJ', u.cnpj);
      if (u.companyRole) html += buildInfoMiniCard('TIPO DE EMPRESA', u.companyRole);
    } else if (u.cpf) {
      html += buildInfoMiniCard('CPF', u.cpf);
    }

    html += buildInfoMiniCard('E-MAIL', u.email);
    html += buildInfoMiniCard('TELEFONE', u.phone || '—');

    if (u.address) {
      var fullAddr = u.address;
      if (u.city) fullAddr += ' — ' + u.city;
      if (u.state) fullAddr += '/' + u.state;
      html += buildInfoMiniCard('ENDEREÇO', fullAddr);
    }

    html += buildInfoMiniCard('CONTA CRIADA EM', formatDateBR(u.createdAt));

    refs.leftInfoStack.innerHTML = html;
  }

  function buildSummaryItem(iconName, label, value) {
    return (
      '<div class="summary-item">' +
      '<div class="summary-icon" data-icon="' +
      iconName +
      '"></div>' +
      '<span class="summary-label">' +
      sanitize(label) +
      '</span>' +
      '<div class="summary-value">' +
      sanitize(value || '—') +
      '</div>' +
      '</div>'
    );
  }

  function renderSummary() {
    var u = currentUser;
    var tipoLabel =
      u.tipoConta === 'transportadora'
        ? 'Transportadora'
        : u.tipoConta === 'recicladora'
          ? 'Recicladora'
          : u.accountType === 'empresa'
            ? u.companyRole || 'Empresa'
            : 'Pessoa Física';

    var totalCol = String(u.totalCollections || 0);
    var ultimaCol = u.lastCollection ? formatDateBR(u.lastCollection) : '—';
    var nivel = u.sustainableLevel || 'Bronze';
    var nivelHtml = '<span class="' + nivelBadgeClass(nivel) + '">' + sanitize(nivel) + '</span>';

    var statusHtml =
      u.accountType === 'empresa'
        ? sanitize(u.status || 'Ativa')
        : '<span class="status-badge-readonly">Ativo</span>';

    var html = '';
    html += buildSummaryItem('user', 'TIPO DA CONTA', tipoLabel);
    html += buildSummaryItem('box', 'COLETAS REALIZADAS', totalCol);
    html += buildSummaryItem('clock', 'ÚLTIMA COLETA', ultimaCol);
    html +=
      '<div class="summary-item">' +
      '<div class="summary-icon" data-icon="check-circle"></div>' +
      '<span class="summary-label">STATUS DA CONTA</span>' +
      '<div class="summary-value">' +
      statusHtml +
      '</div>' +
      '</div>';
    html +=
      '<div class="summary-item">' +
      '<div class="summary-icon" data-icon="leaf"></div>' +
      '<span class="summary-label">NÍVEL SUSTENTÁVEL</span>' +
      '<div class="summary-value">' +
      nivelHtml +
      '</div>' +
      '</div>';

    refs.summaryGrid.innerHTML = html;

    refs.summaryGrid.querySelectorAll('[data-icon]').forEach(function (node) {
      var iconName = node.getAttribute('data-icon');
      if (icons[iconName]) node.innerHTML = icons[iconName];
    });
  }

  function renderPage() {
    var u = getCurrentUser();

    if (!u) {
      showToast('Usuário não encontrado. Redirecionando...', 'error');
      setTimeout(function () {
        window.location.href = 'index.html';
      }, 1800);
      return;
    }

    var displayName = u.name || 'Usuário';
    var photoUrl = u.photo || u.googlePhoto || '';

    refs.topbarUserName.textContent = displayName;
    renderAvatar(refs.topbarAvatarBox, refs.topbarAvatar, refs.topbarAvatarFallback, photoUrl, displayName);
    renderAvatar(refs.profileAvatarBox, refs.profileAvatar, refs.profileAvatarFallback, photoUrl, displayName);

    refs.profileName.textContent = displayName;

    if (u.accountType === 'empresa') refs.accountBadge.textContent = (u.companyRole || 'EMPRESA').toUpperCase();
    else {
      var tc = u.tipoConta || 'pessoa_fisica';
      var mapa = {
        pessoa_fisica: 'PESSOA FÍSICA',
        empresa: 'EMPRESA',
        transportadora: 'TRANSPORTADORA',
        recicladora: 'RECICLADORA'
      };
      refs.accountBadge.textContent = mapa[tc] || 'PESSOA FÍSICA';
    }

    renderLeftInfo();
    renderSummary();
  }

  function coletaTimestampMillis(x) {
    var d = x && (x.criadoEm || x.data || x.createdAt);
    if (!d) return 0;
    if (typeof d.seconds === 'number') return d.seconds * 1000 + (d.nanoseconds || 0) / 1e6;
    var t = new Date(d).getTime();
    return isNaN(t) ? 0 : t;
  }

  function formatColetaDataCurta(x) {
    var d = x && (x.criadoEm || x.data || x.createdAt);
    if (!d) return '—';
    try {
      var dt = typeof d.seconds === 'number' ? new Date(d.seconds * 1000) : new Date(d);
      if (isNaN(dt.getTime())) return '—';
      return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(dt);
    } catch (e) {
      return '—';
    }
  }

  async function syncColetasStats() {
    if (!firebaseUser || typeof db === 'undefined' || !currentUser) return;
    try {
      var snap = await db.collection('coletas').where('uid', '==', firebaseUser.uid).get();
      var n = snap.size;
      var lastYmd = '';
      var best = 0;
      snap.forEach(function (doc) {
        var row = doc.data() || {};
        var t = coletaTimestampMillis(row);
        if (t > best) {
          best = t;
          var d = new Date(t);
          if (!isNaN(d.getTime())) {
            lastYmd =
              d.getFullYear() +
              '-' +
              String(d.getMonth() + 1).padStart(2, '0') +
              '-' +
              String(d.getDate()).padStart(2, '0');
          }
        }
      });
      currentUser.totalCollections = n;
      currentUser.lastCollection = lastYmd;
      var isEmp = currentUser.accountType === 'empresa';
      currentUser.sustainableLevel = computeNivelSustentavel(n, isEmp);
    } catch (e2) {
      console.warn(e2);
    }
  }

  async function loadActivityList() {
    if (!firebaseUser || !refs.activityArea) return;
    if (typeof db === 'undefined') {
      refs.activityArea.innerHTML = '<p>Nenhuma coleta registrada ainda.</p>';
      refs.activityArea.classList.add('activity-empty');
      return;
    }
    try {
      var snap = await db.collection('coletas').where('uid', '==', firebaseUser.uid).get();
      var rows = [];
      snap.forEach(function (doc) {
        rows.push(Object.assign({ id: doc.id }, doc.data()));
      });
      rows.sort(function (a, b) {
        return coletaTimestampMillis(b) - coletaTimestampMillis(a);
      });
      if (!rows.length) {
        refs.activityArea.innerHTML = '<p>Nenhuma coleta registrada ainda.</p>';
        refs.activityArea.classList.add('activity-empty');
        return;
      }
      refs.activityArea.classList.remove('activity-empty');
      refs.activityArea.innerHTML = rows
        .slice(0, 6)
        .map(function (r) {
          var qtd = Number(r.quantidade || r.qtd || 0);
          var st = String(r.status || 'Pendente');
          return (
            '<p class="activity-line"><strong>' +
            sanitize(String(qtd)) +
            ' pneus</strong> · ' +
            sanitize(st) +
            ' · ' +
            sanitize(formatColetaDataCurta(r)) +
            '</p>'
          );
        })
        .join('');
    } catch (err) {
      console.warn(err);
      refs.activityArea.innerHTML = '<p>Nenhuma coleta registrada ainda.</p>';
      refs.activityArea.classList.add('activity-empty');
    }
  }

  function fillEditForm() {
    var u = currentUser;
    var isEmpresa = u.accountType === 'empresa';

    refs.inputNome.value = u.name || '';
    refs.inputRazaoSocial.value = u.companyName || u.name || '';
    refs.inputEmail.value = u.email || '';
    refs.inputTelefone.value = u.phone || '';
    refs.inputDocumento.value = u.cnpj || u.cpf || '';
    refs.inputCompanyRole.value = u.companyRole || 'Gerador';
    refs.inputEndereco.value = u.address || '';
    refs.inputCidade.value = u.city || '';
    refs.inputUF.value = u.state || '';
    refs.inputCreatedAt.value = u.createdAt || '';
    if (refs.inputCep) {
      var cepRaw =
        cachedUserSnap && cachedUserSnap.exists && cachedUserSnap.data().endereco
          ? cachedUserSnap.data().endereco.cep || ''
          : '';
      refs.inputCep.value = formatCepDisplay(cepRaw);
    }
    if (refs.cepHint) refs.cepHint.textContent = '';

    if (refs.inputStatus) refs.inputStatus.value = u.status || 'Ativa';

    refs.groupRazaoSocial.style.display = isEmpresa ? '' : 'none';
    refs.groupDocumento.style.display = '';
    refs.groupCompanyRole.style.display = isEmpresa ? '' : 'none';
    refs.groupEndereco.style.display = '';
    if (refs.groupStatusEmpresa) refs.groupStatusEmpresa.style.display = isEmpresa ? '' : 'none';

    var docLabel = refs.groupDocumento.querySelector('label');
    if (docLabel) docLabel.textContent = isEmpresa ? 'CNPJ' : 'CPF';
  }

  function formatCepDisplay(digits) {
    var d = String(digits || '').replace(/\D/g, '').slice(0, 8);
    if (d.length <= 5) return d;
    return d.slice(0, 5) + '-' + d.slice(5);
  }

  async function saveEditForm(e) {
    e.preventDefault();

    var isEmpresa = currentUser.accountType === 'empresa';
    var patch = {
      name: refs.inputNome.value.trim(),
      email: refs.inputEmail.value.trim(),
      phone: refs.inputTelefone.value.trim(),
      address: refs.inputEndereco.value.trim(),
      city: refs.inputCidade.value.trim(),
      state: refs.inputUF.value.trim().toUpperCase(),
      status: isEmpresa && refs.inputStatus ? refs.inputStatus.value : 'Ativa',
      cep: refs.inputCep ? refs.inputCep.value.replace(/\D/g, '').slice(0, 8) : ''
    };

    if (isEmpresa) {
      patch.companyName = refs.inputRazaoSocial.value.trim();
      patch.name = refs.inputRazaoSocial.value.trim() || refs.inputNome.value.trim();
      patch.companyRole = refs.inputCompanyRole.value;
      patch.cnpj = refs.inputDocumento.value.trim();
    } else {
      patch.cpf = refs.inputDocumento.value.trim();
    }

    try {
      await updateCurrentUser(patch);
      closeModal(refs.editModalBackdrop);
      await syncColetasStats();
      renderPage();
      showToast('Perfil atualizado com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar no Firestore.', 'error');
    }
  }

  async function savePassword(e) {
    e.preventDefault();

    var senhaAtual = refs.inputSenhaAtual.value;
    var novaSenha = refs.inputNovaSenha.value;
    var confirmar = refs.inputConfirmarSenha.value;

    if (currentUser.loginType === 'google') {
      showToast('Contas Google não possuem senha local.', 'info');
      closeModal(refs.passwordModalBackdrop);
      return;
    }

    if (novaSenha.length < 6) {
      showToast('A nova senha deve ter pelo menos 6 caracteres.', 'error');
      return;
    }

    if (novaSenha !== confirmar) {
      showToast('As senhas não coincidem.', 'error');
      return;
    }

    if (!hasEmailPassword(firebaseUser)) {
      showToast('Contas Google não possuem senha local.', 'info');
      closeModal(refs.passwordModalBackdrop);
      return;
    }

    try {
      var cred = firebase.auth.EmailAuthProvider.credential(firebaseUser.email, senhaAtual);
      await firebaseUser.reauthenticateWithCredential(cred);
      await firebaseUser.updatePassword(novaSenha);
      refs.passwordForm.reset();
      closeModal(refs.passwordModalBackdrop);
      showToast('Senha alterada com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Senha atual incorreta ou sessão expirada.', 'error');
    }
  }

  async function handleFotoUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Selecione uma imagem válida.', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('A imagem deve ter no máximo 2MB.', 'error');
      return;
    }

    var reader = new FileReader();
    reader.onload = async function (event) {
      var result = event.target.result;
      if (!result || typeof result !== 'string') return;

      try {
        if (result.length < 780000) {
          await updateCurrentUser({ photo: result });
        } else {
          if (!firebase.storage) {
            showToast('Imagem grande demais para salvar.', 'error');
            return;
          }
          var refStorage = firebase
            .storage()
            .ref('perfis/' + firebaseUser.uid + '/' + Date.now() + '_' + file.name.replace(/\s+/g, '_'));
          await refStorage.put(file);
          var url = await refStorage.getDownloadURL();
          await updateCurrentUser({ photo: url });
        }
        renderPage();
        showToast('Foto atualizada!', 'success');
      } catch (err) {
        console.error(err);
        showToast('Não foi possível salvar a foto.', 'error');
      }
    };
    reader.readAsDataURL(file);
  }

  function showConfirm(eyebrow, title, text, btnLabel, action) {
    refs.confirmEyebrow.textContent = eyebrow;
    refs.confirmTitle.textContent = title;
    refs.confirmText.textContent = text;
    refs.btnProceedConfirm.textContent = btnLabel || 'Confirmar';
    confirmAction = action;
    openModal(refs.confirmModalBackdrop);
  }

  async function doLogout() {
    try {
      await auth.signOut();
    } catch (e) {}
    showToast('Sessão encerrada. Até logo!', 'info');
    setTimeout(function () {
      window.location.href = 'index.html';
    }, 1400);
  }

  async function doDeleteAccount() {
    if (!firebaseUser) return;
    try {
      await db.collection('usuarios').doc(firebaseUser.uid).delete();
    } catch (e) {
      console.warn(e);
    }
    try {
      await firebaseUser.delete();
      showToast('Conta excluída permanentemente.', 'error');
      setTimeout(function () {
        window.location.href = 'index.html';
      }, 1800);
    } catch (err) {
      console.error(err);
      showToast('Não foi possível excluir. Faça login novamente e tente de novo.', 'error');
    }
  }

  function handleDrawerAction(action) {
    closeDrawer();

    switch (action) {
      case 'editar-perfil-completo':
        fillEditForm();
        openModal(refs.editModalBackdrop);
        setTimeout(function () {
          refs.inputNome.focus();
        }, 200);
        break;

      case 'foto':
        setTimeout(function () {
          refs.fotoInput.click();
        }, 180);
        break;

      case 'nome':
        fillEditForm();
        openModal(refs.editModalBackdrop);
        setTimeout(function () {
          refs.inputNome.focus();
        }, 200);
        break;

      case 'telefone':
        fillEditForm();
        openModal(refs.editModalBackdrop);
        setTimeout(function () {
          refs.inputTelefone.focus();
        }, 200);
        break;

      case 'endereco':
        fillEditForm();
        openModal(refs.editModalBackdrop);
        setTimeout(function () {
          refs.inputEndereco.focus();
        }, 200);
        break;

      case 'senha':
        refs.passwordForm.reset();
        openModal(refs.passwordModalBackdrop);
        setTimeout(function () {
          refs.inputSenhaAtual.focus();
        }, 200);
        break;

      case 'logout':
        showConfirm(
          'SESSÃO',
          'Sair da conta?',
          'Você será desconectado desta sessão. Poderá entrar novamente a qualquer momento.',
          'Sair',
          doLogout
        );
        break;

      case 'delete':
        showConfirm(
          'ATENÇÃO',
          'Excluir conta permanentemente?',
          'Todos os seus dados serão removidos e esta ação não pode ser desfeita.',
          'Excluir conta',
          doDeleteAccount
        );
        break;

      default:
        break;
    }
  }

  refs.inputTelefone.addEventListener('input', function () {
    var digits = this.value.replace(/\D/g, '').slice(0, 11);
    this.value = formatPhone(digits);
  });

  refs.btnVoltar.addEventListener('click', function () {
    window.history.length > 1 ? window.history.back() : (window.location.href = 'index.html');
  });

  refs.btnConfiguracoes.addEventListener('click', openDrawer);
  refs.btnFecharDrawer.addEventListener('click', closeDrawer);
  refs.pageOverlay.addEventListener('click', closeDrawer);

  refs.btnBuscarCep?.addEventListener('click', async function () {
    if (!refs.inputCep) return;
    var d = refs.inputCep.value.replace(/\D/g, '');
    if (refs.cepHint) refs.cepHint.textContent = 'Buscando…';
    try {
      if (typeof ecoPneusBuscarCepBrasil !== 'function') throw new Error('CEP indisponível');
      var r = await ecoPneusBuscarCepBrasil(d);
      refs.inputEndereco.value = r.logradouro || '';
      refs.inputCidade.value = r.cidade || '';
      refs.inputUF.value = (r.uf || '').slice(0, 2);
      if (refs.cepHint) refs.cepHint.textContent = 'Endereço preenchido automaticamente.';
      showToast('CEP encontrado.', 'success');
    } catch (e) {
      if (refs.cepHint) refs.cepHint.textContent = e.message || 'CEP inválido.';
      showToast(refs.cepHint.textContent, 'error');
    }
  });

  refs.settingsDrawer.querySelectorAll('.drawer-item[data-action]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      handleDrawerAction(this.getAttribute('data-action'));
    });
  });

  refs.btnFecharEditModal.addEventListener('click', function () {
    closeModal(refs.editModalBackdrop);
  });
  refs.btnCancelarEdicao.addEventListener('click', function () {
    closeModal(refs.editModalBackdrop);
  });
  refs.editModalBackdrop.addEventListener('click', function (e) {
    if (e.target === refs.editModalBackdrop) closeModal(refs.editModalBackdrop);
  });

  refs.editForm.addEventListener('submit', saveEditForm);

  refs.btnFecharPasswordModal.addEventListener('click', function () {
    closeModal(refs.passwordModalBackdrop);
  });
  refs.btnCancelarSenha.addEventListener('click', function () {
    closeModal(refs.passwordModalBackdrop);
  });
  refs.passwordModalBackdrop.addEventListener('click', function (e) {
    if (e.target === refs.passwordModalBackdrop) closeModal(refs.passwordModalBackdrop);
  });

  refs.passwordForm.addEventListener('submit', savePassword);

  refs.btnFecharConfirmModal.addEventListener('click', function () {
    confirmAction = null;
    closeModal(refs.confirmModalBackdrop);
  });
  refs.btnCancelConfirm.addEventListener('click', function () {
    confirmAction = null;
    closeModal(refs.confirmModalBackdrop);
  });
  refs.confirmModalBackdrop.addEventListener('click', function (e) {
    if (e.target === refs.confirmModalBackdrop) {
      confirmAction = null;
      closeModal(refs.confirmModalBackdrop);
    }
  });

  refs.btnProceedConfirm.addEventListener('click', function () {
    closeModal(refs.confirmModalBackdrop);
    if (typeof confirmAction === 'function') {
      confirmAction();
      confirmAction = null;
    }
  });

  refs.btnUploadFoto.addEventListener('click', function () {
    refs.fotoInput.click();
  });

  refs.fotoInput.addEventListener('change', function () {
    if (this.files && this.files[0]) {
      handleFotoUpload(this.files[0]);
    }
    this.value = '';
  });

  refs.btnVerTodas.addEventListener('click', function () {
    window.location.href = 'coleta.html';
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;

    if (refs.confirmModalBackdrop.classList.contains('active')) {
      confirmAction = null;
      closeModal(refs.confirmModalBackdrop);
      return;
    }
    if (refs.editModalBackdrop.classList.contains('active')) {
      closeModal(refs.editModalBackdrop);
      return;
    }
    if (refs.passwordModalBackdrop.classList.contains('active')) {
      closeModal(refs.passwordModalBackdrop);
      return;
    }
    if (refs.pageShell.classList.contains('drawer-open')) {
      closeDrawer();
    }
  });

  auth.onAuthStateChanged(async function (user) {
    if (!user) {
      if (unsubUsuarioPerfil) {
        try {
          unsubUsuarioPerfil();
        } catch (e0) {}
        unsubUsuarioPerfil = null;
      }
      window.location.href = 'login.html';
      return;
    }
    firebaseUser = user;
    try {
      var refUser = db.collection('usuarios').doc(user.uid);
      var snap = await refUser.get();
      mergeCurrentFromDoc(snap, user);
      await syncColetasStats();
      renderPage();
      await loadActivityList();

      if (unsubUsuarioPerfil) {
        try {
          unsubUsuarioPerfil();
        } catch (e1) {}
        unsubUsuarioPerfil = null;
      }
      unsubUsuarioPerfil = refUser.onSnapshot(
        function (s2) {
          mergeCurrentFromDoc(s2, user);
          syncColetasStats()
            .then(function () {
              renderPage();
            })
            .catch(function () {
              renderPage();
            });
          loadActivityList();
        },
        function () {}
      );
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar perfil.', 'error');
    }
  });
})();
