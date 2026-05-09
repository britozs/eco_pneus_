// ============================================================
// ECO PNEUS - Empresas (Página Nova)
// ============================================================

// Fonte de verdade: coleção Firestore `parceiros` (seed automático se vazia).
let PARCEIROS = [];

// --- Seed inicial (gravado no Firestore apenas quando a coleção está vazia) ---
const SEED_PARCEIROS = [
    {
        id: 'verde-brasil',
        nome: 'Verde Brasil Reciclagem',
        sigla: 'VB',
        categoria: 'recicladora',
        tipoLabel: 'RECICLADORA',
        cidade: 'São Paulo, SP',
        distancia: 12,
        rating: 4.9,
        avaliacoes: 186,
        telefone: '(11) 4002-8922',
        whatsapp: '5511400289220',
        email: 'contato@verdebrasil.com.br',
        cnpj: '12.345.678/0001-90',
        descricao: 'Usina referência em transformação de borracha para asfalto ecológico. Capacidade de 180 t/mês.',
        tags: ['Borracha', 'Asfalto eco', 'Aço'],
        imagem: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=900&q=80',
        badge: 'Top rated',
        verificado: true,
        ativo: true,
        coletas: 1247,
        reciclado: 542,
        co2Evitado: 518,
        destaque: true
    },
    {
        id: 'ecorotas',
        nome: 'EcoRotas Transportes',
        sigla: 'ER',
        categoria: 'transportadora',
        tipoLabel: 'TRANSPORTADORA',
        cidade: 'Campinas, SP',
        distancia: 32,
        rating: 4.8,
        avaliacoes: 182,
        telefone: '(19) 3256-7788',
        whatsapp: '5519325677880',
        email: 'logistica@ecorotas.com.br',
        cnpj: '23.456.789/0001-01',
        descricao: 'Frota 100% rastreada com coletas programadas em toda região Sudeste. Certificação ISO 14001.',
        tags: ['Transporte', 'Coleta 24h', 'ISO 14001'],
        imagem: 'https://images.unsplash.com/photo-1580974852861-c381510bc98a?auto=format&fit=crop&w=900&q=80',
        badge: 'Logística',
        verificado: true,
        ativo: true,
        coletas: 842,
        reciclado: 210,
        co2Evitado: 314,
        destaque: true
    },
    {
        id: 'ciclo-pampa',
        nome: 'Ciclo Pampa',
        sigla: 'CP',
        categoria: 'recicladora',
        tipoLabel: 'RECICLADORA',
        cidade: 'Porto Alegre, RS',
        distancia: 842,
        rating: 4.7,
        avaliacoes: 142,
        telefone: '(51) 3028-4455',
        whatsapp: '5551302844550',
        email: 'contato@ciclopampa.com.br',
        cnpj: '34.567.890/0001-12',
        descricao: 'Cooperativa social que gera renda para 40 famílias e devolve borracha triturada para o mercado.',
        tags: ['Social', 'Trituração', 'Borracha'],
        imagem: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=900&q=80',
        badge: 'Novo',
        verificado: true,
        ativo: true,
        coletas: 612,
        reciclado: 178,
        co2Evitado: 245,
        destaque: true
    },
    {
        id: 'ponto-verde',
        nome: 'Ponto Verde Coleta',
        sigla: 'PV',
        categoria: 'ponto-coleta',
        tipoLabel: 'PONTO DE COLETA',
        cidade: 'Curitiba, PR',
        distancia: 408,
        rating: 4.7,
        avaliacoes: 178,
        telefone: '(41) 3344-9988',
        whatsapp: '5541334499880',
        email: 'contato@pontoverde.com.br',
        cnpj: '45.678.901/0001-23',
        descricao: 'Ponto de coleta com bairros parceiros e modelo self drop-off para empresas e pessoas físicas.',
        tags: ['Ponto de coleta', 'Bairros', 'Self drop-off'],
        imagem: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=900&q=80',
        badge: '',
        verificado: true,
        ativo: true,
        coletas: 540,
        reciclado: 112,
        co2Evitado: 169
    },
    {
        id: 'reborracha-bh',
        nome: 'ReBorracha BH',
        sigla: 'RB',
        categoria: 'recicladora',
        tipoLabel: 'RECICLADORA',
        cidade: 'Belo Horizonte, MG',
        distancia: 512,
        rating: 4.6,
        avaliacoes: 174,
        telefone: '(31) 3555-7090',
        whatsapp: '5531355570900',
        email: 'contato@reborracha.com.br',
        cnpj: '56.789.012/0001-34',
        descricao: 'Especializada em borracha granulada, pisos emborrachados e recuperação de aço de pneus radiais.',
        tags: ['Borracha granulada', 'Pisos', 'Aço'],
        imagem: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=900&q=80',
        badge: '',
        verificado: true,
        ativo: true,
        coletas: 987,
        reciclado: 267,
        co2Evitado: 402
    },
    {
        id: 'mar-azul',
        nome: 'Mar Azul Reciclagem',
        sigla: 'MA',
        categoria: 'recicladora',
        tipoLabel: 'RECICLADORA',
        cidade: 'Florianópolis, SC',
        distancia: 610,
        rating: 4.8,
        avaliacoes: 182,
        telefone: '(48) 3225-4411',
        whatsapp: '5548322544110',
        email: 'contato@marazul.com.br',
        cnpj: '67.890.123/0001-45',
        descricao: 'Recicladora costeira focada em pneus de embarcações e veículos de pequeno porte.',
        tags: ['Borracha', 'Marítimo', 'Eco'],
        imagem: 'https://images.unsplash.com/photo-1580974852861-c381510bc98a?auto=format&fit=crop&w=900&q=80',
        badge: '',
        verificado: true,
        ativo: true,
        coletas: 478,
        reciclado: 134,
        co2Evitado: 198
    },
    {
        id: 'rota-sul',
        nome: 'Rota Sul Logística',
        sigla: 'RS',
        categoria: 'transportadora',
        tipoLabel: 'TRANSPORTADORA',
        cidade: 'Curitiba, PR',
        distancia: 408,
        rating: 4.5,
        avaliacoes: 121,
        telefone: '(41) 3088-2233',
        whatsapp: '5541308822330',
        email: 'contato@rotasul.com.br',
        cnpj: '78.901.234/0001-56',
        descricao: 'Operações logísticas reversas para a região Sul com rastreio em tempo real.',
        tags: ['Transporte', 'Rastreio', 'Sul'],
        imagem: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=900&q=80',
        badge: '',
        verificado: true,
        ativo: false,
        coletas: 322,
        reciclado: 88,
        co2Evitado: 121
    },
    {
        id: 'eco-coleta-rj',
        nome: 'Eco Coleta RJ',
        sigla: 'EC',
        categoria: 'ponto-coleta',
        tipoLabel: 'PONTO DE COLETA',
        cidade: 'Rio de Janeiro, RJ',
        distancia: 430,
        rating: 4.4,
        avaliacoes: 96,
        telefone: '(21) 3220-8877',
        whatsapp: '5521322088770',
        email: 'contato@ecocoletarj.com.br',
        cnpj: '89.012.345/0001-67',
        descricao: 'Rede de pontos de coleta espalhados pela zona sul e oeste do Rio de Janeiro.',
        tags: ['Ponto de coleta', 'Zona sul', 'Self drop-off'],
        imagem: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=900&q=80',
        badge: '',
        verificado: true,
        ativo: true,
        coletas: 296,
        reciclado: 72,
        co2Evitado: 104
    }
];

// Coordenadas aproximadas por parceiro (cartão no mapa + fallback se o Firestore não tiver lat/lng).
const PARCEIRO_COORDS_FALLBACK = {
    'verde-brasil': [-23.5629, -46.6544],
    ecorotas: [-22.9056, -47.0603],
    'ciclo-pampa': [-30.0346, -51.2177],
    'ponto-verde': [-25.4244, -49.2654],
    'reborracha-bh': [-19.9245, -43.9202],
    'mar-azul': [-27.5954, -48.5487],
    'rota-sul': [-25.48, -49.32],
    'eco-coleta-rj': [-22.911, -43.1729]
};

/** Preencido em tempo de execução via geocode (endereço/cidade cadastrados). */
const coordOverrides = {};
const cidadeGeocodeCache = new Map();

async function ensureParceirosFromFirestore() {
    if (typeof db === 'undefined') {
        PARCEIROS = SEED_PARCEIROS.map(function (p) { return Object.assign({}, p); });
        return;
    }
    try {
        var snap = await db.collection('parceiros').get();
        if (!snap.empty) {
            PARCEIROS = [];
            snap.forEach(function (doc) {
                var d = doc.data() || {};
                PARCEIROS.push(Object.assign({ id: doc.id }, d));
            });
            return;
        }

        var batch = db.batch();
        SEED_PARCEIROS.forEach(function (p) {
            var ref = db.collection('parceiros').doc(p.id);
            var copy = {};
            Object.keys(p).forEach(function (k) {
                if (k !== 'id') copy[k] = p[k];
            });
            var cord = PARCEIRO_COORDS_FALLBACK[p.id];
            if (cord) {
                copy.latitude = cord[0];
                copy.longitude = cord[1];
            }
            batch.set(ref, copy);
        });
        await batch.commit();

        var snap2 = await db.collection('parceiros').get();
        PARCEIROS = [];
        snap2.forEach(function (doc) {
            var d = doc.data() || {};
            PARCEIROS.push(Object.assign({ id: doc.id }, d));
        });
    } catch (e) {
        console.warn('Parceiros Firestore:', e);
        PARCEIROS = SEED_PARCEIROS.map(function (p) { return Object.assign({}, p); });
    }
}

function parceiroLatLngFirestoreOrFallback(p) {
    if (!p) return null;
    const la = Number(p.latitude);
    const lo = Number(p.longitude);
    if (Number.isFinite(la) && Number.isFinite(lo)) return [la, lo];
    const fb = PARCEIRO_COORDS_FALLBACK[p.id];
    return fb || null;
}

function enderecoParceiroParaBusca(p) {
    if (!p) return '';
    const parts = [];
    ['endereco', 'logradouro', 'rua', 'numero', 'bairro', 'cidade', 'municipio', 'estado', 'cep'].forEach(function (k) {
        const v = p[k];
        if (v !== undefined && v !== null && String(v).trim() !== '') {
            parts.push(String(v).trim());
        }
    });
    return parts.length ? parts.join(', ') + ', Brasil' : '';
}

function parceiroLatLng(p) {
    if (!p) return null;
    const ov = coordOverrides[p.id];
    if (ov && Number.isFinite(ov[0]) && Number.isFinite(ov[1])) return ov;
    return parceiroLatLngFirestoreOrFallback(p);
}

// --- ESTADO ---
let activeCategory = 'todas';
let activeSort = 'rating';
let activeReviewCompanyId = null;
let activeReviewStars = 0;
let mapInstance = null;
let partnerMarkersLayer = null;
let geocodePartnerTimer = null;
let geocodeQueueRunning = false;
let partnersMapResizeBound = false;

function scheduleRefreshMapMarkersDebounced() {
    if (geocodePartnerTimer) clearTimeout(geocodePartnerTimer);
    geocodePartnerTimer = setTimeout(function () {
        refreshParceirosMapMarkers();
        geocodePartnerTimer = null;
    }, 380);
}

function schedulePartnersMapInvalidate() {
    if (!mapInstance) return;
    const run = function () {
        try {
            mapInstance.invalidateSize();
            refreshParceirosMapMarkers();
        } catch (e) {}
    };
    requestAnimationFrame(run);
    setTimeout(run, 110);
    setTimeout(run, 420);
}

function bindPartnersMapResizeOnce() {
    if (partnersMapResizeBound) return;
    partnersMapResizeBound = true;
    window.addEventListener('resize', schedulePartnersMapInvalidate);
    window.addEventListener('load', schedulePartnersMapInvalidate);
    const mc = document.querySelector('.map-card');
    if (mc && typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(schedulePartnersMapInvalidate).observe(mc);
    }
}

async function geocodeEnderecoParceiro(query) {
    if (!query || query.length < 3 || typeof fetch === 'undefined') return null;
    const keyLower = query.toLowerCase();
    if (cidadeGeocodeCache.has(keyLower)) return cidadeGeocodeCache.get(keyLower);

    try {
        const url =
            'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' +
            encodeURIComponent(query);
        const res = await fetch(url, { headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' } });
        if (!res.ok) {
            cidadeGeocodeCache.set(keyLower, null);
            return null;
        }
        const json = await res.json();
        if (!json || !json.length) {
            cidadeGeocodeCache.set(keyLower, null);
            return null;
        }
        const la = parseFloat(json[0].lat);
        const lo = parseFloat(json[0].lon);
        if (!Number.isFinite(la) || !Number.isFinite(lo)) {
            cidadeGeocodeCache.set(keyLower, null);
            return null;
        }
        const ll = [la, lo];
        cidadeGeocodeCache.set(keyLower, ll);
        return ll;
    } catch (e) {
        console.warn('Geocode parceiro:', e);
        return null;
    }
}

async function hydrateParceiroCoordsFromAddress() {
    if (geocodeQueueRunning || typeof fetch === 'undefined') return;
    geocodeQueueRunning = true;
    try {
        for (let i = 0; i < PARCEIROS.length; i++) {
            const p = PARCEIROS[i];
            if (!p || !p.id) continue;
            if (coordOverrides[p.id]) continue;
            if (parceiroLatLngFirestoreOrFallback(p)) continue;
            const q = enderecoParceiroParaBusca(p);
            if (!q) continue;

            const keyLower = q.toLowerCase();
            const hadCached = cidadeGeocodeCache.has(keyLower);
            const ll = await geocodeEnderecoParceiro(q);
            if (ll) {
                coordOverrides[p.id] = ll;
                scheduleRefreshMapMarkersDebounced();
            }
            if (!hadCached) {
                await new Promise(function (r) {
                    setTimeout(r, 1100);
                });
            }
        }
    } finally {
        geocodeQueueRunning = false;
        refreshParceirosMapMarkers();
    }
}

function refreshParceirosMapMarkers() {
    if (!mapInstance || !partnerMarkersLayer || typeof L === 'undefined') return;

    partnerMarkersLayer.clearLayers();

    const list = getFiltered();
    const bounds = [];

    list.forEach((p) => {
        const ll = parceiroLatLng(p);
        if (!ll) return;
        bounds.push(ll);
        const marker = L.marker(ll).bindPopup(
            `<strong>${String(p.nome || '').replace(/</g, '&lt;')}</strong><br>${String(p.cidade || '').replace(/</g, '&lt;')}`
        );
        partnerMarkersLayer.addLayer(marker);
    });

    const legend = document.getElementById('legend-total');
    if (legend) {
        const n = bounds.length;
        legend.textContent = `${n} parceiro${n !== 1 ? 's' : ''} no mapa`;
    }

    if (bounds.length === 0) {
        mapInstance.setView([-14.235, -51.9253], 4);
        return;
    }

    if (bounds.length === 1) {
        mapInstance.setView(bounds[0], 11);
        return;
    }

    try {
        mapInstance.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    } catch (e) {
        mapInstance.setView(bounds[0], 6);
    }
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', async () => {
    lucide.createIcons();
    await ensureParceirosFromFirestore();
    setupAuth();
    renderFeatured();
    renderCompanies();
    setupCategoryChips();
    setupSortPills();
    setupMapToolbar();
    setupModals();
    setupHeroButtons();
    setupSearch();
    setupReviewStars();
    initMap();
});

// --- AUTH ---
function setupAuth() {
    if (typeof auth === 'undefined') return;
    auth.onAuthStateChanged(async (user) => {
        if (!user) return;
        let dados = {};
        try {
            const snap = await db.collection('usuarios').doc(user.uid).get();
            if (snap.exists) dados = snap.data() || {};
        } catch (e) {
            console.warn(e);
        }
        if (typeof ecoPneusAplicarHeaderPerfilFirebase === 'function') {
            ecoPneusAplicarHeaderPerfilFirebase(user, dados);
        } else {
            const name = user.displayName || 'Usuário';
            const initials = name
                .split(' ')
                .map((p) => p[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();
            const nameEl = document.getElementById('user-name');
            const avatarEl = document.getElementById('user-avatar');
            if (nameEl) nameEl.textContent = name.split(' ')[0];
            if (avatarEl) avatarEl.textContent = initials;
        }
    });
}

// ============================================================
// FEATURED
// ============================================================
function renderFeatured() {
    const grid = document.getElementById('featured-grid');
    if (!grid) return;
    const destaques = PARCEIROS.filter(p => p.destaque);
    grid.innerHTML = destaques.map(p => `
        <article class="featured-card" data-id="${p.id}">
            <div class="featured-image">
                <img src="${p.imagem}" alt="${p.nome}" loading="lazy">
                ${p.badge ? `<span class="featured-badge">${badgeIcon(p.badge)} ${p.badge}</span>` : ''}
                <span class="featured-rating">${p.rating.toFixed(1)}</span>
            </div>
            <div class="featured-body">
                <h4>${p.nome} ${p.verificado ? '<span class="verified-tag"><i data-lucide="badge-check"></i> Verificado</span>' : ''}</h4>
                <div class="featured-location">
                    <i data-lucide="map-pin"></i>
                    ${p.cidade} • <span class="dist">${p.distancia} km</span>
                </div>
                <p class="featured-desc">${p.descricao}</p>
                <div class="featured-tags">
                    ${p.tags.map(t => `<span class="featured-tag">${t}</span>`).join('')}
                </div>
            </div>
        </article>
    `).join('');

    grid.querySelectorAll('.featured-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            const parceiro = PARCEIROS.find(p => p.id === id);
            if (parceiro) abrirContato(parceiro);
        });
    });

    lucide.createIcons();
}

function badgeIcon(label) {
    const map = { 'Top rated': '⭐', 'Logística': '🚛', 'Novo': '✨' };
    return map[label] || '';
}

// ============================================================
// CATEGORY CHIPS
// ============================================================
function setupCategoryChips() {
    document.querySelectorAll('#category-chips .filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('#category-chips .filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeCategory = chip.dataset.category;
            renderCompanies();
            updatePartnersCount();
        });
    });
}

// ============================================================
// SORT PILLS
// ============================================================
function setupSortPills() {
    document.querySelectorAll('#sort-pills .sort-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('#sort-pills .sort-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeSort = pill.dataset.sort;
            updateOrderChip();
            renderCompanies();
        });
    });
}

function setupMapToolbar() {
    document.querySelectorAll('#map-toolbar .map-sort-chip').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('#map-toolbar .map-sort-chip').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            const sort = pill.dataset.sort;
            const main = document.querySelector(`#sort-pills [data-sort="${sort}"]`);
            if (main) {
                document.querySelectorAll('#sort-pills .sort-pill').forEach(p => p.classList.remove('active'));
                main.classList.add('active');
                activeSort = sort;
                updateOrderChip();
                renderCompanies();
            }
        });
    });
}

function updateOrderChip() {
    const chip = document.getElementById('order-chip');
    if (!chip) return;
    const labels = {
        rating: 'Ordem: Melhores avaliados',
        active: 'Ordem: Mais ativos',
        distance: 'Ordem: Mais próximos'
    };
    chip.textContent = labels[activeSort] || 'Ordem: Melhores avaliados';
}

// ============================================================
// COMPANIES GRID
// ============================================================
function getFiltered() {
    let list = [...PARCEIROS];

    // FILTRO POR CATEGORIA
    if (activeCategory === 'recicladora') list = list.filter(p => p.categoria === 'recicladora');
    else if (activeCategory === 'transportadora') list = list.filter(p => p.categoria === 'transportadora');
    else if (activeCategory === 'ponto-coleta') list = list.filter(p => p.categoria === 'ponto-coleta');
    else if (activeCategory === 'melhor-avaliadas') list = list.filter(p => p.rating >= 4.7);

    // FILTRO POR BUSCA
    const term = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
    if (term) {
        list = list.filter(p =>
            p.nome.toLowerCase().includes(term) ||
            p.cidade.toLowerCase().includes(term) ||
            p.tipoLabel.toLowerCase().includes(term) ||
            p.tags.some(t => t.toLowerCase().includes(term))
        );
    }

    // ORDENAÇÃO
    if (activeSort === 'rating') {
        // Melhores avaliados: maior rating primeiro
        list.sort((a, b) => b.rating - a.rating);
    } else if (activeSort === 'active') {
        // Mais ativos: maior número de coletas primeiro
        list.sort((a, b) => b.coletas - a.coletas);
    } else if (activeSort === 'distance') {
        // Mais próximos: menor distância primeiro
        list.sort((a, b) => a.distancia - b.distancia);
    }

    return list;
}

function renderCompanies() {
    const grid = document.getElementById('companies-grid');
    if (!grid) return;
    const list = getFiltered();
    if (list.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:48px 24px;color:var(--text-muted);">
                <i data-lucide="inbox" style="width:48px;height:48px;opacity:0.4;"></i>
                <h3 style="margin-top:12px;font-size:1.05rem;color:var(--text);">Nenhum parceiro encontrado</h3>
                <p style="font-size:0.88rem;">Tente ajustar os filtros ou a busca.</p>
            </div>
        `;
        lucide.createIcons();
        updatePartnersCount();
        return;
    }
    grid.innerHTML = list.map(p => `
        <article class="company-card" data-id="${p.id}">
            <div class="company-head">
                <div class="company-avatar">${p.sigla}</div>
                <div>
                    <h4>${p.nome} ${p.verificado ? '<span class="verified-tag"><i data-lucide="badge-check"></i> Verificado</span>' : ''}</h4>
                    <span class="company-type">${p.tipoLabel}</span>
                </div>
            </div>
            <div class="company-rating">
                <span class="stars">${'★'.repeat(Math.round(p.rating))}${'☆'.repeat(5 - Math.round(p.rating))}</span>
                ${p.rating.toFixed(1)} (${p.avaliacoes} avaliações)
            </div>
            <div class="company-meta">
                <span><i data-lucide="map-pin"></i> ${p.cidade} • ${p.distancia} km</span>
                <span><i data-lucide="phone"></i> ${p.telefone}</span>
            </div>
            <div class="company-tags">
                ${p.tags.map(t => `<span class="company-tag">${t}</span>`).join('')}
            </div>
            <div class="company-stats">
                <div class="company-stat"><strong>${p.coletas.toLocaleString('pt-BR')}</strong><span>Coletas</span></div>
                <div class="company-stat"><strong>${p.reciclado} t</strong><span>Reciclado</span></div>
                <div class="company-stat"><strong>${p.co2Evitado} t</strong><span>CO₂ evitado</span></div>
            </div>
            <div class="company-actions">
                <button class="btn-contact-green" data-action="contact" data-id="${p.id}">
                    <i data-lucide="phone"></i> Contato
                </button>
                <button class="btn-whatsapp-out" data-action="whatsapp" data-id="${p.id}">
                    <i data-lucide="message-circle"></i> WhatsApp
                </button>
                <button class="btn-rate-ghost" data-action="rate" data-id="${p.id}">
                    <i data-lucide="star"></i> Avaliar
                </button>
            </div>
        </article>
    `).join('');

    grid.querySelectorAll('button[data-action]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const parceiro = PARCEIROS.find(p => p.id === id);
            if (!parceiro) return;
            const action = btn.dataset.action;
            if (action === 'contact') abrirContato(parceiro);
            else if (action === 'whatsapp') abrirWhatsapp(parceiro.whatsapp);
            else if (action === 'rate') abrirAvaliar(parceiro);
        });
    });

    lucide.createIcons();
    updatePartnersCount();
    refreshParceirosMapMarkers();
}

function updatePartnersCount() {
    const count = getFiltered().length;
    const el = document.getElementById('partners-count');
    if (el) el.textContent = `${count} parceiro${count !== 1 ? 's' : ''}`;
}

// ============================================================
// SEARCH
// ============================================================
function setupSearch() {
    const input = document.getElementById('search-input');
    if (!input) return;
    let t;
    input.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => renderCompanies(), 200);
    });
}

// ============================================================
// HERO BUTTONS
// ============================================================
function setupHeroButtons() {
    const btnIndicar = document.getElementById('btn-open-indicar');
    if (btnIndicar) btnIndicar.addEventListener('click', () => openModal('modal-indicar'));

    const btnMap = document.getElementById('btn-scroll-map');
    if (btnMap) {
        btnMap.addEventListener('click', () => {
            document.getElementById('mapa-parceiros')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    const btnSeeAll = document.getElementById('btn-see-all');
    if (btnSeeAll) {
        btnSeeAll.addEventListener('click', () => {
            document.getElementById('lista-completa')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    const form = document.getElementById('indicar-form');
    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            const nome = document.getElementById('indicar-nome').value.trim();
            if (!nome) return;
            if (typeof db !== 'undefined') {
                db.collection('indicacoes').add({
                    nome,
                    cidade: document.getElementById('indicar-cidade').value.trim(),
                    contato: document.getElementById('indicar-contato').value.trim(),
                    data: new Date()
                }).catch(() => {});
            }
            form.reset();
            closeModal('modal-indicar');
            showToast('Indicação enviada! Validamos em até 72h.');
        });
    }
}

// ============================================================
// MODALS
// ============================================================
function setupModals() {
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
    });
    document.querySelectorAll('.modal-overlay').forEach(ov => {
        ov.addEventListener('click', e => {
            if (e.target === ov) closeModal(ov.id);
        });
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
        }
    });
}

function openModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.add('active'); lucide.createIcons(); }
}
function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('active');
}

// ============================================================
// CONTATO
// ============================================================
function abrirContato(p) {
    document.getElementById('contact-title').textContent = 'Contato — ' + p.nome;
    document.getElementById('contact-body').innerHTML = `
        <div class="contact-info">
            <div class="contact-row">
                <div class="contact-icon"><i data-lucide="building-2"></i></div>
                <div class="contact-text">
                    <span class="contact-label">Empresa</span>
                    <span class="contact-value">${p.nome}</span>
                </div>
            </div>
            <div class="contact-row">
                <div class="contact-icon"><i data-lucide="map-pin"></i></div>
                <div class="contact-text">
                    <span class="contact-label">Localização</span>
                    <span class="contact-value">${p.cidade}</span>
                </div>
            </div>
            <div class="contact-row">
                <div class="contact-icon"><i data-lucide="mail"></i></div>
                <div class="contact-text">
                    <span class="contact-label">E-mail</span>
                    <span class="contact-value">${p.email}</span>
                </div>
            </div>
            <div class="contact-row">
                <div class="contact-icon"><i data-lucide="phone"></i></div>
                <div class="contact-text">
                    <span class="contact-label">Telefone</span>
                    <span class="contact-value">${p.telefone}</span>
                </div>
            </div>
            <div class="contact-row">
                <div class="contact-icon"><i data-lucide="file-text"></i></div>
                <div class="contact-text">
                    <span class="contact-label">CNPJ</span>
                    <span class="contact-value">${p.cnpj}</span>
                </div>
            </div>
        </div>
        <button class="btn-primary-green full" onclick="abrirWhatsapp('${p.whatsapp}')">
            <i data-lucide="message-circle"></i> Enviar WhatsApp
        </button>
    `;
    openModal('modal-contato');
}

function abrirWhatsapp(numero) {
    const num = (numero || '').replace(/\D/g, '');
    if (!num) { showToast('Telefone não informado', 'error'); return; }
    const tel = num.startsWith('55') ? num : '55' + num;
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent('Olá! Vi seu perfil no Eco Pneus e gostaria de saber mais sobre coleta de pneus.')}`, '_blank');
}

// ============================================================
// AVALIAR
// ============================================================
function setupReviewStars() {
    document.querySelectorAll('#review-stars .star-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            activeReviewStars = parseInt(btn.dataset.star);
            document.querySelectorAll('#review-stars .star-btn').forEach((b, i) => {
                b.classList.toggle('active', i < activeReviewStars);
            });
        });
    });
    const submit = document.getElementById('submit-review-btn');
    if (submit) submit.addEventListener('click', enviarAvaliacao);
}

function abrirAvaliar(p) {
    activeReviewCompanyId = p.id;
    activeReviewStars = 0;
    document.getElementById('review-company-name').textContent = p.nome;
    document.getElementById('review-comment').value = '';
    document.querySelectorAll('#review-stars .star-btn').forEach(b => b.classList.remove('active'));
    openModal('modal-avaliar');
}

async function enviarAvaliacao() {
    if (activeReviewStars === 0) { showToast('Selecione pelo menos 1 estrela', 'error'); return; }
    const comentario = document.getElementById('review-comment').value.trim();
    try {
        if (typeof db !== 'undefined' && typeof auth !== 'undefined' && auth.currentUser) {
            await db.collection('avaliacoes').add({
                empresaId: activeReviewCompanyId,
                avaliadorId: auth.currentUser.uid,
                nomeAvaliador: auth.currentUser.displayName || 'Usuário',
                estrelas: activeReviewStars,
                comentario,
                data: new Date()
            });
        }
        showToast('Avaliação enviada com sucesso!');
        closeModal('modal-avaliar');
    } catch (e) {
        console.error(e);
        showToast('Erro ao enviar avaliação', 'error');
    }
}

// ============================================================
// MAP (Leaflet)
// ============================================================
function initMap() {
    const mapEl = document.getElementById('partners-map');
    if (!mapEl || typeof L === 'undefined') return;

    const overlay = document.getElementById('fixed-markers-overlay');
    if (overlay) {
        overlay.innerHTML = '';
        overlay.style.display = 'none';
    }

    mapInstance = L.map('partners-map', {
        zoomControl: true,
        scrollWheelZoom: false
    }).setView([-14.235, -51.9253], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(mapInstance);

    partnerMarkersLayer = L.layerGroup().addTo(mapInstance);
    bindPartnersMapResizeOnce();
    schedulePartnersMapInvalidate();

    setTimeout(function () {
        schedulePartnersMapInvalidate();
    }, 220);

    setTimeout(function () {
        hydrateParceiroCoordsFromAddress();
    }, 500);
}

// ============================================================
// TOAST
// ============================================================
function showToast(message, type = 'success') {
    const stack = document.getElementById('toast-stack');
    if (!stack) return;
    const t = document.createElement('div');
    t.className = 'toast' + (type === 'error' ? ' error' : '');
    t.textContent = message;
    stack.appendChild(t);
    setTimeout(() => {
        t.style.opacity = '0';
        t.style.transform = 'translateX(20px)';
        t.style.transition = 'all 0.3s ease';
        setTimeout(() => t.remove(), 300);
    }, 3000);
}