// ============================================================
// ECO PNEUS - COLETAS / HISTÓRICO OPERACIONAL
// Compatível com dados vindos de:
// - registrar.js
// - coletac.js
// Requer:
// - firebase-config.js com auth e db
// - lucide
// ============================================================

const appState = {
    currentUser: null,
    currentUserData: null,
    allColetas: [],
    visibleColetas: [],
    activeFilter: 'all',
    activeSort: 'recent',
    searchTerm: '',
    expandedIds: new Set(),
    currentModalCode: '',
    unsubscribeColetas: null,
    unsubscribeColetasEmpresa: null,
    unsubscribeDisponiveis: null,
    unsubscribeUsuarioDoc: null,
    tipoConta: 'pessoa_fisica',
    empresaRede: false,
    disponiveisTimer: null,
    empresaAceiteColetaId: null,
    empresaCompleteColetaId: null,
    /** Map id -> fingerprint (status|empresaUid) para diff em tempo real */
    coletaFingerprints: {},
    coletasRealtimePrimed: false,
    disponiveisPrimed: false,
    disponiveisIds: new Set(),
    skipColetaDiffToasts: false
};

// ------------------------------------------------------------
// INIT
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    bindStaticUI();
    bindEmpresaRedeUI();
    safeCreateIcons();
    initAuth();
});

// ------------------------------------------------------------
// AUTH
// ------------------------------------------------------------
function initAuth() {
    if (typeof auth === 'undefined' || typeof db === 'undefined') {
        showToast('Erro ao carregar autenticação ou banco de dados.', 'error');
        return;
    }

    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            stopColetaListeners();
            stopDisponiveisListener();
            stopUsuarioDocListener();
            if (typeof EcoPneusGlobalNotifs !== 'undefined') EcoPneusGlobalNotifs.stop();
            if (appState.disponiveisTimer) {
                clearInterval(appState.disponiveisTimer);
                appState.disponiveisTimer = null;
            }
            window.location.href = 'login.html';
            return;
        }

        appState.currentUser = user;
        await loadUserHeader(user);
        startUsuarioDocListener(user);
        if (typeof EcoPneusGlobalNotifs !== 'undefined') {
            EcoPneusGlobalNotifs.start(user);
            EcoPneusGlobalNotifs.registerBell(document.getElementById('notif-bell-btn'));
        }
        await initEmpresaRedeMode(user);
        startRealtimeColetasListener();
    });
}

function stopUsuarioDocListener() {
    if (appState.unsubscribeUsuarioDoc) {
        try {
            appState.unsubscribeUsuarioDoc();
        } catch (e) {}
        appState.unsubscribeUsuarioDoc = null;
    }
}

function startUsuarioDocListener(user) {
    stopUsuarioDocListener();
    if (!user || typeof db === 'undefined') return;
    try {
        appState.unsubscribeUsuarioDoc = db
            .collection('usuarios')
            .doc(user.uid)
            .onSnapshot(
                (snap) => {
                    const d = snap.exists ? snap.data() || {} : {};
                    appState.currentUserData = d;
                    appState.tipoConta =
                        typeof ecoPneusResolveTipoConta === 'function' ? ecoPneusResolveTipoConta(d) : 'pessoa_fisica';
                    document.body.classList.toggle('coletas-pf', appState.tipoConta === 'pessoa_fisica');
                    document.body.classList.toggle('coletas-logistica', appState.tipoConta !== 'pessoa_fisica');
                    if (typeof ecoPneusAplicarHeaderPerfilFirebase === 'function') {
                        ecoPneusAplicarHeaderPerfilFirebase(user, d);
                    }
                    initEmpresaRedeMode(user).then(() => renderAll());
                },
                () => {}
            );
    } catch (e) {
        appState.unsubscribeUsuarioDoc = null;
    }
}

async function loadUserHeader(user) {
    let extraData = null;

    try {
        const userDoc = await db.collection('usuarios').doc(user.uid).get();
        if (userDoc.exists) {
            extraData = userDoc.data();
            appState.currentUserData = extraData;
        }
    } catch (error) {
        console.warn('Não foi possível carregar dados extras do usuário:', error);
    }

    if (typeof ecoPneusAplicarHeaderPerfilFirebase === 'function') {
        ecoPneusAplicarHeaderPerfilFirebase(user, extraData || {});
    } else {
        const userNameEl = document.getElementById('user-name');
        const avatarEl = document.getElementById('user-avatar');
        const displayName =
            user.displayName ||
            extraData?.nome ||
            extraData?.razaoSocial ||
            (user.email ? user.email.split('@')[0] : 'Usuário');
        if (userNameEl) userNameEl.textContent = displayName.split(' ')[0];
        if (avatarEl) avatarEl.textContent = getInitials(displayName);
    }

    if (extraData && typeof ecoPneusResolveTipoConta === 'function') {
        appState.tipoConta = ecoPneusResolveTipoConta(extraData);
        document.body.classList.toggle('coletas-pf', appState.tipoConta === 'pessoa_fisica');
        document.body.classList.toggle('coletas-logistica', appState.tipoConta !== 'pessoa_fisica');
    }
}

// ------------------------------------------------------------
// FIRESTORE REALTIME (criador + empresa responsável)
// ------------------------------------------------------------
const _mineDocs = new Map();
const _empresaDocs = new Map();

function stopColetaListeners() {
    if (appState.unsubscribeColetas) {
        try {
            appState.unsubscribeColetas();
        } catch (e) {}
        appState.unsubscribeColetas = null;
    }
    if (appState.unsubscribeColetasEmpresa) {
        try {
            appState.unsubscribeColetasEmpresa();
        } catch (e) {}
        appState.unsubscribeColetasEmpresa = null;
    }
    _mineDocs.clear();
    _empresaDocs.clear();
}

let _coletaMergeDebounceTimer = null;

function mergeColetaDocMaps() {
    if (_coletaMergeDebounceTimer) clearTimeout(_coletaMergeDebounceTimer);
    _coletaMergeDebounceTimer = setTimeout(() => {
        _coletaMergeDebounceTimer = null;
        mergeColetaDocMapsImmediate();
    }, 220);
}

function mergeColetaDocMapsImmediate() {
    const merged = new Map();
    _mineDocs.forEach((doc, id) => merged.set(id, doc));
    _empresaDocs.forEach((doc, id) => merged.set(id, doc));
    const prevList = appState.allColetas.slice();
    const nextList = [];
    merged.forEach((doc) => {
        const n = normalizeColeta(doc);
        if (n) nextList.push(n);
    });

    if (!appState.coletasRealtimePrimed) {
        appState.allColetas = nextList;
        appState.coletasRealtimePrimed = true;
        renderAll();
        setRefreshLoading(false);
        touchUpdatedLabel();
        return;
    }

    detectRealtimeColetaEvents(prevList, nextList);
    appState.allColetas = nextList;
    renderAll();
    setRefreshLoading(false);
    touchUpdatedLabel();
}

function startRealtimeColetasListener(showSuccessToast = false) {
    if (!appState.currentUser) return;

    stopColetaListeners();
    appState.coletasRealtimePrimed = false;

    const refreshBtn = document.getElementById('refresh-btn');
    setRefreshLoading(true);

    const uid = appState.currentUser.uid;
    const onErr = (error) => {
        console.error('Erro ao carregar coletas:', error);
        setRefreshLoading(false);
        showToast('Erro ao carregar as coletas.', 'error');
    };

    appState.unsubscribeColetas = db
        .collection('coletas')
        .where('uid', '==', uid)
        .onSnapshot(
            (snapshot) => {
                _mineDocs.clear();
                snapshot.forEach((doc) => _mineDocs.set(doc.id, doc));
                mergeColetaDocMaps();
                if (showSuccessToast) {
                    showToast('Coletas atualizadas com sucesso.');
                }
            },
            onErr
        );

    appState.unsubscribeColetasEmpresa = db
        .collection('coletas')
        .where('empresaResponsavelUid', '==', uid)
        .onSnapshot(
            (snapshot) => {
                _empresaDocs.clear();
                snapshot.forEach((doc) => _empresaDocs.set(doc.id, doc));
                mergeColetaDocMaps();
            },
            onErr
        );

    touchUpdatedLabel();
}

function stopDisponiveisListener() {
    if (appState.unsubscribeDisponiveis) {
        try {
            appState.unsubscribeDisponiveis();
        } catch (e) {}
        appState.unsubscribeDisponiveis = null;
    }
    appState.disponiveisPrimed = false;
    appState.disponiveisIds.clear();
}

function startDisponiveisRealtime() {
    stopDisponiveisListener();
    if (!appState.empresaRede || !appState.currentUser) return;

    const host = document.getElementById('empresa-disponiveis-list');
    if (!host) return;

    const uid = appState.currentUser.uid;

    appState.unsubscribeDisponiveis = db
        .collection('coletas')
        .where('status', '==', 'Pendente')
        .limit(80)
        .onSnapshot(
            (snap) => {
                const rows = [];
                const nextIds = new Set();
                snap.forEach((doc) => {
                    const x = doc.data() || {};
                    const criador = x.uid || x.criadorUid || '';
                    const aberta = x.disponivelParaRede !== false;
                    const jaTem = x.empresaResponsavelUid;
                    if (!aberta || jaTem) return;
                    if (criador === uid) return;
                    nextIds.add(doc.id);
                    rows.push({ id: doc.id, ...x });
                });

                if (appState.disponiveisPrimed) {
                    nextIds.forEach((id) => {
                        if (!appState.disponiveisIds.has(id)) {
                            showToast('Nova coleta disponível na rede.');
                            pushNotification({
                                titulo: 'Nova coleta na rede',
                                mensagem: 'Há uma nova solicitação compatível com sua operação.',
                                tipo: 'rede',
                                coletaId: id,
                                protocolo: ''
                            });
                        }
                    });
                }
                appState.disponiveisIds = nextIds;
                appState.disponiveisPrimed = true;

                rows.sort((a, b) => {
                    const ta = parseFirestoreDateLoose(a.data || a.criadoEm)?.getTime() || 0;
                    const tb = parseFirestoreDateLoose(b.data || b.criadoEm)?.getTime() || 0;
                    return tb - ta;
                });

                if (!rows.length) {
                    host.innerHTML =
                        '<p class="empresa-disponiveis-empty">Nenhuma coleta disponível no momento.</p>';
                    safeCreateIcons();
                    return;
                }

                host.innerHTML = rows
                    .slice(0, 16)
                    .map((c) => {
                        const end = escapeHtml(String(c.endereco || 'Endereço não informado').slice(0, 120));
                        const tipo = escapeHtml(String(c.tipoPneu || c.tipo || 'Pneus'));
                        const qtd = Number(c.quantidade || 0);
                        const nomeCriador = escapeHtml(String(c.nomeUsuario || 'Usuário'));
                        const when = parseFirestoreDateLoose(c.data || c.criadoEm);
                        const whenStr = when
                            ? when.toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                              })
                            : '—';
                        const proto = escapeHtml(String(c.protocolo || c.codigo || 'Coleta'));
                        return `
                    <div class="empresa-coleta-row eco-card-lift">
                        <div>
                            <strong>${proto}</strong>
                            <small>${tipo} · ${qtd} un. · ${nomeCriador}</small>
                            <small style="display:block;margin-top:4px;">${end}</small>
                            <small style="display:block;opacity:.85;">${whenStr}</small>
                        </div>
                        <div class="empresa-coleta-actions">
                            <button type="button" class="btn-eco-sm btn-eco-sm--lime" data-aceite-id="${escapeHtml(c.id)}">Aceitar</button>
                        </div>
                    </div>
                `;
                    })
                    .join('');
                safeCreateIcons();
            },
            (e) => {
                console.warn(e);
                host.innerHTML =
                    '<p class="empresa-disponiveis-err">Não foi possível carregar a lista. Verifique a conexão.</p>';
            }
        );
}

function detectRealtimeColetaEvents(prevList, nextList) {
    const uid = appState.currentUser?.uid;
    if (!uid) return;

    const prevMap = new Map(prevList.map((c) => [c.id, c]));

    for (const cur of nextList) {
        const prev = prevMap.get(cur.id);
        const creatorUid = String(cur.criadorUid || cur.raw?.uid || cur.raw?.criadorUid || '');
        const empUid = String(cur.empresaResponsavelUid || cur.raw?.empresaResponsavelUid || '');
        const isCreator = creatorUid === uid;
        const isAssignedEmpresa = empUid === uid;

        if (!prev) {
            if (isAssignedEmpresa) {
                const proto = cur.protocolo || 'Coleta';
                pushNotification({
                    titulo: 'Coleta no seu painel',
                    mensagem: `${proto} foi atribuída à sua empresa.`,
                    tipo: 'atribuida',
                    coletaId: cur.id,
                    protocolo: proto
                });
                showToast(`Coleta ${proto} apareceu no seu histórico.`);
            }
            continue;
        }

        const statusChanged = prev.status !== cur.status;
        const empChanged = (prev.empresaResponsavelUid || '') !== (cur.empresaResponsavelUid || '');

        if (!statusChanged && !empChanged) continue;

        if (isCreator) {
            if (prev.status === 'pendente' && cur.status === 'em_rota') {
                const nomeEmp = cur.empresaResponsavelNome || 'Uma empresa parceira';
                const msg = `${nomeEmp} aceitou sua coleta ${cur.protocolo}.`;
                showToast(msg);
                pushNotification({
                    titulo: 'Coleta aceita',
                    mensagem: msg,
                    tipo: 'coleta_aceita',
                    coletaId: cur.id,
                    protocolo: cur.protocolo
                });
            } else if (cur.status === 'concluida' && prev.status !== 'concluida') {
                const msg = `Coleta ${cur.protocolo} foi concluída.`;
                showToast(msg);
                pushNotification({
                    titulo: 'Coleta concluída',
                    mensagem: msg,
                    tipo: 'coleta_concluida',
                    coletaId: cur.id,
                    protocolo: cur.protocolo
                });
            } else if (statusChanged) {
                showToast(`Status atualizado: ${cur.protocolo} → ${cur.statusLabel}.`);
                pushNotification({
                    titulo: 'Status da coleta',
                    mensagem: `${cur.protocolo}: ${cur.statusLabel}.`,
                    tipo: 'status',
                    coletaId: cur.id,
                    protocolo: cur.protocolo
                });
            }
        } else if (isAssignedEmpresa && statusChanged && cur.status === 'concluida' && prev.status !== 'concluida') {
            if (!appState.skipColetaDiffToasts) {
                showToast(`Coleta ${cur.protocolo} sincronizada como concluída.`);
            }
        }
    }
}

function touchUpdatedLabel() {
    const el = document.getElementById('coletas-updated-label');
    if (!el) return;
    const t = new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(new Date());
    el.textContent = `Atualizado às ${t}`;
}

function pushNotification({ titulo, mensagem, tipo, coletaId, protocolo }) {
    const uid = appState.currentUser?.uid;
    if (uid && typeof ecoPneusCriarNotificacaoUsuario === 'function') {
        ecoPneusCriarNotificacaoUsuario(uid, {
            titulo: titulo || 'Eco Pneus',
            mensagem: mensagem || '',
            tipo: tipo || 'info',
            coletaId: coletaId || null,
            protocolo: protocolo || ''
        }).catch(() => {});
    }
    if (typeof EcoPneusGlobalNotifs !== 'undefined') EcoPneusGlobalNotifs.refresh();
}

// ------------------------------------------------------------
// UI BINDINGS
// ------------------------------------------------------------
function bindStaticUI() {
    const filterTabs = document.getElementById('filter-tabs');
    const sortSelect = document.getElementById('sort-select');
    const searchInput = document.getElementById('search-input');
    const refreshBtn = document.getElementById('refresh-btn');
    const cardsGrid = document.getElementById('cards-grid');

    const modalBackdrop = document.getElementById('code-modal-backdrop');
    const modalClose = document.getElementById('code-modal-close');
    const copyCodeBtn = document.getElementById('copy-code-btn');

    filterTabs?.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-tab');
        if (!btn) return;

        appState.activeFilter = btn.dataset.filter || 'all';
        updateFilterTabsUI();
        renderAll();
    });

    sortSelect?.addEventListener('change', () => {
        appState.activeSort = sortSelect.value || 'recent';
        renderAll();
    });

    searchInput?.addEventListener('input', () => {
        appState.searchTerm = searchInput.value.trim();
        renderAll();
    });

    refreshBtn?.addEventListener('click', () => {
        startRealtimeColetasListener(true);
    });

    cardsGrid?.addEventListener('click', (e) => {
        const detailsBtn = e.target.closest('[data-action="details"]');
        const trackBtn = e.target.closest('[data-action="track"]');
        const codeBtn = e.target.closest('[data-action="code"]');

        if (detailsBtn) {
            const id = detailsBtn.dataset.id;
            toggleExpanded(id);
            return;
        }

        if (trackBtn) {
            const id = trackBtn.dataset.id;
            handleTrackAction(id);
            return;
        }

        if (codeBtn) {
            const id = codeBtn.dataset.id;
            const coleta = appState.allColetas.find(item => item.id === id);
            if (coleta) openCodeModal(coleta);
            return;
        }

        const completeBtn = e.target.closest('[data-action="complete"]');
        if (completeBtn) {
            const id = completeBtn.dataset.id;
            openEmpresaCompleteModal(id);
            return;
        }
    });

    modalClose?.addEventListener('click', closeCodeModal);
    copyCodeBtn?.addEventListener('click', copyCurrentModalCode);

    modalBackdrop?.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) closeCodeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeCodeModal();
    });
}

// ------------------------------------------------------------
// NORMALIZAÇÃO DOS DADOS
// ------------------------------------------------------------
function normalizeColeta(doc) {
    const data = doc.data() || {};

    const status = normalizeStatus(data.status);
    const quantidade = toNumber(
        data.quantidade ??
        data.qtd ??
        data.totalPneus ??
        0
    );

    const peso = toNumber(
        data.pesoEstimado ??
        data.peso ??
        data.pesoKg ??
        0
    );

    const protocolo = getProtocolDisplay(data, doc.id);
    const codigoConfirmacao = getConfirmationCodeFromFirestore(data);
    const endereco = String(data.endereco || '').trim();
    const cidade = getCidadeFromEndereco(endereco);

    const tipo = String(
        data.tipoPneu ||
        data.tipo ||
        'Não informado'
    ).trim();

    const urgencia = normalizeUrgencia(data.urgencia);
    const responsavel = String(
        data.responsavel ||
        data.nomeUsuario ||
        data.empresa ||
        data.nomeEmpresa ||
        data.razaoSocial ||
        data.email ||
        'Não informado'
    ).trim();

    const telefone = String(data.telefone || '').trim();
    const observacoes = String(data.observacoes || '').trim();
    const createdAt = parseFirestoreDate(
        data.criadoEm ||
        data.data ||
        data.createdAt ||
        data.created_at ||
        null
    );

    const impactoCo2Kg = resolveImpactoCo2Kg(data, quantidade, peso);

    const title = getCardTitle(data, endereco, responsavel, cidade);
    const subtitle = buildSubtitle(tipo, urgencia);

    return {
        id: doc.id,
        raw: data,

        protocolo,
        codigoConfirmacao,

        status,
        statusLabel: getStatusLabel(status),

        tipo,
        urgencia,
        urgenciaLabel: getUrgenciaLabel(urgencia),

        quantidade,
        peso,
        impactoCo2Kg,

        endereco,
        cidade,
        responsavel,
        telefone,
        observacoes,

        title,
        subtitle,
        createdAt,

        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        fotoUrl: data.fotoUrl || '',

        empresaResponsavelUid: data.empresaResponsavelUid || null,
        empresaResponsavelNome: String(data.empresaResponsavelNome || '').trim(),
        disponivelParaRede: data.disponivelParaRede !== false,
        criadorUid: data.criadorUid || data.uid || null,
        codigoConfirmacaoCliente: data.codigoConfirmacaoCliente || ''
    };
}

function normalizeStatus(value) {
    const v = normalizeString(value);

    if (
        v.includes('conclu') ||
        v.includes('finaliz') ||
        v.includes('entreg')
    ) return 'concluida';

    if (
        v.includes('rota') ||
        v.includes('transito') ||
        v.includes('transit') ||
        v.includes('despach')
    ) return 'em_rota';

    return 'pendente';
}

function normalizeUrgencia(value) {
    const v = normalizeString(value);

    if (v.includes('alta') || v.includes('urgente')) return 'alta';
    if (v.includes('baixa')) return 'baixa';
    return 'normal';
}

function getProtocolDisplay(data, docId) {
    const protocolo = data.protocolo;
    const codigo = data.codigo;

    if (typeof protocolo === 'string' && protocolo.trim()) {
        return protocolo.trim();
    }

    if (typeof codigo === 'string' && codigo.trim()) {
        return codigo.trim();
    }

    if (typeof codigo === 'number') {
        return `EC-${String(codigo).padStart(4, '0')}`;
    }

    const shortId = String(docId || '0000').slice(0, 6).toUpperCase();
    return `EC-${shortId}`;
}

function getConfirmationCodeFromFirestore(data) {
    const provided =
        data.codigoConfirmacaoCliente ||
        data.confirmacaoCodigo ||
        data.codigoConfirmacao ||
        data.confirmationCode ||
        data.chaveConfirmacao ||
        '';
    if (typeof provided === 'string' && provided.trim().length >= 4) {
        return provided.trim().toUpperCase();
    }
    return '';
}

function resolveImpactoCo2Kg(data, quantidade, peso) {
    const valorSalvo = toNumber(data.impactoCo2Kg ?? data.co2Kg ?? 0);
    if (valorSalvo > 0) return Math.round(valorSalvo);

    if (quantidade > 0) return Math.round(quantidade * 2);
    if (peso > 0) return Math.round(peso * 0.1);

    return 0;
}

function getCardTitle(data, endereco, responsavel, cidade) {
    const possibleTitle =
        data.empresa ||
        data.nomeEmpresa ||
        data.razaoSocial ||
        data.parceiro ||
        data.localNome ||
        '';

    if (String(possibleTitle).trim()) {
        return String(possibleTitle).trim();
    }

    if (cidade && cidade.length >= 3) {
        const firstPart = getAddressPrimaryLine(endereco);
        if (firstPart && firstPart.length <= 28) return firstPart;
        return `Coleta em ${cidade}`;
    }

    if (responsavel && responsavel !== 'Não informado') {
        return responsavel;
    }

    const enderecoBase = getAddressPrimaryLine(endereco);
    if (enderecoBase) return enderecoBase;

    return 'Ponto de Coleta';
}

function buildSubtitle(tipo, urgencia) {
    return `${tipo} • urgência ${getUrgenciaLabel(urgencia).toLowerCase()}`;
}

// ------------------------------------------------------------
// FILTRO / BUSCA / ORDENAÇÃO
// ------------------------------------------------------------
function renderAll() {
    applyFilterTabVisibility();
    updateSummary();
    updateCounts();
    updateColetaFlowUI();

    const filtered = applyFilterSearchSort(appState.allColetas);
    appState.visibleColetas = filtered;

    renderCards(filtered);
    updateResultsCount(filtered.length);
    toggleEmptyState(filtered.length === 0);
    updateFilterTabsUI();
    safeCreateIcons();
}

function updateColetaFlowUI() {
    const fill = document.getElementById('coletas-flow-fill');
    const steps = document.querySelectorAll('.coletas-flow-step');
    if (!fill || !steps.length) return;

    const list = appState.allColetas;
    const n = list.length;
    let pct = 14;
    let activeIdx = 0;

    if (n > 0) {
        const pend = list.filter((c) => c.status === 'pendente').length;
        const rota = list.filter((c) => c.status === 'em_rota').length;
        const ok = list.filter((c) => c.status === 'concluida').length;
        pct = Math.round(((ok * 100 + rota * 66 + pend * 30) / n) * 0.9 + 10);

        if (rota > 0) activeIdx = 1;
        if (ok === n) activeIdx = 2;
        else if (pend === 0 && rota === 0 && ok > 0) activeIdx = 2;
    }

    fill.style.width = `${Math.min(100, Math.max(10, pct))}%`;

    steps.forEach((el, i) => {
        el.classList.toggle('active', i === activeIdx);
        el.classList.toggle('done', i < activeIdx);
    });
}

function applyFilterSearchSort(items) {
    let result = [...items];

    if (appState.activeFilter !== 'all') {
        result = result.filter(item => item.status === appState.activeFilter);
    }

    if (appState.searchTerm) {
        const term = normalizeString(appState.searchTerm);

        result = result.filter(item => {
            const haystack = normalizeString([
                item.protocolo,
                item.title,
                item.subtitle,
                item.statusLabel,
                item.tipo,
                item.urgenciaLabel,
                item.endereco,
                item.cidade,
                item.responsavel,
                item.telefone,
                item.observacoes
            ].join(' '));

            return haystack.includes(term);
        });
    }

    result.sort((a, b) => sortColetas(a, b, appState.activeSort));

    return result;
}

function sortColetas(a, b, mode) {
    if (mode === 'oldest') {
        return getTime(a.createdAt) - getTime(b.createdAt);
    }

    if (mode === 'quantity_desc') {
        return (b.quantidade || 0) - (a.quantidade || 0);
    }

    if (mode === 'weight_desc') {
        return (b.peso || 0) - (a.peso || 0);
    }

    if (mode === 'name_asc') {
        return String(a.title).localeCompare(String(b.title), 'pt-BR', { sensitivity: 'base' });
    }

    if (mode === 'status_priority') {
        const priority = {
            em_rota: 0,
            pendente: 1,
            concluida: 2
        };

        const diff = (priority[a.status] ?? 99) - (priority[b.status] ?? 99);
        if (diff !== 0) return diff;

        return getTime(b.createdAt) - getTime(a.createdAt);
    }

    // recent
    return getTime(b.createdAt) - getTime(a.createdAt);
}

// ------------------------------------------------------------
// RENDER DOS CARDS
// ------------------------------------------------------------
function renderCards(items) {
    const grid = document.getElementById('cards-grid');
    if (!grid) return;

    grid.innerHTML = items.map((item, idx) => {
        const expanded = appState.expandedIds.has(item.id);
        const addressLine = item.endereco || 'Endereço não informado';
        const uid = appState.currentUser?.uid || '';
        const podeVerCodigo =
            uid &&
            typeof ecoPneusPodeVerCodigoConfirmacaoColeta === 'function' &&
            ecoPneusPodeVerCodigoConfirmacaoColeta(uid, item.raw || {});
        const podeConcluir =
            appState.empresaRede &&
            appState.currentUser &&
            item.status === 'em_rota' &&
            String(item.raw.empresaResponsavelUid || '') === appState.currentUser.uid;
        const stDelay = Math.min(idx, 12) * 45;

        const codeBtn = podeVerCodigo
            ? `<button
                            class="card-btn code"
                            type="button"
                            data-action="code"
                            data-id="${escapeHtml(item.id)}"
                            title="Ver código de confirmação"
                            aria-label="Ver código de confirmação"
                        >
                            <i data-lucide="key-round"></i>
                        </button>`
            : '';

        return `
            <article class="collection-card coleta-card-reveal status-${item.status} ${expanded ? 'expanded' : ''}" data-id="${escapeHtml(item.id)}" style="--coleta-reveal-delay:${stDelay}ms">
                <div class="status-rail"></div>

                <div class="card-inner">
                    <div class="card-top">
                        <div class="card-protocol">
                            <strong>${escapeHtml(item.protocolo)}</strong>
                            <br>
                            ${escapeHtml(getRelativeTime(item.createdAt))}
                        </div>

                        <div class="status-badge ${item.status}">
                            ${escapeHtml(item.statusLabel)}
                        </div>
                    </div>

                    <h3 class="card-title">${escapeHtml(item.title)}</h3>
                    <div class="card-sub">${escapeHtml(item.subtitle)}</div>

                    <div class="card-location">
                        <i data-lucide="map-pin"></i>
                        <span>${escapeHtml(item.cidade || 'Local informado')}</span>
                    </div>

                    <div class="card-address">
                        ${escapeHtml(addressLine)}
                    </div>

                    <div class="card-metrics">
                        <div class="metric">
                            <strong>${formatCompactNumber(item.quantidade)}</strong>
                            <span>Unidades</span>
                        </div>

                        <div class="metric">
                            <strong>${formatCompactNumber(item.peso)}</strong>
                            <span>Peso</span>
                        </div>

                        <div class="metric">
                            <strong>${formatCompactNumber(item.impactoCo2Kg)}</strong>
                            <span>CO₂ evitado</span>
                        </div>
                    </div>

                    <div class="card-bottom">
                        <div class="card-bottom-col">
                            <i data-lucide="user-round"></i>
                            <span>${escapeHtml(item.responsavel || 'Não informado')}</span>
                        </div>

                        <div class="card-bottom-col">
                            <i data-lucide="clock-3"></i>
                            <span>${escapeHtml(formatDateTime(item.createdAt))}</span>
                        </div>
                    </div>

                    <div class="card-actions">
                        <button
                            class="card-btn track"
                            type="button"
                            data-action="track"
                            data-id="${escapeHtml(item.id)}"
                        >
                            <i data-lucide="route"></i>
                            <span>Acompanhar</span>
                        </button>

                        <button
                            class="card-btn details"
                            type="button"
                            data-action="details"
                            data-id="${escapeHtml(item.id)}"
                        >
                            <i data-lucide="${expanded ? 'chevron-up' : 'circle-dot'}"></i>
                            <span>Detalhes</span>
                        </button>

                        ${codeBtn}

                        ${
                            podeConcluir
                                ? `<button
                            class="card-btn track"
                            type="button"
                            data-action="complete"
                            data-id="${escapeHtml(item.id)}"
                        >
                            <i data-lucide="circle-check"></i>
                            <span>Concluir</span>
                        </button>`
                                : ''
                        }
                    </div>

                    <div class="card-expand">
                        <div class="expand-box">
                            <div class="expand-grid">
                                <div class="expand-item">
                                    <small>Protocolo</small>
                                    <strong>${escapeHtml(item.protocolo)}</strong>
                                </div>

                                <div class="expand-item">
                                    <small>Status</small>
                                    <strong>${escapeHtml(item.statusLabel)}</strong>
                                </div>

                                ${
                                    item.empresaResponsavelNome
                                        ? `<div class="expand-item expand-full">
                                    <small>Empresa na rota</small>
                                    <strong>${escapeHtml(item.empresaResponsavelNome)}</strong>
                                </div>`
                                        : ''
                                }

                                <div class="expand-item">
                                    <small>Tipo de pneu</small>
                                    <strong>${escapeHtml(item.tipo)}</strong>
                                </div>

                                <div class="expand-item">
                                    <small>Urgência</small>
                                    <strong>${escapeHtml(item.urgenciaLabel)}</strong>
                                </div>

                                <div class="expand-item">
                                    <small>Responsável</small>
                                    <strong>${escapeHtml(item.responsavel || 'Não informado')}</strong>
                                </div>

                                <div class="expand-item">
                                    <small>Telefone</small>
                                    <strong>${escapeHtml(item.telefone || 'Não informado')}</strong>
                                </div>

                                <div class="expand-item expand-full">
                                    <small>Endereço</small>
                                    <strong>${escapeHtml(item.endereco || 'Não informado')}</strong>
                                </div>

                                <div class="expand-item expand-full">
                                    <small>Observações</small>
                                    <strong>${escapeHtml(item.observacoes || 'Nenhuma observação informada.')}</strong>
                                </div>

                                ${item.fotoUrl ? `
                                    <div class="expand-item expand-full">
                                        <small>Foto anexada</small>
                                        <strong>
                                            <a class="expand-link" href="${escapeAttribute(item.fotoUrl)}" target="_blank" rel="noopener noreferrer">
                                                Abrir imagem enviada
                                            </a>
                                        </strong>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        `;
    }).join('');

    safeCreateIcons();
}

// ------------------------------------------------------------
// CONTROLES DOS CARDS
// ------------------------------------------------------------
function toggleExpanded(id) {
    if (!id) return;

    if (appState.expandedIds.has(id)) {
        appState.expandedIds.delete(id);
    } else {
        appState.expandedIds.add(id);
    }

    renderCards(appState.visibleColetas);
}

function handleTrackAction(id) {
    if (!id) return;

    const coleta = appState.allColetas.find(item => item.id === id);
    if (!coleta) return;

    appState.expandedIds.add(id);
    renderCards(appState.visibleColetas);

    requestAnimationFrame(() => {
        const card = document.querySelector(`.collection-card[data-id="${id}"]`);
        if (!card) return;

        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('pulse-highlight');

        setTimeout(() => {
            card.classList.remove('pulse-highlight');
        }, 1200);
    });

    if (coleta.status === 'em_rota') {
        showToast(`A coleta ${coleta.protocolo} está em rota.`);
    } else if (coleta.status === 'concluida') {
        showToast(`A coleta ${coleta.protocolo} já foi concluída.`);
    } else {
        showToast(`A coleta ${coleta.protocolo} está aguardando despacho.`);
    }
}

// ------------------------------------------------------------
// MODAL DO CÓDIGO
// ------------------------------------------------------------
async function openCodeModal(coleta) {
    const backdrop = document.getElementById('code-modal-backdrop');
    const display = document.getElementById('code-display');
    const subtitle = document.getElementById('code-modal-subtitle');

    if (!backdrop || !display || !subtitle || !coleta) return;

    const uid = appState.currentUser?.uid;
    if (
        typeof ecoPneusPodeVerCodigoConfirmacaoColeta === 'function' &&
        !ecoPneusPodeVerCodigoConfirmacaoColeta(uid, coleta.raw || {})
    ) {
        showToast('Apenas quem registrou a coleta pode visualizar o código salvo no sistema.', 'info');
        return;
    }

    let code = getConfirmationCodeFromFirestore(coleta.raw || {});
    if (!code && coleta.id && typeof db !== 'undefined') {
        try {
            const snap = await db.collection('coletas').doc(coleta.id).get();
            const d = snap.exists ? snap.data() || {} : {};
            code = getConfirmationCodeFromFirestore(d);
        } catch (e) {
            console.warn(e);
        }
    }

    if (!code) {
        showToast('Código ainda não disponível no Firebase para esta coleta.', 'info');
        return;
    }

    appState.currentModalCode = code;

    display.textContent = code;
    subtitle.textContent = `Coleta ${coleta.protocolo} • ${coleta.title}`;

    backdrop.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    safeCreateIcons();
}

function closeCodeModal() {
    const backdrop = document.getElementById('code-modal-backdrop');
    if (!backdrop) return;

    backdrop.classList.add('hidden');
    document.body.style.overflow = '';
}

async function copyCurrentModalCode() {
    const btnText = document.getElementById('copy-code-btn-text');
    const code = appState.currentModalCode || '';

    if (!code) return;

    try {
        await navigator.clipboard.writeText(code);

        if (btnText) btnText.textContent = 'Copiado!';
        showToast('Código copiado com sucesso.');

        setTimeout(() => {
            if (btnText) btnText.textContent = 'Copiar código';
        }, 1800);
    } catch (error) {
        console.error('Erro ao copiar código:', error);
        showToast('Não foi possível copiar o código.', 'error');
    }
}

// ------------------------------------------------------------
// SUMMARY / COUNTS
// ------------------------------------------------------------
function updateSummary() {
    const totalColetas = appState.allColetas.length;
    const totalPneus = sumBy(appState.allColetas, item => item.quantidade || 0);
    const totalEmRota = appState.allColetas.filter(item => item.status === 'em_rota').length;
    const totalCo2 = sumBy(appState.allColetas, item => item.impactoCo2Kg || 0);

    setText('summary-total-coletas', `${formatCompactNumber(totalColetas)} coleta${totalColetas === 1 ? '' : 's'}`);
    setText('summary-total-pneus', `${formatCompactNumber(totalPneus)} pneus`);
    setText('summary-em-rota', `${formatCompactNumber(totalEmRota)} em rota`);
    setText('summary-co2', `${formatCompactNumber(totalCo2)} kg de CO₂`);
}

function updateCounts() {
    const total = appState.allColetas.length;
    const pendente = appState.allColetas.filter(item => item.status === 'pendente').length;
    const emRota = appState.allColetas.filter(item => item.status === 'em_rota').length;
    const concluida = appState.allColetas.filter(item => item.status === 'concluida').length;

    setText('count-all', String(total));
    setText('count-pendente', String(pendente));
    setText('count-em_rota', String(emRota));
    setText('count-concluida', String(concluida));
}

function updateResultsCount(totalVisible) {
    setText('results-count', `${formatCompactNumber(totalVisible)} coleta${totalVisible === 1 ? '' : 's'}`);
}

function applyFilterTabVisibility() {
    const tab = document.querySelector('.filter-tab[data-filter="em_rota"]');
    if (!tab) return;
    const hide = appState.tipoConta === 'pessoa_fisica';
    tab.classList.toggle('hidden', hide);
    if (hide && appState.activeFilter === 'em_rota') {
        appState.activeFilter = 'all';
    }
}

function updateFilterTabsUI() {
    document.querySelectorAll('.filter-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === appState.activeFilter);
    });
}

function toggleEmptyState(isEmpty) {
    const empty = document.getElementById('empty-state');
    const grid = document.getElementById('cards-grid');

    if (!empty || !grid) return;

    empty.classList.toggle('hidden', !isEmpty);
    grid.classList.toggle('hidden', isEmpty);
}

// ------------------------------------------------------------
// HELPERS DE EXIBIÇÃO
// ------------------------------------------------------------
function getStatusLabel(status) {
    if (status === 'em_rota') return 'Em rota';
    if (status === 'concluida') return 'Concluída';
    return 'Pendente';
}

function getUrgenciaLabel(urgencia) {
    if (urgencia === 'alta') return 'Alta';
    if (urgencia === 'baixa') return 'Baixa';
    return 'Normal';
}

function setRefreshLoading(isLoading) {
    const btn = document.getElementById('refresh-btn');
    if (!btn) return;

    const icon = btn.querySelector('i');
    btn.disabled = isLoading;

    if (icon) {
        icon.style.transition = 'transform .2s ease';
        icon.style.transform = isLoading ? 'rotate(180deg)' : 'rotate(0deg)';
    }
}

function showToast(message, type = 'success') {
    const wrap = document.getElementById('toast-wrap');
    if (!wrap) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'error' : ''}`.trim();
    toast.textContent = message;

    wrap.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-6px)';
        toast.style.transition = 'all .25s ease';
    }, 2600);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function safeCreateIcons() {
    try {
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (error) {
        console.warn('Erro ao renderizar ícones:', error);
    }
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// ------------------------------------------------------------
// HELPERS DE DATA
// ------------------------------------------------------------
function parseFirestoreDate(value) {
    try {
        if (!value) return new Date();

        if (value instanceof Date) return value;

        if (typeof value?.toDate === 'function') {
            return value.toDate();
        }

        if (typeof value === 'string' || typeof value === 'number') {
            const d = new Date(value);
            if (!isNaN(d.getTime())) return d;
        }

        return new Date();
    } catch {
        return new Date();
    }
}

function getTime(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return 0;
    return date.getTime();
}

function formatDateTime(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return 'Agora';

    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function getRelativeTime(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return 'agora';

    const diff = Date.now() - date.getTime();
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) return 'agora mesmo';

    if (diff < hour) {
        const m = Math.floor(diff / minute);
        return `${m} min atrás`;
    }

    if (diff < day) {
        const h = Math.floor(diff / hour);
        return `${h} hora${h > 1 ? 's' : ''} atrás`;
    }

    const d = Math.floor(diff / day);
    if (d <= 7) {
        return `${d} dia${d > 1 ? 's' : ''} atrás`;
    }

    return formatDateTime(date);
}

// ------------------------------------------------------------
// HELPERS DE TEXTO / FORMATAÇÃO
// ------------------------------------------------------------
function normalizeString(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

function sumBy(arr, fn) {
    return arr.reduce((acc, item) => acc + (Number(fn(item)) || 0), 0);
}

function formatCompactNumber(value) {
    const n = Number(value) || 0;

    return new Intl.NumberFormat('pt-BR', {
        maximumFractionDigits: 0
    }).format(n);
}

function getInitials(name) {
    const clean = String(name || 'EP').trim();
    if (!clean) return 'EP';

    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

    return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getCidadeFromEndereco(endereco) {
    const text = String(endereco || '').trim();
    if (!text) return '';

    const pipeParts = text.split('|').map(s => s.trim()).filter(Boolean);

    for (const part of pipeParts) {
        if (part.includes(' - ')) {
            const pieces = part.split(' - ').map(s => s.trim()).filter(Boolean);
            if (pieces.length > 1) return pieces[pieces.length - 1];
        }
    }

    const commaParts = text.split(',').map(s => s.trim()).filter(Boolean);
    if (commaParts.length >= 2) {
        const maybeCity = commaParts[commaParts.length - 2];
        if (maybeCity && maybeCity.length <= 40) return maybeCity;
    }

    if (pipeParts.length >= 2) {
        return pipeParts[1].slice(0, 40);
    }

    return '';
}

function getAddressPrimaryLine(endereco) {
    const text = String(endereco || '').trim();
    if (!text) return '';

    if (text.includes('|')) {
        return text.split('|')[0].trim();
    }

    const comma = text.split(',').map(s => s.trim()).filter(Boolean);
    if (comma.length) return comma[0];

    return text.slice(0, 40);
}

function generateShortSecureCode(seed) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let hash = 0;

    const base = String(seed || 'ECO-PNEUS');
    for (let i = 0; i < base.length; i++) {
        hash = ((hash << 5) - hash + base.charCodeAt(i)) | 0;
    }

    let output = '';
    let num = Math.abs(hash) + base.length * 97;

    for (let i = 0; i < 7; i++) {
        output += chars[num % chars.length];
        num = Math.floor(num / chars.length) + 13;
    }

    return `${output.slice(0, 3)}-${output.slice(3, 7)}`;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeAttribute(value) {
    return String(value ?? '').replace(/"/g, '&quot;');
}

// ------------------------------------------------------------
// EMPRESA — coletas disponíveis / aceite / conclusão com código
// ------------------------------------------------------------
async function initEmpresaRedeMode(user) {
    appState.empresaRede = false;
    if (appState.disponiveisTimer) {
        clearInterval(appState.disponiveisTimer);
        appState.disponiveisTimer = null;
    }
    stopDisponiveisListener();

    const panel = document.getElementById('empresa-rede-panel');
    const bar = document.getElementById('coleta-wizard-bar');

    if (!user || typeof db === 'undefined') {
        if (panel) {
            panel.classList.add('hidden');
            panel.setAttribute('hidden', 'true');
        }
        if (bar) bar.classList.add('hidden');
        return;
    }

    let pode = false;
    try {
        const snap = await db.collection('usuarios').doc(user.uid).get();
        const d = snap.exists ? snap.data() || {} : {};
        appState.currentUserData = d;
        appState.tipoConta =
            typeof ecoPneusResolveTipoConta === 'function' ? ecoPneusResolveTipoConta(d) : 'pessoa_fisica';
        pode =
            typeof ecoPneusPodeOperarLogistica === 'function'
                ? ecoPneusPodeOperarLogistica(appState.tipoConta)
                : false;
    } catch (e) {
        console.warn(e);
    }

    appState.empresaRede = pode;

    if (!pode) {
        if (panel) {
            panel.classList.add('hidden');
            panel.setAttribute('hidden', 'true');
        }
        if (bar) bar.classList.add('hidden');
        if (appState.activeFilter === 'em_rota') appState.activeFilter = 'all';
        return;
    }

    if (panel) {
        panel.classList.remove('hidden');
        panel.removeAttribute('hidden');
    }
    if (bar) bar.classList.remove('hidden');
    startDisponiveisRealtime();
}

function parseFirestoreDateLoose(v) {
    if (!v) return null;
    if (v.seconds) return new Date(v.seconds * 1000);
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
}

function bindEmpresaRedeUI() {
    const list = document.getElementById('empresa-disponiveis-list');
    const bdAceite = document.getElementById('empresa-aceite-backdrop');
    const bdComplete = document.getElementById('empresa-complete-backdrop');

    list?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-aceite-id]');
        if (!btn) return;
        const id = btn.getAttribute('data-aceite-id');
        if (!id) return;
        appState.empresaAceiteColetaId = id;
        const sub = document.getElementById('empresa-aceite-sub');
        if (sub) sub.textContent = `Coleta ${id.slice(0, 8)}… — confirme se sua equipe pode assumir esta rota.`;
        bdAceite?.classList.remove('hidden');
        safeCreateIcons();
    });

    document.getElementById('empresa-aceite-close')?.addEventListener('click', () => closeEmpresaAceite());
    document.getElementById('empresa-aceite-cancel')?.addEventListener('click', () => closeEmpresaAceite());
    bdAceite?.addEventListener('click', (e) => {
        if (e.target === bdAceite) closeEmpresaAceite();
    });

    document.getElementById('empresa-aceite-ok')?.addEventListener('click', async () => {
        const id = appState.empresaAceiteColetaId;
        if (!id || !appState.currentUser) return;
        try {
            const ref = db.collection('coletas').doc(id);
            const snap = await ref.get();
            const d0 = snap.exists ? snap.data() || {} : {};
            const criadorUid = String(d0.uid || d0.criadorUid || '').trim();
            const protocolo = String(d0.protocolo || d0.codigo || id.slice(0, 8)).trim();
            const nomeEmpresa =
                appState.currentUserData?.razaoSocial ||
                appState.currentUserData?.nome ||
                appState.currentUser.displayName ||
                'Parceiro Eco Pneus';

            await ref.update({
                empresaResponsavelUid: appState.currentUser.uid,
                empresaResponsavelNome: nomeEmpresa,
                status: 'Em rota',
                empresaAceitaEm: firebase.firestore.FieldValue.serverTimestamp()
            });

            if (criadorUid && typeof ecoPneusCriarNotificacaoUsuario === 'function') {
                await ecoPneusCriarNotificacaoUsuario(criadorUid, {
                    tipo: 'coleta_aceita',
                    titulo: 'Sua coleta foi aceita',
                    mensagem: `${nomeEmpresa} aceitou a coleta ${protocolo}.`,
                    coletaId: id,
                    protocolo
                });
            }

            showToast('Coleta aceita. O cliente verá o status em tempo real.');
            pushNotification({
                titulo: 'Coleta aceita por você',
                mensagem: `Você assumiu a coleta ${protocolo}.`,
                tipo: 'coleta_aceita_empresa',
                coletaId: id,
                protocolo
            });
            closeEmpresaAceite();
        } catch (err) {
            console.error(err);
            showToast('Não foi possível aceitar. Tente novamente.', 'error');
        }
    });

    document.getElementById('empresa-complete-close')?.addEventListener('click', () => closeEmpresaComplete());
    bdComplete?.addEventListener('click', (e) => {
        if (e.target === bdComplete) closeEmpresaComplete();
    });

    document.getElementById('empresa-complete-submit')?.addEventListener('click', async () => {
        const id = appState.empresaCompleteColetaId;
        const inp = document.getElementById('empresa-complete-input');
        if (!id || !inp) return;
        const typed = String(inp.value || '').trim();
        const coleta = appState.allColetas.find((c) => c.id === id);
        if (!coleta) {
            showToast('Coleta não encontrada.', 'error');
            return;
        }
        const ref = db.collection('coletas').doc(id);
        let esperado = '';
        try {
            const snap = await ref.get();
            const d0 = snap.exists ? snap.data() || {} : {};
            esperado = getConfirmationCodeFromFirestore(d0);
        } catch (e1) {
            showToast('Erro ao validar código no servidor.', 'error');
            return;
        }
        const norm = (s) => s.replace(/\s+/g, '').toUpperCase();
        if (!typed || !esperado || norm(typed) !== norm(esperado)) {
            showToast('Código inválido. Confira com quem registrou a coleta.', 'error');
            pushNotification({
                titulo: 'Código inválido',
                mensagem: `O código informado para ${coleta.protocolo} não confere.`,
                tipo: 'erro',
                coletaId: id,
                protocolo: coleta.protocolo
            });
            return;
        }
        const criadorUid = String(coleta.criadorUid || coleta.raw?.uid || '').trim();
        try {
            appState.skipColetaDiffToasts = true;
            setTimeout(() => {
                appState.skipColetaDiffToasts = false;
            }, 4000);

            await ref.update({
                status: 'Concluída',
                concluidaEm: firebase.firestore.FieldValue.serverTimestamp(),
                concluidaPorUid: appState.currentUser.uid,
                codigoConfirmacaoValidadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });

            if (criadorUid && typeof ecoPneusCriarNotificacaoUsuario === 'function') {
                await ecoPneusCriarNotificacaoUsuario(criadorUid, {
                    tipo: 'coleta_concluida',
                    titulo: 'Coleta concluída',
                    mensagem: `A coleta ${coleta.protocolo} foi concluída com código validado.`,
                    coletaId: id,
                    protocolo: coleta.protocolo
                });
            }

            showToast('Código validado. Coleta concluída com sucesso.');
            pushNotification({
                titulo: 'Código confirmado',
                mensagem: `Coleta ${coleta.protocolo} finalizada e sincronizada.`,
                tipo: 'codigo_ok',
                coletaId: id,
                protocolo: coleta.protocolo
            });
            closeEmpresaComplete();
        } catch (err) {
            console.error(err);
            appState.skipColetaDiffToasts = false;
            showToast('Erro ao concluir.', 'error');
        }
    });
}

function closeEmpresaAceite() {
    document.getElementById('empresa-aceite-backdrop')?.classList.add('hidden');
    appState.empresaAceiteColetaId = null;
}

function closeEmpresaComplete() {
    document.getElementById('empresa-complete-backdrop')?.classList.add('hidden');
    appState.empresaCompleteColetaId = null;
    const inp = document.getElementById('empresa-complete-input');
    if (inp) inp.value = '';
}

function openEmpresaCompleteModal(id) {
    appState.empresaCompleteColetaId = id;
    const bd = document.getElementById('empresa-complete-backdrop');
    const sub = document.getElementById('empresa-complete-sub');
    const coleta = appState.allColetas.find((c) => c.id === id);
    if (sub && coleta) {
        sub.textContent = `Coleta ${coleta.protocolo} — digite o código informado pelo cliente (ele não aparece na sua tela).`;
    }
    bd?.classList.remove('hidden');
    safeCreateIcons();
    document.getElementById('empresa-complete-input')?.focus();
}