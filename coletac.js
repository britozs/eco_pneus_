// ============================================================
// ECO PNEUS - coletac.js
// Ajustado para o HTML/CSS atual
// Mantém:
// - Firebase Auth
// - Firestore
// - Leaflet / OSM
// ============================================================

let map;
let marker;
let reviewMap;
let reviewMarker;

let lat = -22.87834;
let lng = -47.06399;

let currentStep = 1;
let currentAddress = 'Buscando localização...';
let ultimoCodigoGerado = '----';

let colTipo = 'Passeio';
let colUrg = 'normal';
let pesoManual = false;

const TIPO_PESOS = {
    'Passeio': 8,
    'Caminhão': 65,
    'Moto': 4,
    'Ônibus': 55,
    'Agrícola': 120,
    'Outro': 10
};

// --------------------------------------------------
// AUTH
// --------------------------------------------------
if (typeof auth !== 'undefined' && auth?.onAuthStateChanged) {
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'login.html';
        }
    });
}

// --------------------------------------------------
// INIT
// --------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    initFallbackHelpers();
    readInitialSelections();
    initMap();
    initReviewMap();
    bindEvents();
    garantirQuantidadeMinima();
    syncPesoEstimado(true);
    updateObsCounter();
    updateLocationUI();
    updateStepper(1);
    renderAllReviewData();
    updateConfirmButtonState();
    scheduleLeafletResize();
});

window.addEventListener('load', () => {
    scheduleLeafletResize();
});

window.addEventListener('resize', () => {
    scheduleLeafletResize();
});

// --------------------------------------------------
// LEITURA INICIAL DO HTML
// --------------------------------------------------
function readInitialSelections() {
    const tipoAtivo = document.querySelector('.tipo-chip.active');
    if (tipoAtivo) {
        colTipo = tipoAtivo.dataset.tipo || obterTextoTipoDoBotao(tipoAtivo);
    }

    const urgAtiva =
        document.querySelector('.urg-chip.active-low') ||
        document.querySelector('.urg-chip.active-med') ||
        document.querySelector('.urg-chip.active-high');

    if (urgAtiva) {
        const txt = urgAtiva.textContent.trim().toLowerCase();
        if (txt.includes('baixa')) colUrg = 'baixa';
        else if (txt.includes('alta')) colUrg = 'alta';
        else colUrg = 'normal';
    }

    const pesoInput = document.getElementById('col-peso');
    const qtdInput = document.getElementById('col-qtd');

    if (pesoInput && qtdInput) {
        const qtd = parseInt(qtdInput.value || '0', 10);
        const autoPeso = calcularPesoEstimado(colTipo, qtd);
        const pesoAtual = parseFloat(pesoInput.value || '0');
        pesoManual = pesoInput.value.trim() !== '' && pesoAtual !== autoPeso;
    }
}

// --------------------------------------------------
// EVENTOS
// --------------------------------------------------
function bindEvents() {
    const searchInput = document.getElementById('search-address');
    const qtdInput = document.getElementById('col-qtd');
    const pesoInput = document.getElementById('col-peso');
    const obsInput = document.getElementById('col-obs');
    const nomeInput = document.getElementById('resp-nome');
    const telefoneInput = document.getElementById('resp-telefone');
    const checkbox = document.getElementById('confirmacao-final');

    const btnMinus = document.getElementById('btn-qtd-minus');
    const btnPlus = document.getElementById('btn-qtd-plus');
    const qtyChips = document.querySelectorAll('.qty-chip-modern');

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

    if (btnMinus) {
        btnMinus.addEventListener('click', () => {
            alterarQuantidade(-1);
        });
    }

    if (btnPlus) {
        btnPlus.addEventListener('click', () => {
            alterarQuantidade(1);
        });
    }

    qtyChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const valor = parseInt(chip.dataset.add || '0', 10);
            if (!valor) return;

            if (qtdInput) {
                qtdInput.value = valor;
                garantirQuantidadeMinima();
                syncPesoEstimado(false);
                updateQtyShortcutState();
                renderAllReviewData();
            }
        });
    });

    if (qtdInput) {
        qtdInput.addEventListener('input', () => {
            garantirQuantidadeMinima();
            syncPesoEstimado(false);
            updateQtyShortcutState();
            renderAllReviewData();
        });
    }

    if (pesoInput) {
        pesoInput.addEventListener('input', () => {
            const valor = pesoInput.value.trim();
            pesoManual = valor !== '';
            renderAllReviewData();
            updatePesoHelpText();
        });
    }

    if (obsInput) {
        obsInput.addEventListener('input', () => {
            updateObsCounter();
            renderAllReviewData();
        });
    }

    if (nomeInput) {
        nomeInput.addEventListener('input', () => {
            renderAllReviewData();
            updateConfirmButtonState();
        });
    }

    if (telefoneInput) {
        telefoneInput.addEventListener('input', (e) => {
            e.target.value = formatarTelefone(e.target.value);
            renderAllReviewData();
            updateConfirmButtonState();
        });
    }

    if (checkbox) {
        checkbox.addEventListener('change', updateConfirmButtonState);
    }
}

function alterarQuantidade(delta) {
    const qtdInput = document.getElementById('col-qtd');
    if (!qtdInput) return;

    let qtd = parseInt(qtdInput.value || '0', 10);
    if (!Number.isFinite(qtd)) qtd = 0;

    qtd += delta;
    if (qtd < 1) qtd = 1;

    qtdInput.value = qtd;
    garantirQuantidadeMinima();
    syncPesoEstimado(false);
    updateQtyShortcutState();
    renderAllReviewData();
}

function updateQtyShortcutState() {
    const qtd = parseInt(document.getElementById('col-qtd')?.value || '0', 10);

    document.querySelectorAll('.qty-chip-modern').forEach(chip => {
        chip.classList.remove('active');
        const valor = parseInt(chip.dataset.add || '0', 10);
        if (valor === qtd) chip.classList.add('active');
    });
}

function updateObsCounter() {
    const obs = document.getElementById('col-obs');
    const counter = document.getElementById('obs-counter');
    if (!obs || !counter) return;

    counter.textContent = `${obs.value.length}/300`;
}

// --------------------------------------------------
// MAPA PRINCIPAL
// --------------------------------------------------
function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement || typeof L === 'undefined') return;

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
        renderAllReviewData();
    });

    marker.on('dragend', async (e) => {
        const pos = e.target.getLatLng();
        lat = pos.lat;
        lng = pos.lng;
        syncReviewMap();
        await updateLocationText();
        renderAllReviewData();
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                lat = pos.coords.latitude;
                lng = pos.coords.longitude;

                if (map) map.setView([lat, lng], 16);
                if (marker) marker.setLatLng([lat, lng]);

                syncReviewMap();
                await updateLocationText();
                renderAllReviewData();
            },
            async () => {
                await updateLocationText();
                renderAllReviewData();
            },
            { enableHighAccuracy: true, timeout: 9000 }
        );
    } else {
        updateLocationText();
        renderAllReviewData();
    }
}

// --------------------------------------------------
// MINI MAPA DA CONFIRMAÇÃO
// --------------------------------------------------
function initReviewMap() {
    const reviewElement = document.getElementById('review-map');
    if (!reviewElement || typeof L === 'undefined') return;

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

// --------------------------------------------------
// REDIMENSIONAMENTO DOS MAPAS
// --------------------------------------------------
function scheduleLeafletResize() {
    const run = () => {
        try {
            if (map) map.invalidateSize();
            if (reviewMap) reviewMap.invalidateSize();
            syncReviewMap();
        } catch (e) {}
    };

    requestAnimationFrame(run);
    setTimeout(run, 100);
    setTimeout(run, 300);
    setTimeout(run, 700);
}

// --------------------------------------------------
// GEOLOCALIZAÇÃO
// --------------------------------------------------
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

            if (map) map.setView([lat, lng], 16);
            if (marker) marker.setLatLng([lat, lng]);

            syncReviewMap();
            await updateLocationText();
            renderAllReviewData();

            showToast('Localização capturada com sucesso.');
            setLoadingState(btn, false);
        },
        () => {
            showToast('Não foi possível obter sua localização.', 'error');
            setLoadingState(btn, false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

// --------------------------------------------------
// BUSCA DE ENDEREÇO
// --------------------------------------------------
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

        if (map) map.setView([lat, lng], 17);
        if (marker) marker.setLatLng([lat, lng]);

        currentAddress = montarEnderecoBusca(data[0].display_name || query);
        updateLocationUI();
        syncReviewMap();
        renderAllReviewData();

        showToast('Endereço localizado com sucesso.');
    } catch (error) {
        console.error('Erro ao buscar endereço:', error);
        showToast('Erro ao buscar endereço.', 'error');
    } finally {
        input.disabled = false;
        input.placeholder = originalPlaceholder;
    }
}

function montarEnderecoBusca(displayName) {
    if (!displayName) return 'Endereço selecionado';
    return displayName.replace('Brasil', '').replace(/\s+,/g, ',').trim();
}

// --------------------------------------------------
// REVERSE GEOCODING
// --------------------------------------------------
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

    const partes = [linha1, linha2, linha3].filter(Boolean);

    return partes.length ? partes.join(' | ') : (data.display_name || 'Local selecionado');
}

function updateLocationUI() {
    const locText = document.getElementById('loc-text');
    const locCoords = document.getElementById('loc-coords');

    if (locText) locText.textContent = currentAddress;
    if (locCoords) locCoords.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

// --------------------------------------------------
// NAVEGAÇÃO ENTRE ETAPAS
// --------------------------------------------------
function nextStep(step) {
    if (step === 2 && !validateStep1()) return;
    if (step === 3 && !validateStep2()) return;

    currentStep = step;

    const success = document.getElementById('success-screen');
    if (success) success.classList.remove('active');

    document.querySelectorAll('.step-screen').forEach(el => {
        el.classList.remove('active');
    });

    const target = document.getElementById(`step-${step}`);
    if (target) target.classList.add('active');

    updateStepper(step);

    if (step === 1) {
        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 120);
    }

    if (step === 3) {
        renderAllReviewData();
        syncReviewMap();

        setTimeout(() => {
            if (reviewMap) reviewMap.invalidateSize();
            syncReviewMap();
        }, 150);
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

// --------------------------------------------------
// VALIDAÇÕES
// --------------------------------------------------
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

function validateStep3() {
    const nome = document.getElementById('resp-nome')?.value.trim() || '';
    const telefone = document.getElementById('resp-telefone')?.value.trim() || '';
    const confirmado = document.getElementById('confirmacao-final')?.checked || false;

    if (!nome) {
        showToast('Informe o nome do responsável.', 'error');
        return false;
    }

    if (!telefone || telefone.replace(/\D/g, '').length < 10) {
        showToast('Informe um telefone válido.', 'error');
        return false;
    }

    if (!confirmado) {
        showToast('Confirme as informações para continuar.', 'error');
        return false;
    }

    return true;
}

// --------------------------------------------------
// TIPO / URGÊNCIA
// --------------------------------------------------
function selTipo(el, tipo, pesoPorUnidade) {
    document.querySelectorAll('.tipo-chip').forEach(btn => btn.classList.remove('active'));
    el.classList.add('active');

    colTipo = tipo || obterTextoTipoDoBotao(el);

    if (typeof pesoPorUnidade === 'number' && !Number.isNaN(pesoPorUnidade)) {
        TIPO_PESOS[colTipo] = pesoPorUnidade;
    }

    syncPesoEstimado(false);
    renderAllReviewData();
}

function selUrg(el, urg, style) {
    document.querySelectorAll('.urg-chip').forEach(btn => {
        btn.classList.remove('active-low', 'active-med', 'active-high');
    });

    if (style === 'low') el.classList.add('active-low');
    else if (style === 'high') el.classList.add('active-high');
    else el.classList.add('active-med');

    colUrg = urg || 'normal';
    renderAllReviewData();
}

function obterTextoTipoDoBotao(el) {
    if (!el) return 'Passeio';
    const strong = el.querySelector('strong');
    return strong ? strong.textContent.trim() : (el.textContent.trim() || 'Passeio');
}

function getUrgenciaLabel(valor) {
    if (valor === 'baixa') return 'Baixa';
    if (valor === 'alta') return 'Alta';
    return 'Normal';
}

function getJanelaUrgencia(valor) {
    if (valor === 'alta') return 'Próximas 24h';
    if (valor === 'baixa') return 'Próximos 5 dias';
    return 'Próximas 72h';
}

// --------------------------------------------------
// PESO / IMPACTO / RESUMO
// --------------------------------------------------
function calcularPesoEstimado(tipo, qtd) {
    const pesoUn = TIPO_PESOS[tipo] || 8;
    return Math.max(0, pesoUn * (qtd || 0));
}

function garantirQuantidadeMinima() {
    const qtdInput = document.getElementById('col-qtd');
    if (!qtdInput) return;

    let qtd = parseInt(qtdInput.value || '0', 10);
    if (!qtd || qtd < 1) qtd = 1;
    qtdInput.value = qtd;
}

function syncPesoEstimado(force = false) {
    const qtdInput = document.getElementById('col-qtd');
    const pesoInput = document.getElementById('col-peso');

    if (!qtdInput || !pesoInput) return;

    const qtd = parseInt(qtdInput.value || '0', 10);
    const autoPeso = calcularPesoEstimado(colTipo, qtd);

    if (force || !pesoManual || pesoInput.value.trim() === '') {
        pesoInput.value = autoPeso;
        pesoManual = false;
    }

    updatePesoHelpText();
}

function updatePesoHelpText() {
    const help = document.getElementById('peso-help-text');
    const qtd = parseInt(document.getElementById('col-qtd')?.value || '0', 10);
    const autoPeso = calcularPesoEstimado(colTipo, qtd);
    const pesoAtual = getPesoAtual();

    if (!help) return;

    if (pesoManual) {
        help.textContent = `Peso automático sugerido: ${autoPeso} kg (${TIPO_PESOS[colTipo] || 0} kg × ${qtd}).`;
    } else {
        help.textContent = `Sugerido automaticamente: ${pesoAtual} kg (${TIPO_PESOS[colTipo] || 0} kg × ${qtd}).`;
    }
}

function getPesoAtual() {
    const qtd = parseInt(document.getElementById('col-qtd')?.value || '0', 10);
    const pesoDigitado = document.getElementById('col-peso')?.value?.trim() || '';

    if (pesoDigitado !== '') {
        return Math.round(parseFloat(pesoDigitado) || 0);
    }

    return Math.round(calcularPesoEstimado(colTipo, qtd));
}

function calcularImpacto() {
    const qtd = parseInt(document.getElementById('col-qtd')?.value || '0', 10);
    const peso = getPesoAtual();

    let co2Kg = 0;

    // Regra principal da UI:
    // cada pneu ≈ 2kg CO2 evitados
    if (qtd > 0) {
        co2Kg = qtd * 2;
    } else if (peso > 0) {
        co2Kg = peso * 0.1;
    }

    return {
        pesoKg: Math.round(peso),
        co2Kg: Math.round(co2Kg),
        co2Ton: co2Kg / 1000
    };
}

function formatarImpacto(co2Kg, co2Ton) {
    if (co2Kg >= 1000) {
        return `${co2Ton.toFixed(2)} t`;
    }
    return `${Math.round(co2Kg)} kg`;
}

function renderAllReviewData() {
    renderResumoFinal();
    renderMiniCard();
    updateConfirmButtonState();
}

function renderResumoFinal() {
    const qtd = parseInt(document.getElementById('col-qtd')?.value || '0', 10);
    const peso = getPesoAtual();
    const obs = document.getElementById('col-obs')?.value.trim() || 'Nenhuma observação';

    const summaryTipo = document.getElementById('summary-tipo');
    const summaryQtd = document.getElementById('summary-qtd');
    const summaryPeso = document.getElementById('summary-peso');
    const summaryEndereco = document.getElementById('summary-endereco');
    const summaryUrgencia = document.getElementById('summary-urgencia');
    const summaryObs = document.getElementById('summary-observacoes');

    if (summaryTipo) summaryTipo.textContent = colTipo || 'Passeio';
    if (summaryQtd) summaryQtd.textContent = `${qtd} unidade${qtd === 1 ? '' : 's'}`;
    if (summaryPeso) summaryPeso.textContent = `${peso} kg`;
    if (summaryEndereco) summaryEndereco.textContent = currentAddress || 'Endereço não definido';
    if (summaryUrgencia) summaryUrgencia.textContent = getUrgenciaLabel(colUrg);
    if (summaryObs) summaryObs.textContent = obs;
}

function renderMiniCard() {
    const qtd = parseInt(document.getElementById('col-qtd')?.value || '0', 10);
    const peso = getPesoAtual();
    const impacto = calcularImpacto();

    const nome = document.getElementById('resp-nome')?.value.trim() || 'Pendente';
    const telefone = document.getElementById('resp-telefone')?.value.trim() || 'Pendente';

    const miniTipo = document.getElementById('mini-tipo');
    const miniQtd = document.getElementById('mini-qtd');
    const miniPeso = document.getElementById('mini-peso');
    const miniCo2 = document.getElementById('mini-co2');
    const miniUrg = document.getElementById('mini-urgencia');
    const miniEndereco = document.getElementById('mini-endereco');
    const miniJanela = document.getElementById('mini-janela');
    const miniResp = document.getElementById('mini-responsavel');
    const miniContato = document.getElementById('mini-contato');

    if (miniTipo) miniTipo.textContent = colTipo || 'Passeio';
    if (miniQtd) miniQtd.textContent = `${qtd} unidade${qtd === 1 ? '' : 's'}`;
    if (miniPeso) miniPeso.textContent = `${peso} kg`;
    if (miniCo2) miniCo2.textContent = formatarImpacto(impacto.co2Kg, impacto.co2Ton);
    if (miniUrg) miniUrg.textContent = getUrgenciaLabel(colUrg);
    if (miniEndereco) miniEndereco.textContent = currentAddress || 'Endereço não definido';
    if (miniJanela) miniJanela.textContent = getJanelaUrgencia(colUrg);
    if (miniResp) miniResp.textContent = nome;
    if (miniContato) miniContato.textContent = telefone;
}

// --------------------------------------------------
// BOTÃO DE CONFIRMAÇÃO
// --------------------------------------------------
function updateConfirmButtonState() {
    const btn = document.getElementById('confirm-submit-btn');
    if (!btn) return;

    const nome = document.getElementById('resp-nome')?.value.trim() || '';
    const telefone = document.getElementById('resp-telefone')?.value.trim() || '';
    const confirmado = document.getElementById('confirmacao-final')?.checked || false;

    const telefoneValido = telefone.replace(/\D/g, '').length >= 10;
    btn.disabled = !(nome && telefoneValido && confirmado);
}

// --------------------------------------------------
// FIRESTORE / CRIAR COLETA
// --------------------------------------------------
async function criarColeta() {
    if (!validateStep1() || !validateStep2() || !validateStep3()) return;

    const btn = document.getElementById('confirm-submit-btn');
    setLoadingState(btn, true, 'Confirmando...');

    try {
        if (typeof auth === 'undefined' || typeof db === 'undefined') {
            showToast('Firebase não foi inicializado corretamente.', 'error');
            setLoadingState(btn, false);
            return;
        }

        const user = auth.currentUser;

        if (!user) {
            showToast('Sessão expirada. Faça login novamente.', 'error');
            window.location.href = 'login.html';
            return;
        }

        const qtd = parseInt(document.getElementById('col-qtd')?.value || '0', 10);
        const peso = getPesoAtual();
        const obs = document.getElementById('col-obs')?.value.trim() || '';
        const responsavelNome = document.getElementById('resp-nome')?.value.trim() || '';
        const responsavelTelefone = document.getElementById('resp-telefone')?.value.trim() || '';
        const impacto = calcularImpacto();
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
            responsavelNome: responsavelNome,
            responsavelTelefone: responsavelTelefone,
            status: 'pendente',
            codigo: codigo,
            impactoCo2Kg: impacto.co2Kg,
            criadoEm: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('coletas').add(payload);

        ultimoCodigoGerado = codigo;

        const resultCodigo = document.getElementById('result-codigo');
        if (resultCodigo) resultCodigo.textContent = codigo;

        setLoadingState(btn, false);
        abrirTelaSucesso();

        showToast(`Coleta registrada com sucesso. Código: ${codigo}`);
    } catch (error) {
        console.error('Erro ao criar coleta:', error);
        showToast('Erro ao registrar coleta. Tente novamente.', 'error');
        setLoadingState(btn, false);
    }
}

function abrirTelaSucesso() {
    document.querySelectorAll('.step-screen').forEach(el => {
        el.classList.remove('active');
    });

    const success = document.getElementById('success-screen');
    if (success) success.classList.add('active');

    updateStepper(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --------------------------------------------------
// AÇÕES DE TELA
// --------------------------------------------------
function voltar() {
    window.location.href = 'dashboard.html';
}

async function copiarCodigo() {
    const codigo = ultimoCodigoGerado || document.getElementById('result-codigo')?.textContent || '----';
    const btnText = document.getElementById('copy-btn-text');

    try {
        await navigator.clipboard.writeText(codigo);

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
    ultimoCodigoGerado = '----';
    colTipo = 'Passeio';
    colUrg = 'normal';
    pesoManual = false;

    const search = document.getElementById('search-address');
    const qtd = document.getElementById('col-qtd');
    const peso = document.getElementById('col-peso');
    const obs = document.getElementById('col-obs');
    const nome = document.getElementById('resp-nome');
    const tel = document.getElementById('resp-telefone');
    const check = document.getElementById('confirmacao-final');
    const success = document.getElementById('success-screen');
    const resultCodigo = document.getElementById('result-codigo');
    const copyBtnText = document.getElementById('copy-btn-text');

    if (search) search.value = '';
    if (qtd) qtd.value = 50;
    if (peso) peso.value = 400;
    if (obs) obs.value = '';
    if (nome) nome.value = '';
    if (tel) tel.value = '';
    if (check) check.checked = false;
    if (resultCodigo) resultCodigo.textContent = '----';
    if (copyBtnText) copyBtnText.textContent = 'Copiar código';

    document.querySelectorAll('.tipo-chip').forEach(btn => btn.classList.remove('active'));
    const primeiroTipo = document.querySelector('.tipo-chip[data-tipo="Passeio"]') || document.querySelector('.tipo-chip');
    if (primeiroTipo) primeiroTipo.classList.add('active');

    document.querySelectorAll('.urg-chip').forEach(btn => {
        btn.classList.remove('active-low', 'active-med', 'active-high');
    });

    const urgNormal = Array.from(document.querySelectorAll('.urg-chip')).find(btn =>
        btn.textContent.toLowerCase().includes('normal')
    );
    if (urgNormal) urgNormal.classList.add('active-med');

    if (success) success.classList.remove('active');

    document.querySelectorAll('.step-screen').forEach(el => el.classList.remove('active'));
    document.getElementById('step-1')?.classList.add('active');

    updateObsCounter();
    updateQtyShortcutState();
    updateStepper(1);
    updateLocationUI();
    syncPesoEstimado(true);
    renderAllReviewData();
    updateConfirmButtonState();

    setTimeout(() => {
        if (map) map.invalidateSize();
        if (reviewMap) reviewMap.invalidateSize();
        syncReviewMap();
    }, 120);

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --------------------------------------------------
// HELPERS
// --------------------------------------------------
function gerarCodigoRastreamento() {
    const letras = Math.random().toString(36).substring(2, 6).toUpperCase();
    const numeros = Math.floor(1000 + Math.random() * 9000);
    return `EC-${letras}-${numeros}`;
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

function formatarTelefone(valor) {
    let v = String(valor || '').replace(/\D/g, '');

    if (v.length > 11) v = v.slice(0, 11);

    if (v.length <= 10) {
        return v
            .replace(/^(\d{2})(\d)/g, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2');
    }

    return v
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
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
