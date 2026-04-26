// ============================================================
// ECO PNEUS - Dashboard
// ============================================================

let currentUser = null;

// --- Auth ---
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    currentUser = user;
    document.getElementById('user-name').textContent = user.displayName || 'Usuario';
    nav('dashboard');
});

// --- Navigation ---
function nav(aba) {
    const content = document.getElementById('app-content');

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`[data-nav="${aba}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    if (aba === 'dashboard') renderDashboard(content);
    else if (aba === 'registrar') renderRegistrar(content);
    else if (aba === 'listar') renderListar(content);
    else if (aba === 'perfil') window.location.href = 'perfil.html';

    lucide.createIcons();
}

// --- Dashboard ---
async function renderDashboard(content) {
    content.innerHTML = `
        <div class="stats-row fade-up">
            <div class="stat-card">
                <div class="stat-icon green">&#9851;</div>
                <span class="value" id="total-pneus">--</span>
                <span class="label">Pneus</span>
            </div>
            <div class="stat-card">
                <div class="stat-icon blue">&#128230;</div>
                <span class="value" id="total-coletas">--</span>
                <span class="label">Coletas</span>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange">&#9203;</div>
                <span class="value" id="total-pendentes">--</span>
                <span class="label">Pendentes</span>
            </div>
        </div>

        <h3 class="section-title">Acoes rapidas</h3>
        <div class="quick-actions fade-up">
            <div class="action-card" onclick="nav('registrar')">
                <div class="action-icon" style="background:#ecfdf5;color:var(--primary);">&#10133;</div>
                <h3>Nova Coleta</h3>
                <p>Registrar pneus</p>
            </div>
            <div class="action-card" onclick="window.location.href='coleta.html'">
                <div class="action-icon" style="background:#eff6ff;color:#2563eb;">&#128205;</div>
                <h3>Coleta com Mapa</h3>
                <p>Escolher local</p>
            </div>
        </div>

        <h3 class="section-title">Coletas recentes</h3>
        <div id="recent-list" class="fade-up">
            <div class="empty-state">
                <div class="empty-icon">&#128230;</div>
                <p>Carregando...</p>
            </div>
        </div>
    `;

    await carregarDados();
}

async function carregarDados() {
    if (!currentUser) return;

    try {
        const snapshot = await db.collection('coletas')
            .where('uid', '==', currentUser.uid)
            .orderBy('data', 'desc')
            .limit(10)
            .get();

        let totalPneus = 0;
        let totalPendentes = 0;
        let html = '';

        if (snapshot.empty) {
            html = `
                <div class="empty-state">
                    <div class="empty-icon">&#128230;</div>
                    <h3>Nenhuma coleta ainda</h3>
                    <p>Registre sua primeira coleta!</p>
                </div>
            `;
        } else {
            html = '<div class="coleta-list">';
            snapshot.forEach(doc => {
                const c = doc.data();
                totalPneus += Number(c.quantidade || 0);
                if (c.status === 'Pendente') totalPendentes++;

                const data = c.data && c.data.seconds
                    ? new Date(c.data.seconds * 1000).toLocaleDateString('pt-BR')
                    : '--';

                const statusClass = c.status === 'Pendente' ? 'pendente' : 'concluida';

                html += `
                    <div class="coleta-item">
                        <div class="coleta-icon">&#9851;</div>
                        <div class="coleta-info">
                            <strong>${c.quantidade} pneus</strong>
                            <span>${c.endereco || 'Loc: ' + (c.lat ? c.lat.toFixed(2) + ', ' + c.lng.toFixed(2) : '--')} &bull; ${data}</span>
                        </div>
                        <span class="coleta-status ${statusClass}">${c.status}</span>
                    </div>
                `;
            });
            html += '</div>';
        }

        document.getElementById('total-pneus').textContent = totalPneus;
        document.getElementById('total-coletas').textContent = snapshot.size;
        document.getElementById('total-pendentes').textContent = totalPendentes;
        document.getElementById('recent-list').innerHTML = html;

    } catch (e) {
        console.error(e);
        document.getElementById('recent-list').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">&#9888;</div>
                <p>Erro ao carregar coletas</p>
            </div>
        `;
    }
}

// --- Registrar ---
function renderRegistrar(content) {
    content.innerHTML = `
        <div class="form-container fade-up">
            <h2>&#10133; Registrar Coleta</h2>

            <input type="number" id="quantidade" placeholder="Quantidade de pneus" min="1">
            <input type="text" id="endereco" placeholder="Endereco da coleta">

            <select id="tipo-pneu">
                <option value="">Tipo de pneu</option>
                <option value="Passeio">Passeio</option>
                <option value="Caminhao">Caminhao</option>
                <option value="Moto">Moto</option>
                <option value="Outro">Outro</option>
            </select>

            <button class="btn-confirm" onclick="registrarColeta()">
                Confirmar Coleta
            </button>
        </div>
    `;
}

async function registrarColeta() {
    const quantidade = document.getElementById('quantidade').value;
    const endereco = document.getElementById('endereco').value;
    const tipoPneu = document.getElementById('tipo-pneu').value;
    const btn = document.querySelector('.btn-confirm');

    if (!quantidade || !endereco) {
        showToast('Preencha quantidade e endereco', 'error');
        return;
    }

    setLoading(btn, true);

    try {
        await db.collection('coletas').add({
            uid: currentUser.uid,
            quantidade: Number(quantidade),
            endereco: endereco,
            tipoPneu: tipoPneu || 'Passeio',
            status: 'Pendente',
            data: new Date()
        });

        showToast('Coleta registrada com sucesso!');
        setTimeout(() => nav('listar'), 500);

    } catch (e) {
        console.error(e);
        showToast('Erro ao registrar coleta', 'error');
        setLoading(btn, false);
    }
}

// --- Listar ---
async function renderListar(content) {
    content.innerHTML = `
        <div class="fade-up">
            <h3 class="section-title" style="margin-top:8px;">Todas as Coletas</h3>
            <div id="all-list">
                <div class="empty-state">
                    <div class="empty-icon">&#128230;</div>
                    <p>Carregando...</p>
                </div>
            </div>
        </div>
    `;

    if (!currentUser) return;

    try {
        const snapshot = await db.collection('coletas')
            .where('uid', '==', currentUser.uid)
            .orderBy('data', 'desc')
            .get();

        let html = '';

        if (snapshot.empty) {
            html = `
                <div class="empty-state">
                    <div class="empty-icon">&#128230;</div>
                    <h3>Nenhuma coleta registrada</h3>
                    <p>Comece registrando uma coleta!</p>
                </div>
            `;
        } else {
            html = '<div class="coleta-list">';
            snapshot.forEach(doc => {
                const c = doc.data();
                const data = c.data && c.data.seconds
                    ? new Date(c.data.seconds * 1000).toLocaleDateString('pt-BR')
                    : '--';
                const statusClass = c.status === 'Pendente' ? 'pendente' : 'concluida';

                html += `
                    <div class="coleta-item">
                        <div class="coleta-icon">&#9851;</div>
                        <div class="coleta-info">
                            <strong>${c.quantidade} pneus ${c.tipoPneu ? '(' + c.tipoPneu + ')' : ''}</strong>
                            <span>${c.endereco || 'Loc: ' + (c.lat ? c.lat.toFixed(2) + ', ' + c.lng.toFixed(2) : '--')} &bull; ${data}${c.codigo ? ' &bull; Cod: ' + c.codigo : ''}</span>
                        </div>
                        <span class="coleta-status ${statusClass}">${c.status}</span>
                    </div>
                `;
            });
            html += '</div>';
        }

        document.getElementById('all-list').innerHTML = html;

    } catch (e) {
        console.error(e);
        document.getElementById('all-list').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">&#9888;</div>
                <p>Erro ao carregar. Verifique se o indice do Firestore foi criado.</p>
            </div>
        `;
    }
}

// --- Logout ---
function logout() {
    auth.signOut().then(() => {
        window.location.href = 'login.html';
    });
}

// Init icons
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
});
