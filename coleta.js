// ============================================================
// ECO PNEUS - Coleta com Mapa (Complete)
// ============================================================

let map, marker;
let lat = -22.90, lng = -47.06;
let colTipo = '';
let colUrg = 'normal';
let currentStep = 1;

// Auth
auth.onAuthStateChanged(user => {
    if (!user) window.location.href = 'login.html';
});

// --- Map ---
function initMap() {
    map = L.map('map').setView([lat, lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    marker = L.marker([lat, lng], { draggable: true }).addTo(map);

    map.on('click', function(e) {
        lat = e.latlng.lat;
        lng = e.latlng.lng;
        marker.setLatLng(e.latlng);
        updateLocationText();
    });

    marker.on('dragend', function(e) {
        const pos = e.target.getLatLng();
        lat = pos.lat;
        lng = pos.lng;
        updateLocationText();
    });

    // Geolocation
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
            map.setView([lat, lng], 15);
            marker.setLatLng([lat, lng]);
            updateLocationText();
        }, () => {
            updateLocationText();
        });
    } else {
        updateLocationText();
    }
}

async function updateLocationText() {
    const el = document.getElementById('loc-text');
    el.textContent = `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;

    // Reverse geocoding
    try {
        const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`);
        const data = await resp.json();
        if (data.display_name) {
            el.textContent = data.display_name.split(',').slice(0, 3).join(',');
        }
    } catch(e) {
        // Keep coordinates
    }
}

// --- Steps ---
function nextStep(step) {
    // Validate before going forward
    if (step === 2 && currentStep === 1) {
        // Map always valid
    }
    if (step === 3 && currentStep === 2) {
        if (!colTipo) { showToast('Selecione o tipo de pneu', 'error'); return; }
        const qtd = document.getElementById('col-qtd').value;
        if (!qtd || qtd < 1) { showToast('Informe a quantidade', 'error'); return; }
        buildSummary();
    }

    currentStep = step;
    document.querySelectorAll('.step-content').forEach(s => s.classList.remove('active'));
    document.getElementById('step-' + step).classList.add('active');

    // Progress
    document.getElementById('progress-fill').style.width = (step * 33.33) + '%';

    // Labels
    document.querySelectorAll('.step-label').forEach((l, i) => {
        l.classList.remove('active', 'done');
        if (i + 1 === step) l.classList.add('active');
        else if (i + 1 < step) l.classList.add('done');
    });

    // Fix map rendering on step 1
    if (step === 1 && map) setTimeout(() => map.invalidateSize(), 200);
}

function buildSummary() {
    const qtd = document.getElementById('col-qtd').value;
    const peso = document.getElementById('col-peso').value;
    const obs = document.getElementById('col-obs').value;
    const locText = document.getElementById('loc-text').textContent;
    const urgLabels = { baixa: '&#128994; Baixa', normal: '&#128992; Normal', alta: '&#128308; Alta' };

    document.getElementById('summary').innerHTML = `
        <div class="sum-row"><span class="sum-label">Local</span><span class="sum-value">${locText}</span></div>
        <div class="sum-row"><span class="sum-label">Tipo de Pneu</span><span class="sum-value">${colTipo}</span></div>
        <div class="sum-row"><span class="sum-label">Quantidade</span><span class="sum-value">${qtd} pneus</span></div>
        ${peso ? `<div class="sum-row"><span class="sum-label">Peso Estimado</span><span class="sum-value">${peso} kg</span></div>` : ''}
        <div class="sum-row"><span class="sum-label">Urgencia</span><span class="sum-value">${urgLabels[colUrg] || 'Normal'}</span></div>
        ${obs ? `<div class="sum-row"><span class="sum-label">Observacoes</span><span class="sum-value">${obs}</span></div>` : ''}
    `;
}

// --- Selectors ---
function selTipo(el, tipo) {
    document.querySelectorAll('.tipo-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    colTipo = tipo;
}

function selUrg(el, nivel, cls) {
    document.querySelectorAll('.urg-chip').forEach(c => c.classList.remove('active-low', 'active-med', 'active-high'));
    el.classList.add('active-' + cls);
    colUrg = nivel;
}

// --- Criar Coleta ---
async function criarColeta() {
    const user = auth.currentUser;
    const qtd = document.getElementById('col-qtd').value;
    const peso = document.getElementById('col-peso').value;
    const obs = document.getElementById('col-obs').value;
    const btn = document.querySelector('.btn-submit');

    setLoading(btn, true);
    const codigo = Math.floor(1000 + Math.random() * 9000);

    try {
        await db.collection('coletas').add({
            uid: user.uid,
            nomeUsuario: user.displayName || 'Usuario',
            quantidade: Number(qtd),
            pesoEstimado: peso ? Number(peso) : null,
            tipoPneu: colTipo,
            lat: lat,
            lng: lng,
            urgencia: colUrg,
            observacoes: obs || '',
            codigo: codigo,
            status: 'Pendente',
            data: new Date()
        });

        // Show result
        document.querySelector('.btn-row').style.display = 'none';
        document.querySelector('.card').style.display = 'none';
        document.getElementById('result-card').style.display = 'block';
        document.getElementById('result-codigo').textContent = codigo;
        showToast('Coleta criada com sucesso!');

    } catch (e) {
        console.error(e);
        showToast('Erro ao salvar coleta', 'error');
        setLoading(btn, false);
    }
}

function voltar() { window.location.href = 'dashboard.html'; }

// Init
document.addEventListener('DOMContentLoaded', initMap);
