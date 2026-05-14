// ============================================================
// ECO PNEUS - REGISTRAR COLETA (Fluxo Multi-Steps)
// ============================================================

let currentUser = null;
let currentUserData = null;
let currentStep = 1;

// Estado do formulário
const formState = {
    tipoPneu: 'Passeio',
    pesoUnitario: 8,        // KG/UN do tipo selecionado
    quantidade: 50,
    pesoEstimado: null,     // null = automático
    fotoFile: null,
    endereco: '',
    urgencia: 'normal',
    observacoes: '',
    responsavel: '',
    telefone: '',
    latitude: null,
    longitude: null,
    clientConfirmCode: ''
};

let regMap = null;
let regMarker = null;
let mapPickLat = -14.235;
let mapPickLng = -51.9253;

// Protocolo provisório (preview)
const protocoloProvisorio = 'EC-' + Math.floor(1000 + Math.random() * 9000);

// ============================================================
// AUTENTICAÇÃO
// ============================================================
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    currentUser = user;

    try {
        const doc = await db.collection('usuarios').doc(user.uid).get();
        if (doc.exists) currentUserData = doc.data();
    } catch (e) {
        console.log('Sem dados extras do usuário');
    }

    try {
        await migrarRascunhoLegacyLocalStorageParaFirestore(user);
    } catch (e2) {
        console.warn(e2);
    }

    // Pré-preencher responsável e telefone
    const respInput = document.getElementById('responsavel');
    const telInput = document.getElementById('telefone');
    if (respInput && user.displayName) respInput.value = user.displayName;
    if (telInput && currentUserData?.telefone) telInput.value = currentUserData.telefone;

    await initRegistrar();
});

// ============================================================
// INIT
// ============================================================
async function initRegistrar() {
    document.getElementById('protocol-preview').textContent = protocoloProvisorio;

    bindStepsNav();
    bindTireOptions();
    bindQuantityControls();
    bindWeightField();
    bindUploadField();
    bindAddressField();
    bindUrgencyCards();
    bindObservacoes();
    bindResponsavelTelefone();
    bindConfirmCheckbox();
    bindNavigationButtons();
    bindRascunho();
    bindRegistrarMapModals();
    await carregarRascunhoFirestore();

    // Inicializa cálculo de peso e summary
    recalcularPesoSugerido();
    atualizarSummary();
    atualizarReview();

    setTimeout(() => lucide.createIcons(), 50);
}

// ============================================================
// NAVEGAÇÃO ENTRE STEPS
// ============================================================
function bindStepsNav() {
    document.querySelectorAll('[data-step-nav]').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = parseInt(btn.dataset.stepNav);
            // Só permite avançar se passos anteriores estão validados
            if (target < currentStep) {
                irParaStep(target);
            } else if (target > currentStep) {
                if (validarStep(currentStep)) {
                    irParaStep(target);
                }
            }
        });
    });
}

function bindNavigationButtons() {
    const next1 = document.getElementById('btn-next-1');
    const next2 = document.getElementById('btn-next-2');
    const prev2 = document.getElementById('btn-prev-2');
    const prev3 = document.getElementById('btn-prev-3');
    const submit = document.getElementById('btn-submit');

    if (next1) next1.addEventListener('click', () => { if (validarStep(1)) irParaStep(2); });
    if (next2) next2.addEventListener('click', () => { if (validarStep(2)) irParaStep(3); });
    if (prev2) prev2.addEventListener('click', () => irParaStep(1));
    if (prev3) prev3.addEventListener('click', () => irParaStep(2));
    if (submit) submit.addEventListener('click', registrarColeta);
}

function irParaStep(step) {
    currentStep = step;

    // Atualiza cards
    document.querySelectorAll('.stage-card').forEach(card => {
        card.classList.toggle('active', parseInt(card.dataset.step) === step);
    });

    // Atualiza pills
    document.querySelectorAll('.step-pill').forEach(pill => {
        const n = parseInt(pill.dataset.stepNav);
        pill.classList.remove('active', 'completed');
        if (n === step) pill.classList.add('active');
        else if (n < step) pill.classList.add('completed');
    });

    if (step === 3) {
        atualizarReview();
        if (!formState.clientConfirmCode) {
            formState.clientConfirmCode =
                typeof ecoPneusGerarCodigoConfirmacaoCliente === 'function'
                    ? ecoPneusGerarCodigoConfirmacaoCliente()
                    : `EC-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
        }
        const el = document.getElementById('codigo-cliente-valor');
        if (el) el.textContent = formState.clientConfirmCode;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => lucide.createIcons(), 50);
}

function validarStep(step) {
    if (step === 1) {
        if (!formState.tipoPneu) {
            showToast('Selecione o tipo de pneu', 'error'); return false;
        }
        if (!formState.quantidade || formState.quantidade < 1) {
            showToast('Informe uma quantidade válida', 'error'); return false;
        }
        return true;
    }
    if (step === 2) {
        if (!formState.endereco.trim()) {
            showToast('Informe o endereço completo', 'error');
            document.getElementById('endereco')?.focus();
            return false;
        }
        if (!formState.urgencia) {
            showToast('Selecione o nível de urgência', 'error'); return false;
        }
        return true;
    }
    if (step === 3) {
        if (!formState.responsavel.trim()) {
            showToast('Informe o nome do responsável', 'error'); return false;
        }
        if (!formState.telefone.trim()) {
            showToast('Informe o telefone para contato', 'error'); return false;
        }
        if (!document.getElementById('confirmacaoFinal').checked) {
            showToast('Confirme as informações para continuar', 'error'); return false;
        }
        return true;
    }
    return true;
}

// ============================================================
// ETAPA 1 - TIPO PNEU
// ============================================================
function bindTireOptions() {
    document.querySelectorAll('.tire-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.tire-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            formState.tipoPneu = opt.dataset.type;
            formState.pesoUnitario = parseFloat(opt.dataset.weight) || 0;
            recalcularPesoSugerido();
            atualizarSummary();
            atualizarIconeSummary(opt.querySelector('.tire-icon i')?.dataset.lucide);
        });
    });
}

function atualizarIconeSummary(iconName) {
    const icon = document.querySelector('.summary-main-icon');
    if (icon && iconName) {
        icon.innerHTML = `<i data-lucide="${iconName}"></i>`;
        lucide.createIcons();
    }
}

// ============================================================
// QUANTIDADE
// ============================================================
function bindQuantityControls() {
    const input = document.getElementById('quantidade');
    const minus = document.getElementById('btn-minus');
    const plus = document.getElementById('btn-plus');

    minus?.addEventListener('click', () => {
        let v = parseInt(input.value) || 0;
        if (v > 1) input.value = v - 1;
        atualizarQuantidade();
    });

    plus?.addEventListener('click', () => {
        let v = parseInt(input.value) || 0;
        input.value = v + 1;
        atualizarQuantidade();
    });

    input?.addEventListener('input', atualizarQuantidade);

    document.querySelectorAll('.qty-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const add = parseInt(chip.dataset.add);
            input.value = add; // Substitui por valor exato (50, 100 etc)
            document.querySelectorAll('.qty-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            atualizarQuantidade();
        });
    });
}

function atualizarQuantidade() {
    const input = document.getElementById('quantidade');
    let v = parseInt(input.value) || 0;
    if (v < 1) v = 1;
    formState.quantidade = v;
    recalcularPesoSugerido();
    atualizarSummary();
}

// ============================================================
// PESO
// ============================================================
function bindWeightField() {
    const peso = document.getElementById('pesoEstimado');
    peso?.addEventListener('input', () => {
        const v = parseFloat(peso.value);
        formState.pesoEstimado = isNaN(v) || v <= 0 ? null : v;
        atualizarSummary();
    });
}

function recalcularPesoSugerido() {
    const sugerido = formState.quantidade * formState.pesoUnitario;
    const peso = document.getElementById('pesoEstimado');
    const hint = document.getElementById('peso-sugerido-texto');
    if (peso && !peso.value) {
        peso.placeholder = `Sugerido: ${sugerido} kg`;
    }
    if (hint) {
        hint.textContent = `Sugerido automaticamente: ${sugerido} kg (${formState.pesoUnitario} kg × ${formState.quantidade}).`;
    }
}

function getPesoFinal() {
    return formState.pesoEstimado ?? (formState.quantidade * formState.pesoUnitario);
}

// ============================================================
// UPLOAD FOTO
// ============================================================
function bindUploadField() {
    const input = document.getElementById('fotoInput');
    const filename = document.getElementById('upload-filename');

    input?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) {
            filename.textContent = 'Nenhum arquivo selecionado';
            formState.fotoFile = null;
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            showToast('Arquivo maior que 10MB', 'error');
            input.value = '';
            return;
        }
        formState.fotoFile = file;
        filename.textContent = `📎 ${file.name} (${(file.size/1024).toFixed(0)} KB)`;
    });
}

// ============================================================
// ETAPA 2 - ENDEREÇO E URGÊNCIA
// ============================================================
function bindAddressField() {
    const end = document.getElementById('endereco');
    end?.addEventListener('input', () => {
        formState.endereco = end.value;
        atualizarSummary();
    });
}

function bindUrgencyCards() {
    document.querySelectorAll('.urgency-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.urgency-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            formState.urgencia = card.dataset.urgency;
            atualizarSummary();
        });
    });
}

function bindObservacoes() {
    const obs = document.getElementById('observacoes');
    const counter = document.getElementById('obs-counter');
    obs?.addEventListener('input', () => {
        formState.observacoes = obs.value;
        if (counter) counter.textContent = `${obs.value.length}/300`;
    });
}

// ============================================================
// ETAPA 3 - RESPONSÁVEL / TELEFONE
// ============================================================
function bindResponsavelTelefone() {
    const resp = document.getElementById('responsavel');
    const tel = document.getElementById('telefone');

    resp?.addEventListener('input', () => {
        formState.responsavel = resp.value;
        atualizarSummary();
    });

    tel?.addEventListener('input', () => {
        mascaraTelefone(tel);
        formState.telefone = tel.value;
        atualizarSummary();
    });
}

function mascaraTelefone(input) {
    let v = input.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 10) {
        v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    } else if (v.length > 6) {
        v = `(${v.slice(0,2)}) ${v.slice(2,6)}-${v.slice(6)}`;
    } else if (v.length > 2) {
        v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    }
    input.value = v;
}

function bindConfirmCheckbox() {
    const cb = document.getElementById('confirmacaoFinal');
    const btn = document.getElementById('btn-submit');
    cb?.addEventListener('change', () => {
        if (btn) btn.disabled = !cb.checked;
    });
    if (btn) btn.disabled = !cb?.checked;
}

// ============================================================
// SUMMARY (sidebar) E REVIEW (etapa 3)
// ============================================================
function atualizarSummary() {
    const peso = getPesoFinal();
    const co2 = (peso * 2.7 / 1000).toFixed(2); // 1 kg pneu = ~2.7 kg CO2 evitado

    setText('summary-tipo', formState.tipoPneu);
    setText('summary-qtdpeso', `${formState.quantidade} unidades — ${peso} kg`);
    setText('summary-co2', `${co2} t`);
    setText('summary-urgencia', capitalize(formState.urgencia));
    setText('summary-endereco', formState.endereco || 'Pendente');
    setText('summary-janela', janelaPorUrgencia(formState.urgencia));
    setText('summary-responsavel', formState.responsavel || 'Pendente');
    setText('summary-contato', formState.telefone || 'Pendente');
}

function atualizarReview() {
    const peso = getPesoFinal();
    setText('review-tipo', formState.tipoPneu);
    setText('review-quantidade', `${formState.quantidade} unidades`);
    setText('review-peso', `${peso} kg`);
    setText('review-endereco', formState.endereco || 'Pendente');
    setText('review-urgencia', capitalize(formState.urgencia));
}

function janelaPorUrgencia(u) {
    if (u === 'baixa') return 'Próximos 7 dias';
    if (u === 'alta') return 'Hoje, 24h';
    return 'Próximas 72h';
}

function capitalize(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// ============================================================
// SUBMIT - REGISTRAR COLETA
// ============================================================
async function registrarColeta() {
    if (!validarStep(3)) return;

    const btn = document.getElementById('btn-submit');
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2"></i><span>Enviando...</span>';
    lucide.createIcons();

    const codigo = Math.floor(1000 + Math.random() * 9000);
    const protocoloFinal = 'EC-' + codigo;

    try {
        let fotoUrl = null;

        // Upload da foto (opcional)
        if (formState.fotoFile && typeof firebase !== 'undefined' && firebase.storage) {
            try {
                const storage = firebase.storage();
                const ref = storage.ref(`coletas/${currentUser.uid}/${Date.now()}_${formState.fotoFile.name}`);
                const snap = await ref.put(formState.fotoFile);
                fotoUrl = await snap.ref.getDownloadURL();
            } catch (err) {
                console.warn('Falha no upload da foto:', err);
            }
        }

        await db.collection('coletas').add({
            uid: currentUser.uid,
            criadorUid: currentUser.uid,
            nomeUsuario: currentUser.displayName || 'Usuario',
            tipoPneu: formState.tipoPneu,
            quantidade: Number(formState.quantidade),
            pesoEstimado: getPesoFinal(),
            endereco: formState.endereco,
            latitude: formState.latitude,
            longitude: formState.longitude,
            urgencia: formState.urgencia,
            observacoes: formState.observacoes || '',
            responsavel: formState.responsavel,
            telefone: formState.telefone,
            fotoUrl: fotoUrl,
            codigo: codigo,
            protocolo: protocoloFinal,
            codigoConfirmacaoCliente: formState.clientConfirmCode,
            disponivelParaRede: true,
            empresaResponsavelUid: null,
            status: 'Pendente',
            data: new Date()
        });

        await limparRascunhoFirestore();

        mostrarSucesso(protocoloFinal, formState.clientConfirmCode);
    } catch (e) {
        console.error(e);
        showToast('Erro ao registrar coleta. Tente novamente.', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="check-circle-2"></i><span>Confirmar coleta</span>';
        lucide.createIcons();
    }
}

function mostrarSucesso(protocolo, codigoCliente) {
    document.getElementById('register-shell').style.display = 'none';
    document.getElementById('success-protocol').textContent = '#' + protocolo;
    const cEl = document.getElementById('success-codigo-cliente');
    if (cEl) cEl.textContent = codigoCliente || '—';
    document.getElementById('success-screen').classList.remove('hidden');
    lucide.createIcons();

    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 3200);
}

// ============================================================
// RASCUNHO (Firestore doc usuários / rascunhoRegistrarColeta)
// ============================================================
function bindRascunho() {
    const btn = document.getElementById('btn-salvar-rascunho');
    btn?.addEventListener('click', salvarRascunhoFirestore);
}

function objetoRascunhoParaFirestore() {
    return {
        tipoPneu: formState.tipoPneu,
        pesoUnitario: formState.pesoUnitario,
        quantidade: formState.quantidade,
        pesoEstimado: formState.pesoEstimado,
        endereco: formState.endereco,
        urgencia: formState.urgencia,
        observacoes: formState.observacoes || '',
        responsavel: formState.responsavel,
        telefone: formState.telefone,
        savedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
}

async function salvarRascunhoFirestore() {
    if (!currentUser || typeof db === 'undefined') return;
    try {
        await db.collection('usuarios').doc(currentUser.uid).set(
            { rascunhoRegistrarColeta: objetoRascunhoParaFirestore() },
            { merge: true }
        );
        showToast('Rascunho salvo com sucesso!');
    } catch (e) {
        console.warn(e);
        showToast('Não foi possível salvar o rascunho', 'error');
    }
}

async function limparRascunhoFirestore() {
    if (!currentUser || typeof db === 'undefined') return;
    try {
        await db.collection('usuarios').doc(currentUser.uid).update({
            rascunhoRegistrarColeta: firebase.firestore.FieldValue.delete()
        });
    } catch (e) {
        console.warn(e);
    }
}

async function migrarRascunhoLegacyLocalStorageParaFirestore(user) {
    try {
        const raw = localStorage.getItem('ecoPneus_rascunho');
        if (!raw || !user) return;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return;

        localStorage.removeItem('ecoPneus_rascunho');

        const mig = {
            tipoPneu: parsed.tipoPneu,
            pesoUnitario: parsed.pesoUnitario,
            quantidade: parsed.quantidade,
            pesoEstimado: parsed.pesoEstimado,
            endereco: parsed.endereco,
            urgencia: parsed.urgencia,
            observacoes: parsed.observacoes || '',
            responsavel: parsed.responsavel,
            telefone: parsed.telefone,
            migratedFromLocalStorageAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('usuarios').doc(user.uid).set(
            { rascunhoRegistrarColeta: mig },
            { merge: true }
        );
    } catch (e) {
        console.warn('Migração rascunho localStorage:', e);
    }
}

function aplicarRascunhoNoFormulario(r) {
    if (!r || typeof r !== 'object') return;

    if (r.tipoPneu) {
        const opt = document.querySelector(`.tire-option[data-type="${r.tipoPneu}"]`);
        if (opt) opt.click();
    }
    if (r.quantidade != null && r.quantidade !== '') {
        const inp = document.getElementById('quantidade');
        if (inp) { inp.value = r.quantidade; atualizarQuantidade(); }
    }
    if (r.pesoEstimado != null && r.pesoEstimado !== '') {
        const p = document.getElementById('pesoEstimado');
        if (p) { p.value = r.pesoEstimado; formState.pesoEstimado = r.pesoEstimado; }
    }
    if (r.endereco) {
        const e = document.getElementById('endereco');
        if (e) { e.value = r.endereco; formState.endereco = r.endereco; }
    }
    if (r.urgencia) {
        const card = document.querySelector(`.urgency-card[data-urgency="${r.urgencia}"]`);
        if (card) card.click();
    }
    if (r.observacoes) {
        const o = document.getElementById('observacoes');
        if (o) { o.value = r.observacoes; formState.observacoes = r.observacoes; }
        const counter = document.getElementById('obs-counter');
        if (counter) counter.textContent = `${String(r.observacoes).length}/300`;
    }
    if (r.responsavel) {
        const resp = document.getElementById('responsavel');
        if (resp) { resp.value = r.responsavel; formState.responsavel = r.responsavel; }
    }
    if (r.telefone) {
        const tel = document.getElementById('telefone');
        if (tel) { tel.value = r.telefone; formState.telefone = r.telefone; }
    }
    atualizarSummary();
}

async function carregarRascunhoFirestore() {
    if (!currentUser || typeof db === 'undefined') return;
    try {
        const docSnap = await db.collection('usuarios').doc(currentUser.uid).get();
        if (!docSnap.exists) return;
        const raw = docSnap.data()?.rascunhoRegistrarColeta;
        aplicarRascunhoNoFormulario(raw || null);
    } catch (e) {
        console.warn('Erro ao carregar rascunho', e);
    }
}

// ============================================================
// TOAST
// ============================================================
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast' + (type === 'error' ? ' error' : '');
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================================
// MAPA (modal) + confirmação de endereço
// ============================================================
function bindRegistrarMapModals() {
    const openBtn = document.getElementById('btn-open-map-modal');
    const backdrop = document.getElementById('registrar-map-backdrop');
    const closeBtn = document.getElementById('registrar-map-close');
    const cancelBtn = document.getElementById('registrar-map-cancel');
    const confirmBtn = document.getElementById('registrar-map-confirm');
    const addrBd = document.getElementById('registrar-address-backdrop');
    const addrClose = document.getElementById('registrar-address-close');
    const addrBack = document.getElementById('registrar-address-back');
    const addrOk = document.getElementById('registrar-address-ok');
    const preview = document.getElementById('registrar-address-preview');
    const loading = document.getElementById('registrar-address-loading');
    const copyBtn = document.getElementById('btn-copy-codigo-cliente');

    function openMap() {
        backdrop?.classList.add('active');
        setTimeout(() => {
            if (typeof L === 'undefined') {
                showToast('Mapa indisponível. Recarregue a página.', 'error');
                return;
            }
            if (!regMap) {
                regMap = L.map('registrar-leaflet-map', { zoomControl: true }).setView([mapPickLat, mapPickLng], 5);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '© OSM'
                }).addTo(regMap);
                regMarker = L.marker([mapPickLat, mapPickLng], { draggable: true }).addTo(regMap);
                regMarker.on('dragend', () => {
                    const ll = regMarker.getLatLng();
                    mapPickLat = ll.lat;
                    mapPickLng = ll.lng;
                });
                regMap.on('click', (e) => {
                    mapPickLat = e.latlng.lat;
                    mapPickLng = e.latlng.lng;
                    regMarker.setLatLng(e.latlng);
                });
            } else {
                regMap.invalidateSize();
                regMarker.setLatLng([mapPickLat, mapPickLng]);
            }
        }, 120);
        lucide.createIcons();
    }

    function closeMap() {
        backdrop?.classList.remove('active');
    }

    openBtn?.addEventListener('click', () => openMap());
    closeBtn?.addEventListener('click', closeMap);
    cancelBtn?.addEventListener('click', closeMap);
    backdrop?.addEventListener('click', (e) => {
        if (e.target === backdrop) closeMap();
    });

    confirmBtn?.addEventListener('click', async () => {
        if (regMarker) {
            const ll = regMarker.getLatLng();
            mapPickLat = ll.lat;
            mapPickLng = ll.lng;
        }
        closeMap();
        addrBd?.classList.add('active');
        if (preview) preview.textContent = 'Buscando endereço…';
        if (loading) loading.style.display = 'block';
        let texto = `${mapPickLat.toFixed(5)}, ${mapPickLng.toFixed(5)}`;
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${mapPickLat}&lon=${mapPickLng}`;
            const res = await fetch(url, { headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' } });
            const j = await res.json();
            const a = j.address || {};
            const parts = [
                [a.road, a.house_number].filter(Boolean).join(' '),
                a.suburb || a.neighbourhood,
                a.city || a.town || a.village,
                a.state,
                'Brasil'
            ].filter(Boolean);
            if (parts.length) texto = parts.join(' — ');
            else if (j.display_name) texto = j.display_name;
        } catch (err) {
            console.warn(err);
        }
        if (loading) loading.style.display = 'none';
        if (preview) preview.textContent = texto;
        lucide.createIcons();
    });

    addrClose?.addEventListener('click', () => addrBd?.classList.remove('active'));
    addrBack?.addEventListener('click', () => {
        addrBd?.classList.remove('active');
        openMap();
    });
    addrBd?.addEventListener('click', (e) => {
        if (e.target === addrBd) addrBd.classList.remove('active');
    });

    addrOk?.addEventListener('click', () => {
        const txt = preview?.textContent?.trim() || '';
        formState.endereco = txt;
        formState.latitude = mapPickLat;
        formState.longitude = mapPickLng;
        const inp = document.getElementById('endereco');
        if (inp) inp.value = txt;
        atualizarSummary();
        addrBd?.classList.remove('active');
        showToast('Endereço aplicado ao formulário.');
    });

    copyBtn?.addEventListener('click', async () => {
        const v = formState.clientConfirmCode || document.getElementById('codigo-cliente-valor')?.textContent;
        if (!v) return;
        try {
            await navigator.clipboard.writeText(v);
            showToast('Código copiado.');
        } catch (e) {
            showToast('Não foi possível copiar.', 'error');
        }
    });
}

// ============================================================
// INIT (caso auth demore)
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
});
