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
            PARCEIROS.forEach(function (p) {
                p.rating = Number.isFinite(Number(p.rating)) ? Number(p.rating) : 0;
                p.avaliacoes = Number.isFinite(Number(p.avaliacoes)) ? Number(p.avaliacoes) : 0;
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
        PARCEIROS.forEach(function (p) {
            p.rating = Number.isFinite(Number(p.rating)) ? Number(p.rating) : 0;
            p.avaliacoes = Number.isFinite(Number(p.avaliacoes)) ? Number(p.avaliacoes) : 0;
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
let activeFilterMode = 'todas';
let activeReviewCompanyId = null;
let activeReviewStars = 0;
let mapInstance = null;
let partnerMarkersLayer = null;
let geocodePartnerTimer = null;
let geocodeQueueRunning = false;
let partnersMapResizeBound = false;
let unsubParceirosFs = null;
let unsubUsuariosEmpFs = null;
let PARCEIROS_EXTRA = [];
let userGeoLat = null;
let userGeoLng = null;

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
        const cat = String(p.categoria || '').toLowerCase();
        const pinClass =
            cat === 'transportadora'
                ? 'eco-pin eco-pin--transport'
                : cat === 'ponto-coleta'
                  ? 'eco-pin eco-pin--gerador'
                  : 'eco-pin eco-pin--recicla';
        const icon = L.divIcon({
            className: 'eco-marker-wrap',
            html: `<div class="${pinClass}" title="${String(p.nome || '').replace(/"/g, '&quot;')}"></div>`,
            iconSize: [34, 34],
            iconAnchor: [17, 34],
            popupAnchor: [0, -30]
        });
        const tipoTxt =
            cat === 'transportadora'
                ? 'Transportadora'
                : cat === 'ponto-coleta'
                  ? 'Geradora / Ponto de coleta'
                  : 'Recicladora';
        const stars = Number(p.rating || 0).toFixed(1);
        const popupHtml = `
            <div class="eco-map-popup">
                <strong>${String(p.nome || '').replace(/</g, '&lt;')}</strong>
                <div class="eco-map-popup-meta">${tipoTxt} · ⭐ ${stars}</div>
                <div class="eco-map-popup-addr">${String(p.cidade || '').replace(/</g, '&lt;')}</div>
                <button type="button" class="eco-map-popup-btn" data-parceiro-scroll="${String(p.id).replace(/"/g, '')}">Ver no diretório</button>
            </div>
        `;
        const marker = L.marker(ll, { icon }).bindPopup(popupHtml, { maxWidth: 260 });
        marker.on('popupopen', () => {
            const b = marker.getPopup().getElement()?.querySelector('[data-parceiro-scroll]');
            if (b) {
                b.onclick = () => {
                    document.getElementById('lista-completa')?.scrollIntoView({ behavior: 'smooth' });
                    const inp = document.getElementById('search-input');
                    if (inp) {
                        inp.value = p.nome || '';
                        inp.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                    mapInstance.closePopup();
                };
            }
        });
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
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function (pos) {
                userGeoLat = pos.coords.latitude;
                userGeoLng = pos.coords.longitude;
                renderCompanies();
                scheduleRefreshMapMarkersDebounced();
            },
            function () {},
            { enableHighAccuracy: false, maximumAge: 120000, timeout: 8000 }
        );
    }
    setupAuth();
    startParceirosAndUsuariosRealtime();
    renderFeatured();
    renderCompanies();
    setupUnifiedFilters();
    setupMapToolbar();
    setupModals();
    setupHeroButtons();
    setupSearch();
    setupReviewStars();
    initMap();
    atualizarHeroResumoNumeros();
});

function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function usuarioEmpresaToParceiro(uid, d) {
    const doc = d || {};
    const te = String(doc.tipoEmpresa || '').toLowerCase();
    let categoria = 'recicladora';
    let tipoLabel = 'RECICLADORA';
    if (te === 'transportadores') {
        categoria = 'transportadora';
        tipoLabel = 'TRANSPORTADORA';
    } else if (te === 'geradores') {
        categoria = 'ponto-coleta';
        tipoLabel = 'PONTO DE COLETA';
    }
    const end = doc.endereco && typeof doc.endereco === 'object' ? doc.endereco : {};
    const cidade = [end.cidade, end.uf].filter(Boolean).join(', ') || String(doc.cidade || 'Brasil');
    const nome = doc.razaoSocial || doc.nome || 'Empresa';
    const la = Number(end.latitude || doc.latitude);
    const lo = Number(end.longitude || doc.longitude);
    let dist = Number(doc.distanciaKm || doc.distancia || 999);
    if (Number.isFinite(userGeoLat) && Number.isFinite(userGeoLng) && Number.isFinite(la) && Number.isFinite(lo)) {
        dist = Math.round(haversineKm(userGeoLat, userGeoLng, la, lo));
    }
    return {
        id: 'usr_' + uid,
        nome,
        sigla: String(nome).trim().slice(0, 2).toUpperCase(),
        categoria,
        tipoLabel,
        cidade,
        distancia: dist,
        rating: Number.isFinite(Number(doc.rating)) ? Number(doc.rating) : 0,
        avaliacoes: Number.isFinite(Number(doc.avaliacoes)) ? Number(doc.avaliacoes) : 0,
        telefone: doc.telefone || '—',
        whatsapp: String(doc.telefone || '').replace(/\D/g, ''),
        email: doc.email || '',
        cnpj: doc.cnpj || '—',
        descricao: doc.descricaoEmpresa || 'Cadastro Eco Pneus.',
        tags: ['Cadastro verificado'],
        imagem: doc.fotoPerfilUrl || doc.imagem || 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=900&q=80',
        badge: '',
        verificado: true,
        ativo: (doc.statusConta || doc.status || 'Ativa') === 'Ativa',
        coletas: Number(doc.totalColetasInformado || doc.coletas || 0),
        reciclado: Number(doc.recicladoT || 0),
        co2Evitado: Number(doc.co2Evitado || 0),
        destaque: false,
        latitude: Number.isFinite(la) ? la : NaN,
        longitude: Number.isFinite(lo) ? lo : NaN
    };
}

function stopParceirosAndUsuariosRealtime() {
    if (unsubParceirosFs) {
        try {
            unsubParceirosFs();
        } catch (e) {}
        unsubParceirosFs = null;
    }
    if (unsubUsuariosEmpFs) {
        try {
            unsubUsuariosEmpFs();
        } catch (e2) {}
        unsubUsuariosEmpFs = null;
    }
}

function startParceirosAndUsuariosRealtime() {
    if (typeof db === 'undefined') return;
    stopParceirosAndUsuariosRealtime();
    try {
        unsubParceirosFs = db.collection('parceiros').onSnapshot(
            function (snap) {
                PARCEIROS = [];
                snap.forEach(function (doc) {
                    var d = doc.data() || {};
                    PARCEIROS.push(Object.assign({ id: doc.id }, d));
                });
                PARCEIROS.forEach(function (p) {
                    p.rating = Number.isFinite(Number(p.rating)) ? Number(p.rating) : 0;
                    p.avaliacoes = Number.isFinite(Number(p.avaliacoes)) ? Number(p.avaliacoes) : 0;
                });
                renderFeatured();
                renderCompanies();
                atualizarHeroResumoNumeros();
                scheduleRefreshMapMarkersDebounced();
            },
            function () {}
        );
    } catch (e) {
        unsubParceirosFs = null;
    }
    try {
        unsubUsuariosEmpFs = db
            .collection('usuarios')
            .where('tipo', '==', 'empresa')
            .limit(80)
            .onSnapshot(
                function (snap) {
                    PARCEIROS_EXTRA = [];
                    snap.forEach(function (doc) {
                        PARCEIROS_EXTRA.push(usuarioEmpresaToParceiro(doc.id, doc.data() || {}));
                    });
                    renderFeatured();
                    renderCompanies();
                    atualizarHeroResumoNumeros();
                    scheduleRefreshMapMarkersDebounced();
                },
                function () {}
            );
    } catch (e2) {
        unsubUsuariosEmpFs = null;
    }
}

function atualizarHeroResumoNumeros() {
    const merged = PARCEIROS.slice();
    PARCEIROS_EXTRA.forEach(function (p) {
        if (!merged.some(function (x) { return x.id === p.id; })) merged.push(p);
    });
    const ativos = merged.filter(function (p) {
        return p.ativo !== false;
    }).length;
    const el1 = document.getElementById('hero-total-ativos');
    if (el1) el1.textContent = ativos + ' parceiro' + (ativos === 1 ? '' : 's') + ' ativos';
    let somaR = 0;
    let nR = 0;
    merged.forEach(function (p) {
        if (Number(p.rating) > 0) {
            somaR += Number(p.rating);
            nR++;
        }
    });
    const media = nR ? (somaR / nR).toFixed(1) : '—';
    const el3 = document.getElementById('hero-media-avaliacao');
    if (el3) el3.textContent = 'Avaliação média ' + media;
    let totAval = 0;
    merged.forEach(function (p) {
        totAval += Number(p.avaliacoes || 0);
    });
    const elAval = document.getElementById('hero-total-avaliacoes-rede');
    if (elAval) elAval.textContent = totAval.toLocaleString('pt-BR') + ' avaliações da rede';
    let totRec = 0;
    merged.forEach(function (p) {
        totRec += Number(p.reciclado || 0);
    });
    const el2 = document.getElementById('hero-total-reciclado');
    if (el2) el2.textContent = totRec.toLocaleString('pt-BR') + ' t recicladas';
}

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
        if (typeof EcoPneusGlobalNotifs !== 'undefined') {
            EcoPneusGlobalNotifs.start(user);
            EcoPneusGlobalNotifs.registerBell(document.getElementById('btn-notification'));
        }
    });
}

// ============================================================
// FEATURED
// ============================================================
function getMergedParceiros() {
    const out = PARCEIROS.slice();
    PARCEIROS_EXTRA.forEach(function (p) {
        if (!out.some(function (x) {
            return x.id === p.id;
        }))
            out.push(p);
    });
    return out;
}

function renderFeatured() {
    const grid = document.getElementById('featured-grid');
    if (!grid) return;
    const merged = getMergedParceiros();
    let destaques = merged.filter(function (p) {
        return p.destaque;
    });
    if (!destaques.length) {
        destaques = merged
            .filter(function (p) {
                return Number(p.rating || 0) >= 4.5;
            })
            .slice(0, 4);
    }
    grid.innerHTML = destaques.map(p => `
        <article class="featured-card" data-id="${p.id}">
            <div class="featured-image">
                <img src="${p.imagem}" alt="${p.nome}" loading="lazy">
                ${p.badge ? `<span class="featured-badge">${badgeIcon(p.badge)} ${p.badge}</span>` : ''}
                <span class="featured-rating">${Number(p.rating || 0).toFixed(1)}</span>
            </div>
            <div class="featured-body">
                <h4>${p.nome} ${p.verificado ? '<span class="verified-tag"><i data-lucide="badge-check"></i> Verificado</span>' : ''}</h4>
                <div class="featured-location">
                    <i data-lucide="map-pin"></i>
                    ${p.cidade} • <span class="dist">${p.distancia} km</span>
                </div>
                <p class="featured-desc">${p.descricao}</p>
                <div class="featured-tags">
                    ${(p.tags || []).map(t => `<span class="featured-tag">${t}</span>`).join('')}
                </div>
            </div>
        </article>
    `).join('');

    grid.querySelectorAll('.featured-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            const parceiro = getMergedParceiros().find(p => p.id === id);
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
// FILTROS (linha única)
// ============================================================
function setupUnifiedFilters() {
    const bar = document.getElementById('empresas-filter-bar');
    if (!bar) return;
    bar.querySelectorAll('.filter-chip[data-filter-mode]').forEach(function (chip) {
        chip.addEventListener('click', function () {
            bar.querySelectorAll('.filter-chip').forEach(function (c) {
                c.classList.remove('active');
                c.setAttribute('aria-selected', 'false');
            });
            chip.classList.add('active');
            chip.setAttribute('aria-selected', 'true');
            activeFilterMode = chip.dataset.filterMode || 'todas';
            syncMapToolbarChips();
            renderCompanies();
            updatePartnersCount();
            updateOrderChip();
            atualizarHeroResumoNumeros();
        });
    });
}

function syncMapToolbarChips() {
    const mode = activeFilterMode;
    const mapToSort = {
        todas: 'rating',
        recicladora: 'rating',
        transportadora: 'rating',
        'ponto-coleta': 'rating',
        'melhor-avaliadas': 'rating',
        'mais-ativos': 'active',
        'mais-proximos': 'distance'
    };
    const sort = mapToSort[mode] || 'rating';
    document.querySelectorAll('#map-toolbar .map-sort-chip').forEach(function (p) {
        p.classList.toggle('active', p.dataset.sort === sort);
    });
}

function setupMapToolbar() {
    document.querySelectorAll('#map-toolbar .map-sort-chip').forEach(function (pill) {
        pill.addEventListener('click', function () {
            document.querySelectorAll('#map-toolbar .map-sort-chip').forEach(function (p) {
                p.classList.remove('active');
            });
            pill.classList.add('active');
            const sort = pill.dataset.sort;
            const bar = document.getElementById('empresas-filter-bar');
            if (!bar) return;
            var mode = 'todas';
            if (sort === 'active') mode = 'mais-ativos';
            else if (sort === 'distance') mode = 'mais-proximos';
            else mode = 'todas';
            activeFilterMode = mode;
            bar.querySelectorAll('.filter-chip').forEach(function (c) {
                c.classList.toggle('active', c.dataset.filterMode === mode);
                c.setAttribute('aria-selected', c.dataset.filterMode === mode ? 'true' : 'false');
            });
            renderCompanies();
            updatePartnersCount();
            updateOrderChip();
        });
    });
}

function updateOrderChip() {
    const chip = document.getElementById('order-chip');
    if (!chip) return;
    const labels = {
        todas: 'Ordem: melhores avaliados',
        recicladora: 'Filtro: Recicladoras',
        transportadora: 'Filtro: Transportadoras',
        'ponto-coleta': 'Filtro: Pontos de coleta',
        'melhor-avaliadas': 'Filtro: Melhor avaliadas',
        'mais-ativos': 'Filtro: Mais ativos',
        'mais-proximos': 'Filtro: Mais próximos'
    };
    chip.textContent = labels[activeFilterMode] || labels.todas;
}

// ============================================================
// COMPANIES GRID
// ============================================================
function getFiltered() {
    let list = getMergedParceiros();

    const mode = activeFilterMode;
    if (mode === 'recicladora') list = list.filter((p) => p.categoria === 'recicladora');
    else if (mode === 'transportadora') list = list.filter((p) => p.categoria === 'transportadora');
    else if (mode === 'ponto-coleta') list = list.filter((p) => p.categoria === 'ponto-coleta');
    else if (mode === 'melhor-avaliadas') list = list.filter((p) => Number(p.rating || 0) >= 4.5);

    const term = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
    if (term) {
        list = list.filter(
            (p) =>
                String(p.nome || '')
                    .toLowerCase()
                    .includes(term) ||
                String(p.cidade || '')
                    .toLowerCase()
                    .includes(term) ||
                String(p.tipoLabel || '')
                    .toLowerCase()
                    .includes(term) ||
                (p.tags && p.tags.some((t) => String(t).toLowerCase().includes(term)))
        );
    }

    if (mode === 'mais-ativos') {
        list.sort((a, b) => Number(b.coletas || 0) - Number(a.coletas || 0));
    } else if (mode === 'mais-proximos') {
        list.forEach((p) => {
            const ll = parceiroLatLng(p);
            if (Number.isFinite(userGeoLat) && Number.isFinite(userGeoLng) && ll) {
                p._distDyn = haversineKm(userGeoLat, userGeoLng, ll[0], ll[1]);
            } else {
                p._distDyn = Number(p.distancia || 9999);
            }
        });
        list.sort((a, b) => (a._distDyn || 9999) - (b._distDyn || 9999));
    } else {
        list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
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
                ${Number(p.rating || 0).toFixed(1)} (${p.avaliacoes} avaliações)
            </div>
            <div class="company-meta">
                <span><i data-lucide="map-pin"></i> ${p.cidade} • ${p.distancia} km</span>
                <span><i data-lucide="phone"></i> ${p.telefone}</span>
            </div>
            <div class="company-tags">
                ${(p.tags || []).map(t => `<span class="company-tag">${t}</span>`).join('')}
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
            const parceiro = getMergedParceiros().find(p => p.id === id);
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

async function atualizarRatingParceiroNaLista(parceiroId) {
    const idx = PARCEIROS.findIndex((x) => x && x.id === parceiroId);
    const idx2 = PARCEIROS_EXTRA.findIndex((x) => x && x.id === parceiroId);
    if (idx < 0 && idx2 < 0) return;
    if (typeof db === 'undefined') return;
    try {
        const snap = await db.collection('avaliacoes').where('parceiroId', '==', parceiroId).get();
        let soma = 0;
        snap.forEach((doc) => {
            soma += Number(doc.data().estrelas || 0);
        });
        const rating = snap.size > 0 ? soma / snap.size : 0;
        const n = snap.size;
        if (idx >= 0) {
            PARCEIROS[idx].rating = rating;
            PARCEIROS[idx].avaliacoes = n;
        }
        if (idx2 >= 0) {
            PARCEIROS_EXTRA[idx2].rating = rating;
            PARCEIROS_EXTRA[idx2].avaliacoes = n;
        }
    } catch (e) {
        console.warn('atualizarRatingParceiroNaLista', e);
    }
    renderFeatured();
    renderCompanies();
    scheduleRefreshMapMarkersDebounced();
}

async function enviarAvaliacao() {
    if (activeReviewStars === 0) {
        showToast('Selecione pelo menos 1 estrela', 'error');
        return;
    }
    const comentario = document.getElementById('review-comment').value.trim();
    if (!activeReviewCompanyId) {
        showToast('Parceiro inválido', 'error');
        return;
    }
    try {
        if (typeof auth === 'undefined' || !auth.currentUser) {
            showToast('Faça login para avaliar', 'error');
            return;
        }
        if (typeof ecoPneusSalvarAvaliacaoParceiro === 'function') {
            await ecoPneusSalvarAvaliacaoParceiro(
                activeReviewCompanyId,
                auth.currentUser,
                activeReviewStars,
                comentario
            );
        } else if (typeof db !== 'undefined') {
            const docId = `${String(activeReviewCompanyId).replace(/\//g, '_')}_${auth.currentUser.uid}`;
            await db.collection('avaliacoes').doc(docId).set(
                {
                    parceiroId: String(activeReviewCompanyId),
                    empresaId: null,
                    avaliadorId: auth.currentUser.uid,
                    nomeAvaliador: auth.currentUser.displayName || 'Usuário',
                    estrelas: Math.min(5, Math.max(1, Number(activeReviewStars) || 0)),
                    comentario,
                    data: firebase.firestore.FieldValue.serverTimestamp()
                },
                { merge: true }
            );
        }
        showToast('Avaliação enviada com sucesso!');
        closeModal('modal-avaliar');
        await atualizarRatingParceiroNaLista(activeReviewCompanyId);
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