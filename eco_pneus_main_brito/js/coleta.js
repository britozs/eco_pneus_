// ============================================================
// ECO PNEUS - Coleta com Mapa
// ============================================================

let map, marker;
let lat = -22.90, lng = -47.06;

// Protecao
auth.onAuthStateChanged(user => {
    if (!user) window.location.href = 'login.html';
});

// Inicializar mapa
function initMap() {
    map = L.map('map').setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    marker = L.marker([lat, lng], { draggable: true }).addTo(map);

    // Click no mapa
    map.on('click', function(e) {
        lat = e.latlng.lat;
        lng = e.latlng.lng;
        marker.setLatLng(e.latlng);
    });

    // Drag do marker
    marker.on('dragend', function(e) {
        const pos = e.target.getLatLng();
        lat = pos.lat;
        lng = pos.lng;
    });

    // Tentar pegar localizacao do usuario
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
            map.setView([lat, lng], 15);
            marker.setLatLng([lat, lng]);
        });
    }
}

// Gerar codigo
function gerarCodigo() {
    return Math.floor(1000 + Math.random() * 9000);
}

// Criar coleta
async function criarColeta() {
    const user = auth.currentUser;
    const quantidade = document.getElementById('qtd').value;
    const btn = document.querySelector('.btn-submit');

    if (!quantidade || quantidade < 1) {
        showToast('Informe a quantidade de pneus', 'error');
        return;
    }

    setLoading(btn, true);

    const codigo = gerarCodigo();

    try {
        await db.collection('coletas').add({
            uid: user.uid,
            quantidade: Number(quantidade),
            lat: lat,
            lng: lng,
            codigo: codigo,
            status: 'Pendente',
            data: new Date()
        });

        // Mostrar codigo
        const result = document.getElementById('codigo-result');
        result.style.display = 'block';
        document.getElementById('codigo-value').textContent = codigo;

        showToast('Coleta criada com sucesso!');
        setLoading(btn, false);

    } catch (e) {
        console.error(e);
        showToast('Erro ao salvar coleta', 'error');
        setLoading(btn, false);
    }
}

// Voltar
function voltar() {
    window.location.href = 'dashboard.html';
}

// Init
document.addEventListener('DOMContentLoaded', initMap);
