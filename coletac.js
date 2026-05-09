// ============================================================
// ECO PNEUS - Coleta com Mapa (design rewrite sem mudar backend)
// Mantém:
// - auth / db
// - Firebase Auth
// - Firestore collection('coletas').add(...)
// - Leaflet / OpenStreetMap
// ============================================================

let map;
let marker;
let reviewMap;
let reviewMarker;

let lat = -22.87834;
let lng = -47.06399;

let colTipo = '';
let colUrg = 'normal';
let currentStep = 1;
let currentAddress = 'Buscando localização...';
let ultimoCodigoGerado = '----';

// ------------------------------------------
// AUTH
// ------------------------------------------
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = 'login.html';
    }
});

// ------------------------------------------
// INIT
// ------------------------------------------
function scheduleLeafletResize() {
    const run = () => {
        try {
            if (map) map.invalidateSize();
            if (reviewMap) reviewMap.invalidateSize();
            syncReviewMap();
        } catch (e) {}
    };
    requestAnimationFrame(run);
    setTimeout(run, 120);
    setTimeout(run, 380);
    setTimeout(run, 800);
}

document.addEventListener('DOMContentLoaded', () => {
    initFallbackHelpers();
    initMap();
    initReviewMap();
    bindEvents();
    updateStepper(1);
    renderImpact();
    scheduleLeafletResize();
    window.addEventListener('resize', scheduleLeafletResize);
    const mapHost = document.getElementById('map');
    if (mapHost && typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => scheduleLeafletResize());
        ro.observe(mapHost.parentElement || mapHost);
    }
    const rm = document.getElementById('review-map');
    if (rm && typeof ResizeObserver !== 'undefined') {
        const ro2 = new ResizeObserver(() => scheduleLeafletResize());
        ro2.observe(rm.parentElement || rm);
    }
});

window.addEventListener('load', () => scheduleLeafletResize());

// ------------------------------------------
// EVENTOS
// ------------------------------------------
function bindEvents() {
    const searchInput = document.getElementById('search-address');
    const qtdInput = document.getElementById('col-qtd');
    const pesoInput = document.getElementById('col-peso');

    if (searchInput) {
        searchInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                await searchAddress();
            }
        });

        searchInput.addEventListener('blur', async () => {
            const value = searchInput.value.trim();
            if (value.length >= 4) {
                await searchAddress();
            }
        });
    }

    if (qtdInput) qtdInput.addEventListener('input', renderImpact);
    if (pesoInput) pesoInput.addEventListener('input', renderImpact);
}

// ------------------------------------------
// MAPA PRINCIPAL
// ------------------------------------------
function initMap() {
    map = L.map('map', {
        zoomControl: true
    }).setView([lat, lng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    marker = L.marker([lat, lng], {
        draggable: true
    }).addTo(map);

    map.on('click', async (e) => {
        lat = e.latlng.lat;
        lng = e.latlng.lng;
        marker.setLatLng([lat, lng]);
        syncReviewMap();
        await updateLocationText();
    });

    marker.on('dragend', async (e) => {
        const pos = e.target.getLatLng();
        lat = pos.lat;
        lng = pos.lng;
        syncReviewMap();
        await updateLocationText();
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                lat = pos.coords.latitude;
                lng = pos.coords.longitude;
                map.setView([lat, lng], 16);
                marker.setLatLng([lat, lng]);
                syncReviewMap();
                await updateLocationText();
            },
            async () => {
                await updateLocationText();
            },
            { enableHighAccuracy: true, timeout: 9000 }
        );
    } else {
        updateLocationText();
    }
}

// ------------------------------------------
// MINI MAPA DA CONFIRMAÇÃO
// ------------------------------------------
function initReviewMap() {
    reviewMap = L.map('review-map', {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        tap: false,
        touchZoom: false
    }).setView([lat, lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: ''
    }).addTo(reviewMap);

    reviewMarker = L.marker([lat, lng]).addTo(reviewMap);
}

function syncReviewMap() {
    if (!reviewMap || !reviewMarker) return;
    reviewMap.setView([lat, lng], 15);
    reviewMarker.setLatLng([lat, lng]);
}

// ------------------------------------------
// GEOLOCALIZAÇÃO
// ------------------------------------------
async function useCurrentLocation() {
    const btn = document.getElementById('geo-btn');
    setLoadingState(btn, true, 'Localizando...');

    if (!navigator.geolocation) {
        showToast('Seu navegador não suporta geolocalização.', 'error');
        setLoadingState(btn, false);
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;

            map.setView([lat, lng], 16);
            marker.setLatLng([lat, lng]);
            syncReviewMap();

            await updateLocationText();
            showToast('Localização atual capturada com sucesso.');
            setLoadingState(btn, false);
        },
        () => {
            showToast('Não foi possível obter sua localização.', 'error');
            setLoadingState(btn, false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

// ------------------------------------------
// BUSCA DE ENDEREÇO
// ------------------------------------------
async function searchAddress() {
    const input = document.getElementById('search-address');
    if (!input) return;

    const query = input.value.trim();

    if (query.length < 3) {
        showToast('Digite pelo menos 3 caracteres para buscar.');
        return;
    }

    const originalPlaceholder = input.placeholder;
    input.disabled = true;
    input.placeholder = 'Buscando endereço...';

    try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&accept-language=pt-BR&q=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            showToast('Endereço não encontrado.', 'error');
            return;
        }

        lat = parseFloat(data[0].lat);
        lng = parseFloat(data[0].lon);

        map.setView([lat, lng], 17);
        marker.setLatLng([lat, lng]);
        syncReviewMap();

        currentAddress = data[0].display_name || query;
        updateLocationUI();

        showToast('Endereço localizado com sucesso.');
    } catch (error) {
        console.error('Erro ao buscar endereço:', error);
        showToast('Erro ao buscar endereço.', 'error');
    } finally {
        input.disabled = false;
        input.placeholder = originalPlaceholder;
    }
}

// ------------------------------------------
// REVERSE GEOCODING / TEXTO DO LOCAL
// ------------------------------------------
async function updateLocationText() {
    currentAddress = 'Atualizando endereço...';
    updateLocationUI();

    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=pt-BR`;
        const response = await fetch(url);
        const data = await response.json();

        if (data && (data.display_name || data.address)) {
            currentAddress = buildFriendlyAddress(data);
        } else {
            currentAddress = `Lat ${lat.toFixed(6)}, Lng ${lng.toFixed(6)}`;
        }
    } catch (error) {
        console.error('Erro ao obter endereço:', error);
        currentAddress = `Lat ${lat.toFixed(6)}, Lng ${lng.toFixed(6)}`;
    }

    updateLocationUI();
}

function buildFriendlyAddress(data) {
    const addr = data.address || {};

    const rua = addr.road || addr.pedestrian || addr.cycleway || addr.footway || '';
    const numero = addr.house_number || '';
    const bairro = addr.suburb || addr.neighbourhood || addr.quarter || '';
    const cidade = addr.city || addr.town || addr.village || addr.municipality || '';
    const estado = addr.state || '';
    const cep = addr.postcode || '';

    const linha1 = [rua, numero].filter(Boolean).join(', ');
    const linha2 = [bairro, cidade].filter(Boolean).join(' - ');
    const linha3 = [estado, cep].filter(Boolean).join(' • ');

    const parts = [linha1, linha2, linha3].filter(Boolean);

    return parts.length ? parts.join(' | ') : (data.display_name || 'Local selecionado');
}

function updateLocationUI() {
    const locText = document.getElementById('loc-text');
    const locCoords = document.getElementById('loc-coords');

    if (locText) locText.textContent = currentAddress;
    if (locCoords) locCoords.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

// ------------------------------------------
// STEPS
// ------------------------------------------
function nextStep(step) {
    if (step === 2 && !validateStep1()) return;
    if (step === 3 && !validateStep2()) return;

    currentStep = step;

    document.querySelectorAll('.step-screen').forEach(el => {
        el.classList.remove('active');
    });

    const target = document.getElementById(`step-${step}`);
    if (target) target.classList.add('active');

    updateStepper(step);

    if (step === 1 && map) {
        setTimeout(() => map.invalidateSize(), 120);
    }

    if (step === 3) {
        renderSummary();
        renderImpact();
        syncReviewMap();

        setTimeout(() => {
            if (reviewMap) reviewMap.invalidateSize();
            syncReviewMap();
        }, 120);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStepper(step) {
    for (let i = 1; i <= 3; i++) {
        const item = document.getElementById(`step-item-${i}`);
        if (!item) continue;

        item.classList.remove('active', 'done');

        if (i < step) item.classList.add('done');
        if (i === step) item.classList.add('active');
    }
}

function validateStep1() {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        showToast('Selecione um local válido no mapa.', 'error');
        return false;
    }
    return true;
}

function validateStep2() {
    const qtd = parseInt(document.getElementById('col-qtd')?.value || '0', 10);

    if (!colTipo) {
        showToast('Selecione o tipo de pneu.', 'error');
        return false;
    }

    if (!qtd || qtd < 1) {
        showToast('Informe uma quantidade válida.', 'error');
        return false;
    }

    return true;
}

// ------------------------------------------
// TIPO / URGÊNCIA
// ------------------------------------------
function selTipo(el, tipo) {
    document.querySelectorAll('.tipo-chip').forEach(btn => btn.classList.remove('active'));
    el.classList.add('active');
    colTipo = tipo;
}

function selUrg(el, urg, style) {
    document.querySelectorAll('.urg-chip').forEach(btn => {
        btn.classList.remove('active-low', 'active-med', 'active-high');
    });

    if (style === 'low') el.classList.add('active-low');
    if (style === 'med') el.classList.add('active-med');
    if (style === 'high') el.classList.add('active-high');

    colUrg = urg;
}

function getUrgenciaLabel(valor) {
    if (valor === 'baixa') return 'Baixa';
    if (valor === 'alta') return 'Alta';
    return 'Normal';
}

function getUrgenciaClass(valor) {
    if (valor === 'baixa') return 'low';
    if (valor === 'alta') return 'high';
    return 'med';
}

// ------------------------------------------
// RESUMO + IMPACTO
// ------------------------------------------
function renderSummary() {
    const summary = document.getElementById('summary');
    if (!summary) return;

    const qtd = document.getElementById('col-qtd')?.value || '-';
    const peso = document.getElementById('col-peso')?.value || 'Não informado';
    const obs = document.getElementById('col-obs')?.value.trim() || 'Nenhuma observação';

    summary.innerHTML = `
        <div class="summary-row">
            <div class="summary-label">LOCAL</div>
            <div class="summary-value">${escapeHtml(currentAddress)}</div>
        </div>

        <div class="summary-row">
            <div class="summary-label">COORDENADAS</div>
            <div class="summary-value">${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
        </div>

        <div class="summary-row">
            <div class="summary-label">TIPO DE PNEU</div>
            <div class="summary-value">${escapeHtml(colTipo || '-')}</div>
        </div>

        <div class="summary-row">
            <div class="summary-label">QUANTIDADE</div>
            <div class="summary-value">${qtd} pneu(s)</div>
        </div>

        <div class="summary-row">
            <div class="summary-label">PESO ESTIMADO</div>
            <div class="summary-value">${peso === 'Não informado' ? peso : `${peso} kg`}</div>
        </div>

        <div class="summary-row">
            <div class="summary-label">URGÊNCIA</div>
            <div class="summary-value">
                <span class="summary-urg">
                    <span class="urg-dot ${getUrgenciaClass(colUrg)}"></span>
                    <span>${getUrgenciaLabel(colUrg)}</span>
                </span>
            </div>
        </div>

        <div class="summary-row">
            <div class="summary-label">OBSERVAÇÕES</div>
            <div class="summary-value">${escapeHtml(obs)}</div>
        </div>
    `;
}

function renderImpact() {
    const impactValue = document.getElementById('impact-value');
    const impactNote = document.getElementById('impact-note');

    if (!impactValue || !impactNote) return;

    const qtd = parseInt(document.getElementById('col-qtd')?.value || '0', 10);
    const peso = parseFloat(document.getElementById('col-peso')?.value || '0');

    // Regra visual baseada no texto da UI:
    // cada pneu ≈ 2kg de CO₂ evitados
    // se não houver qtd, usa peso como fallback leve
    let co2 = 0;

    if (qtd > 0) {
        co2 = qtd * 2;
    } else if (peso > 0) {
        co2 = peso * 0.1;
    }

    const arvores = Math.max(0, Math.round(co2 / 22));
    const kmCarro = Math.max(0, Math.round(co2 / 0.12));

    impactValue.textContent = `${Math.round(co2)} kg CO₂`;
    impactNote.textContent = `Equivalente a plantar ~${arvores} árvore(s) ou ${kmCarro} km de carro evitados.`;
}

function getImpactData() {
    const qtd = parseInt(document.getElementById('col-qtd')?.value || '0', 10);
    const peso = parseFloat(document.getElementById('col-peso')?.value || '0');

    let co2 = 0;

    if (qtd > 0) {
        co2 = qtd * 2;
    } else if (peso > 0) {
        co2 = peso * 0.1;
    }

    return {
        co2Kg: Math.round(co2),
        arvores: Math.max(0, Math.round(co2 / 22)),
        kmCarro: Math.max(0, Math.round(co2 / 0.12))
    };
}

// ------------------------------------------
// FIRESTORE / CRIAR COLETA
// ------------------------------------------
async function criarColeta() {
    if (!validateStep1() || !validateStep2()) return;

    const btn = document.getElementById('confirm-submit-btn');
    setLoadingState(btn, true, 'Confirmando...');

    try {
        const user = auth.currentUser;

        if (!user) {
            showToast('Sessão expirada. Faça login novamente.', 'error');
            window.location.href = 'login.html';
            return;
        }

        const qtd = parseInt(document.getElementById('col-qtd')?.value || '0', 10);
        const pesoStr = document.getElementById('col-peso')?.value || '';
        const peso = pesoStr !== '' ? parseFloat(pesoStr) : null;
        const obs = document.getElementById('col-obs')?.value.trim() || '';
        const impacto = getImpactData();
        const codigo = gerarCodigoRastreamento();

        const payload = {
            uid: user.uid,
            email: user.email || '',
            tipo: colTipo,
            quantidade: qtd,
            peso: peso,
            urgencia: colUrg,
            observacoes: obs,
            endereco: currentAddress,
            latitude: lat,
            longitude: lng,
            status: 'pendente',
            codigo: codigo,
            impactoCo2Kg: impacto.co2Kg,
            criadoEm: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('coletas').add(payload);

        ultimoCodigoGerado = codigo;

        const resultCodigo = document.getElementById('result-codigo');
        if (resultCodigo) resultCodigo.textContent = codigo;

        document.querySelectorAll('.step-screen').forEach(el => el.classList.remove('active'));
        document.getElementById('success-screen')?.classList.add('active');

        updateStepper(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast('Coleta registrada com sucesso.');
    } catch (error) {
        console.error('Erro ao criar coleta:', error);
        showToast('Erro ao registrar coleta. Tente novamente.', 'error');
    } finally {
        setLoadingState(btn, false);
    }
}

// ------------------------------------------
// AÇÕES DE TELA
// ------------------------------------------
function voltar() {
    window.location.href = 'dashboard.html';
}

async function copiarCodigo() {
    const text = ultimoCodigoGerado || document.getElementById('result-codigo')?.textContent || '----';
    const btnText = document.getElementById('copy-btn-text');

    try {
        await navigator.clipboard.writeText(text);
        if (btnText) btnText.textContent = 'Copiado!';
        showToast('Código copiado para a área de transferência.');

        setTimeout(() => {
            if (btnText) btnText.textContent = 'Copiar código';
        }, 1800);
    } catch (error) {
        console.error('Erro ao copiar código:', error);
        showToast('Não foi possível copiar o código.', 'error');
    }
}

function reiniciarColeta() {
    currentStep = 1;
    colTipo = '';
    colUrg = 'normal';
    ultimoCodigoGerado = '----';

    document.getElementById('search-address').value = '';
    document.getElementById('col-qtd').value = '';
    document.getElementById('col-peso').value = '';
    document.getElementById('col-obs').value = '';

    document.querySelectorAll('.tipo-chip').forEach(btn => btn.classList.remove('active'));

    document.querySelectorAll('.urg-chip').forEach(btn => {
        btn.classList.remove('active-low', 'active-med', 'active-high');
    });

    const urgNormal = Array.from(document.querySelectorAll('.urg-chip')).find(btn =>
        btn.textContent.toLowerCase().includes('normal')
    );
    if (urgNormal) urgNormal.classList.add('active-med');

    document.getElementById('success-screen')?.classList.remove('active');

    document.querySelectorAll('.step-screen').forEach(el => el.classList.remove('active'));
    document.getElementById('step-1')?.classList.add('active');

    updateStepper(1);
    renderImpact();
    updateLocationUI();

    setTimeout(() => {
        if (map) map.invalidateSize();
        if (reviewMap) reviewMap.invalidateSize();
        syncReviewMap();
    }, 120);

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ------------------------------------------
// HELPERS
// ------------------------------------------
function gerarCodigoRastreamento() {
    const now = new Date();
    const y = now.getFullYear().toString().slice(-2);
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `EC${y}${m}${d}-${rand}`;
}

function setLoadingState(button, isLoading, loadingText = 'Carregando...') {
    if (!button) return;

    if (!button.dataset.originalHtml) {
        button.dataset.originalHtml = button.innerHTML;
    }

    if (isLoading) {
        button.disabled = true;
        button.innerHTML = `<span>${loadingText}</span>`;
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalHtml;
    }
}

function initFallbackHelpers() {
    if (!document.querySelector('.eco-toast-wrap')) {
        const wrap = document.createElement('div');
        wrap.className = 'eco-toast-wrap';
        document.body.appendChild(wrap);
    }
}

function showToast(message, type = '') {
    const wrap = document.querySelector('.eco-toast-wrap');
    if (!wrap) return;

    const toast = document.createElement('div');
    toast.className = `eco-toast ${type}`.trim();
    toast.textContent = message;

    wrap.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = '0.25s ease';
    }, 2400);

    setTimeout(() => {
        toast.remove();
    }, 2800);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
