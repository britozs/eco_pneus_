// ============================================================
// ECO PNEUS - DASHBOARD
// Completo, corrigido e melhorado
// ============================================================

let currentUser = null;
let currentUserData = null;
let avaliarEmpresaId = '';
let avaliarEstrelas = 0;

// ============================================================
// AUTH
// ============================================================
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    currentUser = user;
    setHeaderUser(user);

    try {
        const doc = await db.collection('usuarios').doc(user.uid).get();
        if (doc.exists) {
            currentUserData = doc.data();
        }
    } catch (error) {
        console.log('Não foi possível carregar dados extras do usuário.');
    }

    await renderDashboard();
});

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    replaceIcons();
    configurarFechamentoModais();
});

// ============================================================
// HEADER
// ============================================================
function setHeaderUser(user) {
    const nomeCompleto = user?.displayName || 'Usuário';

    const elName = document.getElementById('user-name');
    const elShort = document.getElementById('user-short-name');
    const elAvatar = document.getElementById('user-avatar');
    const elDay = document.getElementById('header-day');

    if (elName) elName.textContent = nomeCompleto;
    if (elShort) elShort.textContent = getFirstName(nomeCompleto);
    if (elAvatar) elAvatar.textContent = getInitials(nomeCompleto);
    if (elDay) elDay.textContent = `Painel • ${getDiaSemana()}`;
}

// ============================================================
// NAVEGAÇÃO
// ============================================================
function goToPage(page) {
    window.location.href = page;
}

// ============================================================
// HELPERS
// ============================================================
function getInitials(nome = '') {
    const partes = String(nome).trim().split(' ').filter(Boolean);
    if (!partes.length) return 'US';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
}

function getFirstName(nome = '') {
    return String(nome).trim().split(' ')[0] || 'Usuário';
}

function getDiaSemana() {
    const dias = [
        'Domingo',
        'Segunda-feira',
        'Terça-feira',
        'Quarta-feira',
        'Quinta-feira',
        'Sexta-feira',
        'Sábado'
    ];
    return dias[new Date().getDay()];
}

function formatNumberBR(value) {
    return Number(value || 0).toLocaleString('pt-BR');
}

function formatDecimalBR(value, casas = 1) {
    return Number(value || 0).toLocaleString('pt-BR', {
        minimumFractionDigits: casas,
        maximumFractionDigits: casas
    });
}

function formatDateBR(dataObj) {
    if (!dataObj) return '--';

    try {
        const dt = dataObj.seconds ? new Date(dataObj.seconds * 1000) : new Date(dataObj);
        return dt.toLocaleDateString('pt-BR');
    } catch {
        return '--';
    }
}

function formatDateTimeShort(dataObj) {
    if (!dataObj) return '--';

    try {
        const dt = dataObj.seconds ? new Date(dataObj.seconds * 1000) : new Date(dataObj);
        return dt.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return '--';
    }
}

function isHoje(dataObj) {
    if (!dataObj) return false;

    const dt = dataObj.seconds ? new Date(dataObj.seconds * 1000) : new Date(dataObj);
    const now = new Date();

    return dt.getDate() === now.getDate() &&
           dt.getMonth() === now.getMonth() &&
           dt.getFullYear() === now.getFullYear();
}

function isEstaSemana(dataObj) {
    if (!dataObj) return false;

    const dt = dataObj.seconds ? new Date(dataObj.seconds * 1000) : new Date(dataObj);
    const now = new Date();
    const diff = now - dt;
    const dias = diff / (1000 * 60 * 60 * 24);

    return dias <= 7;
}

function getStatusClass(status) {
    if (status === 'Pendente') return 'pendente';
    if (status === 'Cancelada') return 'cancelada';
    return 'concluida';
}

function getUrgenciaLabel(urgencia) {
    if (urgencia === 'alta') return 'Alta';
    if (urgencia === 'baixa') return 'Baixa';
    return 'Normal';
}

function calcCO2ByPneus(totalPneus) {
    return totalPneus * 0.0027;
}

function calcAguaByPneus(totalPneus) {
    return totalPneus * 14.7;
}

function calcEnergiaByPneus(totalPneus) {
    return totalPneus * 0.0049;
}

function calcAterroByPneus(totalPneus) {
    return totalPneus * 0.00075;
}

function escapeHtml(texto = '') {
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function replaceIcons() {
    if (window.lucide) {
        lucide.createIcons();
    }
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function setHTML(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value;
}

function setWidth(id, value) {
    const el = document.getElementById(id);
    if (el) el.style.width = value;
}

// ============================================================
// TOAST
// ============================================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-8px)';
        toast.style.transition = 'all 0.25s ease';
    }, 2800);

    setTimeout(() => {
        toast.remove();
    }, 3200);
}

function setLoading(button, isLoading, loadingText = 'Carregando...') {
    if (!button) return;

    if (isLoading) {
        button.dataset.originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = loadingText;
    } else {
        button.disabled = false;
        if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
        }
    }
}

// ============================================================
// RENDER DASHBOARD
// ============================================================
async function renderDashboard() {
    const content = document.getElementById('app-content');
    if (!content) return;

    content.innerHTML = `
        <section class="stats-row fade-up">
            <div class="stat-card">
                <div class="stat-top">
                    <div class="stat-icon"><i data-lucide="recycle"></i></div>
                    <span class="stat-chip" id="chip-total-pneus">+0%</span>
                </div>
                <span class="value" id="total-pneus">--</span>
                <span class="label">Total reciclado</span>
                <span class="sub">vs. mês anterior</span>
                <div class="progress-thin"><span id="progress-pneus" style="width:72%"></span></div>
            </div>

            <div class="stat-card">
                <div class="stat-top">
                    <div class="stat-icon"><i data-lucide="leaf"></i></div>
                    <span class="stat-chip" id="chip-co2">+0%</span>
                </div>
                <span class="value" id="co2-evitado">--</span>
                <span class="label">CO₂ evitado</span>
                <span class="sub">estimativa ambiental</span>
                <div class="progress-thin"><span id="progress-co2" style="width:68%"></span></div>
            </div>

            <div class="stat-card">
                <div class="stat-top">
                    <div class="stat-icon"><i data-lucide="truck"></i></div>
                    <span class="stat-chip">Tempo real</span>
                </div>
                <span class="value" id="frota-rota">--</span>
                <span class="label">Coletas em rota</span>
                <span class="sub">status operacional</span>
                <div class="progress-thin"><span id="progress-rota" style="width:61%"></span></div>
            </div>

            <div class="stat-card">
                <div class="stat-top">
                    <div class="stat-icon"><i data-lucide="building-2"></i></div>
                    <span class="stat-chip">Rede ativa</span>
                </div>
                <span class="value" id="parceiros-ativos">--</span>
                <span class="label">Parceiros ativos</span>
                <span class="sub">empresas cadastradas</span>
                <div class="progress-thin"><span id="progress-parceiros" style="width:77%"></span></div>
            </div>
        </section>

        <section class="fade-up">
            <div class="section-heading">
                <div class="section-heading-left">
                    <span class="section-eyebrow">Resumo do mês</span>
                    <h3 class="section-title">Visão operacional</h3>
                </div>
                <div class="section-meta" id="last-update">Atualizado agora</div>
            </div>

            <div class="ops-grid">
                <div class="ops-card tint-1">
                    <div class="ops-top">
                        <div class="ops-icon"><i data-lucide="recycle"></i></div>
                        <span class="ops-link">detalhes</span>
                    </div>
                    <div class="ops-value" id="mes-pneus">--</div>
                    <span class="ops-label">Pneus do mês</span>
                    <div class="ops-progress"><span id="ops-bar-pneus" style="width:78%"></span></div>
                    <div class="ops-bottom">
                        <span class="ops-meta" id="ops-meta-pneus">+0% vs. mês anterior</span>
                        <span class="ops-meta" id="ops-right-pneus">0%</span>
                    </div>
                </div>

                <div class="ops-card tint-2">
                    <div class="ops-top">
                        <div class="ops-icon"><i data-lucide="package-search"></i></div>
                        <span class="ops-link">detalhes</span>
                    </div>
                    <div class="ops-value" id="mes-coletas">--</div>
                    <span class="ops-label">Coletas</span>
                    <div class="ops-progress"><span id="ops-bar-coletas" style="width:62%"></span></div>
                    <div class="ops-bottom">
                        <span class="ops-meta" id="ops-meta-coletas">0 esta semana</span>
                        <span class="ops-meta" id="ops-right-coletas">0%</span>
                    </div>
                </div>

                <div class="ops-card tint-3">
                    <div class="ops-top">
                        <div class="ops-icon"><i data-lucide="hourglass"></i></div>
                        <span class="ops-link">detalhes</span>
                    </div>
                    <div class="ops-value" id="mes-pendentes">--</div>
                    <span class="ops-label">Pendentes</span>
                    <div class="ops-progress"><span id="ops-bar-pendentes" style="width:28%"></span></div>
                    <div class="ops-bottom">
                        <span class="ops-meta">Aguardando rota</span>
                        <span class="ops-meta" id="ops-right-pendentes">0%</span>
                    </div>
                </div>
            </div>
        </section>

        <section class="impact-section fade-up">
            <div class="impact-banner">
                <div class="impact-content">
                    <span class="impact-pill">Impacto ambiental</span>
                    <h3>Cada pneu reciclado é um passo para um planeta mais limpo.</h3>
                    <p id="impact-text">
                        Desde janeiro, sua operação destinou corretamente pneus, reduzindo passivos ambientais
                        e fortalecendo a logística reversa.
                    </p>
                    <div class="impact-badges">
                        <span>Conformidade CONAMA</span>
                        <span>ISO 14001</span>
                    </div>
                </div>
            </div>

            <div class="impact-grid">
                <div class="impact-mini icon-1">
                    <div class="mini-icon"><i data-lucide="droplets"></i></div>
                    <span class="mini-value" id="impact-agua">--</span>
                    <span class="mini-label">Água economizada</span>
                    <span class="mini-sub">equivalência ambiental estimada</span>
                </div>

                <div class="impact-mini icon-2">
                    <div class="mini-icon"><i data-lucide="zap"></i></div>
                    <span class="mini-value" id="impact-energia">--</span>
                    <span class="mini-label">Energia evitada</span>
                    <span class="mini-sub">consumo energético reduzido</span>
                </div>

                <div class="impact-mini icon-3">
                    <div class="mini-icon"><i data-lucide="chart-no-axes-column"></i></div>
                    <span class="mini-value" id="impact-aterro">--</span>
                    <span class="mini-label">Aterros poupados</span>
                    <span class="mini-sub">redução de passivo ambiental</span>
                </div>

                <div class="impact-mini icon-4">
                    <div class="mini-icon"><i data-lucide="shield-check"></i></div>
                    <span class="mini-value">CONAMA 416</span>
                    <span class="mini-label">Certificação</span>
                    <span class="mini-sub">conformidade ativa</span>
                </div>
            </div>
        </section>

        <section class="fade-up">
            <div class="section-heading">
                <div class="section-heading-left">
                    <span class="section-eyebrow">Atalhos</span>
                    <h3 class="section-title">Ações rápidas</h3>
                </div>
                <div class="section-link">Ver todos</div>
            </div>

            <div class="quick-actions">
                <div class="action-card" onclick="goToPage('registrar.html')">
                    <div class="action-top">
                        <div class="action-icon green"><i data-lucide="plus"></i></div>
                        <span class="action-badge">Rápido</span>
                    </div>
                    <h3>Nova Coleta</h3>
                    <p>Registrar pneus</p>
                    <span class="action-link">Abrir ↗</span>
                </div>

                <div class="action-card" onclick="goToPage('coletac.html')">
                    <div class="action-top">
                        <div class="action-icon pink"><i data-lucide="map-pin"></i></div>
                        <span class="action-badge">Geo</span>
                    </div>
                    <h3>Coleta com Mapa</h3>
                    <p>Escolher local no mapa</p>
                    <span class="action-link">Abrir ↗</span>
                </div>

                <div class="action-card" onclick="goToPage('empresas.html')">
                    <div class="action-top">
                        <div class="action-icon blue"><i data-lucide="building-2"></i></div>
                        <span class="action-badge">Rede</span>
                    </div>
                    <h3>Empresas</h3>
                    <p>Ver recicladoras</p>
                    <span class="action-link">Abrir ↗</span>
                </div>

                <div class="action-card" onclick="goToPage('coleta.html')">
                    <div class="action-top">
                        <div class="action-icon purple"><i data-lucide="clipboard-list"></i></div>
                        <span class="action-badge">Log</span>
                    </div>
                    <h3>Minhas Coletas</h3>
                    <p>Histórico completo</p>
                    <span class="action-link">Abrir ↗</span>
                </div>
            </div>
        </section>

        <section class="dashboard-split fade-up">
            <div>
                <div class="section-heading">
                    <div class="section-heading-left">
                        <span class="section-eyebrow">Atividade</span>
                        <h3 class="section-title">Coletas recentes</h3>
                    </div>
                    <div class="section-link" onclick="goToPage('coleta.html')">Ver tudo</div>
                </div>

                <div id="recent-list">
                    <div class="empty-state">
                        <div class="empty-icon">📦</div>
                        <p>Carregando...</p>
                    </div>
                </div>
            </div>

            <div>
                <div class="section-heading">
                    <div class="section-heading-left">
                        <span class="section-eyebrow">Agenda</span>
                        <h3 class="section-title">Próximos passos</h3>
                    </div>
                </div>

                <div id="upcoming-box">
                    <div class="upcoming-card">
                        <div class="upcoming-item">
                            <div class="upcoming-icon blue"><i data-lucide="calendar-days"></i></div>
                            <div class="upcoming-text">
                                <strong>Carregando...</strong>
                                <span>Atualizando agenda</span>
                            </div>
                            <div class="upcoming-meta">--</div>
                        </div>
                    </div>
                </div>

                <div class="side-summary-card" id="goal-card">
                    <h4>Sua meta mensal</h4>
                    <p id="goal-subtitle">Acompanhando desempenho da operação</p>
                    <div class="side-summary-progress"><span id="goal-progress" style="width:0%"></span></div>
                    <div class="side-summary-bottom">
                        <span id="goal-left">0% concluído</span>
                        <span id="goal-right">0 pneus restantes</span>
                    </div>

                    <div class="side-summary-grid">
                        <div class="side-summary-mini">
                            <span>Pendentes</span>
                            <strong id="goal-pendentes">0</strong>
                        </div>
                        <div class="side-summary-mini">
                            <span>Concluídas</span>
                            <strong id="goal-concluidas">0</strong>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="fade-up">
            <div class="section-heading">
                <div class="section-heading-left">
                    <span class="section-eyebrow">Rede</span>
                    <h3 class="section-title">Empresas em destaque</h3>
                    <div class="section-subtitle">Recicladoras melhor avaliadas</div>
                </div>
            </div>
            <div id="dash-empresas">
                <div class="empty-state">
                    <div class="empty-icon">🏢</div>
                    <p>Carregando...</p>
                </div>
            </div>
        </section>
    `;

    replaceIcons();
    await carregarDadosDashboard();
    await carregarEmpresasDestaque();
    replaceIcons();
}

// ============================================================
// CARREGAR DADOS DO DASHBOARD
// ============================================================
async function carregarDadosDashboard() {
    if (!currentUser) return;

    try {
        const recentesSnap = await db.collection('coletas')
            .where('uid', '==', currentUser.uid)
            .orderBy('data', 'desc')
            .limit(8)
            .get();

        const todasSnap = await db.collection('coletas')
            .where('uid', '==', currentUser.uid)
            .get();

        const recentes = [];
        recentesSnap.forEach(doc => recentes.push({ id: doc.id, ...doc.data() }));

        const todas = [];
        todasSnap.forEach(doc => todas.push({ id: doc.id, ...doc.data() }));

        const totalPneus = todas.reduce((acc, c) => acc + Number(c.quantidade || 0), 0);
        const totalColetas = todas.length;
        const totalPendentes = todas.filter(c => c.status === 'Pendente').length;
        const totalConcluidas = todas.filter(c => c.status === 'Concluida').length;
        const totalEmRota = todas.filter(c => c.status === 'Pendente').length;

        const coletasMes = todas.filter(c => {
            if (!c.data) return false;
            const dt = c.data.seconds ? new Date(c.data.seconds * 1000) : new Date(c.data);
            const now = new Date();
            return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
        });

        const pneusMes = coletasMes.reduce((acc, c) => acc + Number(c.quantidade || 0), 0);
        const pendentesMes = coletasMes.filter(c => c.status === 'Pendente').length;
        const coletasSemana = todas.filter(c => isEstaSemana(c.data)).length;

        const metaMensal = 1600;
        const percentualMeta = Math.min((pneusMes / metaMensal) * 100, 100);
        const restanteMeta = Math.max(metaMensal - pneusMes, 0);

        const co2 = calcCO2ByPneus(totalPneus);
        const agua = calcAguaByPneus(totalPneus);
        const energia = calcEnergiaByPneus(totalPneus);
        const aterro = calcAterroByPneus(totalPneus);

        setText('total-pneus', `${formatNumberBR(totalPneus)} pneus`);
        setText('co2-evitado', `${formatDecimalBR(co2)} t`);
        setText('frota-rota', formatNumberBR(totalEmRota));
        setText('parceiros-ativos', '--');

        setText('chip-total-pneus', `+${Math.min(totalColetas * 4, 28)}%`);
        setText('chip-co2', `+${Math.min(Math.round(co2 * 3), 49)}%`);

        setText('hero-impact', `${formatNumberBR(totalPneus)} pneus processados`);

        setText('mes-pneus', formatNumberBR(pneusMes));
        setText('mes-coletas', formatNumberBR(coletasMes.length));
        setText('mes-pendentes', formatNumberBR(pendentesMes));

        setText('ops-meta-pneus', `+${Math.min(Math.round((pneusMes || 0) / 10), 126)}% vs. mês anterior`);
        setText('ops-meta-coletas', `${coletasSemana} esta semana`);
        setText('ops-right-pneus', `${Math.round(Math.min((pneusMes / metaMensal) * 100, 100))}%`);
        setText('ops-right-coletas', `${Math.round(Math.min((coletasMes.length / 135) * 100, 100))}%`);
        setText(
            'ops-right-pendentes',
            `${Math.round(Math.min((pendentesMes / Math.max(coletasMes.length || 1, 1)) * 100, 100))}%`
        );

        setWidth('ops-bar-pneus', `${Math.max(8, Math.min((pneusMes / metaMensal) * 100, 100))}%`);
        setWidth('ops-bar-coletas', `${Math.max(8, Math.min((coletasMes.length / 135) * 100, 100))}%`);
        setWidth(
            'ops-bar-pendentes',
            `${Math.max(8, Math.min((pendentesMes / Math.max(coletasMes.length || 1, 1)) * 100, 100))}%`
        );

        setHTML(
            'impact-text',
            `Desde janeiro, sua operação destinou corretamente <strong>${formatNumberBR(totalPneus)} pneus</strong>, reduzindo passivos ambientais e fortalecendo a logística reversa.`
        );

        setText(
            'impact-agua',
            agua >= 1000 ? `${formatDecimalBR(agua / 1000)} mil L` : `${formatNumberBR(Math.round(agua))} L`
        );

        setText(
            'impact-energia',
            energia >= 1 ? `${formatDecimalBR(energia)} MWh` : `${formatDecimalBR(energia * 1000, 0)} kWh`
        );

        setText('impact-aterro', `${formatDecimalBR(aterro)} t`);

        setWidth('goal-progress', `${Math.max(6, percentualMeta)}%`);
        setText('goal-left', `${Math.round(percentualMeta)}% concluído`);
        setText('goal-right', `${formatNumberBR(restanteMeta)} pneus restantes`);
        setText('goal-subtitle', `${formatNumberBR(metaMensal)} pneus reciclados na meta mensal`);
        setText('goal-pendentes', formatNumberBR(totalPendentes));
        setText('goal-concluidas', formatNumberBR(totalConcluidas));
        setText('last-update', 'Atualizado agora');

        preencherRealtime(recentes, totalPendentes);
        setHTML('recent-list', renderRecentesDashboard(recentes));
        setHTML('upcoming-box', renderAgendaDashboard(recentes, totalPendentes));

        try {
            const empresasSnap = await db.collection('usuarios').where('tipo', '==', 'empresa').get();
            setText('parceiros-ativos', formatNumberBR(empresasSnap.size));
        } catch {
            setText('parceiros-ativos', '--');
        }

    } catch (error) {
        console.error(error);
        setHTML(
            'recent-list',
            `
            <div class="empty-state">
                <div class="empty-icon">⚠</div>
                <h3>Erro ao carregar</h3>
                <p>Não foi possível carregar as coletas.</p>
            </div>
            `
        );
    }

    replaceIcons();
}

function preencherRealtime(recentes, totalPendentes) {
    const item1 = recentes[0];
    const item2 = recentes[1];
    const item3 = recentes.find(c => c.status === 'Pendente') || recentes[2];

    setText(
        'rt-1-title',
        item1 ? `${Number(item1.quantidade || 0)} pneus registrados` : 'Operação sincronizada'
    );

    setText(
        'rt-1-sub',
        item1 ? `${item1.endereco || 'Local informado'} • ${formatDateTimeShort(item1.data)}` : 'Sem eventos recentes'
    );

    setText(
        'rt-2-title',
        item2 ? `Coleta ${item2.status || 'atualizada'}` : 'Coletas em atualização'
    );

    setText(
        'rt-2-sub',
        item2 ? `${item2.tipoPneu || 'Pneus'} • ${formatDateTimeShort(item2.data)}` : 'Monitorando novas movimentações'
    );

    setText(
        'rt-3-title',
        totalPendentes > 0 ? `${totalPendentes} solicitações pendentes` : 'Nenhuma pendência crítica'
    );

    setText(
        'rt-3-sub',
        item3 ? `${item3.responsavel || 'Equipe'} • status operacional` : 'Agenda estável'
    );
}

function renderRecentesDashboard(lista) {
    if (!lista || lista.length === 0) {
        return `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h3>Nenhuma coleta ainda</h3>
                <p>Registre sua primeira coleta.</p>
            </div>
        `;
    }

    let html = `<div class="recent-list-card">`;

    lista.slice(0, 4).forEach(c => {
        const statusClass = getStatusClass(c.status);
        const endereco = c.endereco || (c.lat ? `Lat: ${Number(c.lat).toFixed(3)}` : '--');
        const whenText = c.data
            ? (isHoje(c.data) ? `Hoje • ${formatDateTimeShort(c.data).split(' ')[1] || ''}` : formatDateTimeShort(c.data))
            : '--';

        html += `
            <div class="recent-item">
                <div class="recent-item-icon">
                    <i data-lucide="recycle"></i>
                </div>

                <div class="recent-item-main">
                    <div class="recent-item-title">
                        ${escapeHtml(c.responsavel || c.nomeUsuario || 'Coleta registrada')}
                        ${c.codigo ? ` <span style="color:#8ea098;font-size:0.74rem;font-weight:700;">#EC-${escapeHtml(String(c.codigo))}</span>` : ''}
                    </div>

                    <div class="recent-item-meta">
                        <span><i data-lucide="clock-3"></i> ${escapeHtml(whenText)}</span>
                        <span><i data-lucide="map-pin"></i> ${escapeHtml(endereco)}</span>
                        <span><i data-lucide="alert-circle"></i> ${escapeHtml(getUrgenciaLabel(c.urgencia))}</span>
                    </div>
                </div>

                <div class="recent-item-side">
                    <strong>${formatNumberBR(c.quantidade || 0)}</strong>
                    <span>pneus</span>
                    <div class="status-pill ${statusClass}">${escapeHtml(c.status || 'Pendente')}</div>
                </div>

                <div class="recent-arrow">
                    <i data-lucide="chevron-right"></i>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    return html;
}

function renderAgendaDashboard(lista, totalPendentes) {
    const ultimaPendente = lista.find(c => c.status === 'Pendente');
    const ultimaConcluida = lista.find(c => c.status === 'Concluida');
    const ultimaQualquer = lista[0];

    return `
        <div class="upcoming-card">
            <div class="upcoming-item">
                <div class="upcoming-icon blue"><i data-lucide="calendar-days"></i></div>
                <div class="upcoming-text">
                    <strong>${ultimaPendente ? 'Coleta agendada' : 'Operação monitorada'}</strong>
                    <span>${ultimaPendente ? `${Number(ultimaPendente.quantidade || 0)} pneus • ${escapeHtml(ultimaPendente.endereco || 'Endereço informado')}` : 'Sem coletas pendentes no momento'}</span>
                </div>
                <div class="upcoming-meta">${totalPendentes > 0 ? `${totalPendentes} pend.` : 'OK'}</div>
            </div>

            <div class="upcoming-item">
                <div class="upcoming-icon purple"><i data-lucide="shield"></i></div>
                <div class="upcoming-text">
                    <strong>Vistoria mensal</strong>
                    <span>Conformidade operacional em acompanhamento</span>
                </div>
                <div class="upcoming-meta">ANIP</div>
            </div>

            <div class="upcoming-item">
                <div class="upcoming-icon gold"><i data-lucide="file-text"></i></div>
                <div class="upcoming-text">
                    <strong>Relatório IBAMA</strong>
                    <span>${ultimaConcluida ? `Última conclusão em ${formatDateBR(ultimaConcluida.data)}` : 'Dados prontos para fechamento mensal'}</span>
                </div>
                <div class="upcoming-meta">${ultimaQualquer ? 'Atualizado' : 'Pendente'}</div>
            </div>
        </div>
    `;
}

// ============================================================
// EMPRESAS EM DESTAQUE
// ============================================================
async function carregarEmpresasDestaque() {
    try {
        const snap = await db.collection('usuarios')
            .where('tipo', '==', 'empresa')
            .limit(4)
            .get();

        let html = '';

        if (snap.empty) {
            html = `
                <div class="empty-state">
                    <div class="empty-icon">🏢</div>
                    <h3>Nenhuma empresa cadastrada</h3>
                    <p>As empresas cadastradas aparecerão aqui.</p>
                </div>
            `;
        } else {
            html = `<div class="empresas-grid">`;

            for (const doc of snap.docs) {
                if (currentUser && doc.id === currentUser.uid) continue;

                const empresa = doc.data();
                const rating = await calcularMedia(doc.id);
                html += renderEmpresaCard(doc.id, empresa, rating);
            }

            html += `</div>`;

            if (html === `<div class="empresas-grid"></div>`) {
                html = `
                    <div class="empty-state">
                        <div class="empty-icon">🏢</div>
                        <h3>Nenhuma empresa encontrada</h3>
                        <p>Não há empresas para exibir agora.</p>
                    </div>
                `;
            }
        }

        setHTML('dash-empresas', html);
        replaceIcons();

    } catch (error) {
        console.error(error);
        setHTML(
            'dash-empresas',
            `
            <div class="empty-state">
                <div class="empty-icon">⚠</div>
                <h3>Erro ao carregar</h3>
                <p>Não foi possível carregar as empresas.</p>
            </div>
            `
        );
    }
}

function renderEmpresaCard(id, e, rating) {
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.nome || 'E')}&background=0b6b3a&color=fff&size=100`;
    const stars = renderStars(rating.media);
    const materiais = ['Pneus', 'Borracha', 'Aço'];

    return `
        <div class="empresa-card">
            <div class="empresa-top">
                <img class="empresa-avatar" src="${avatarUrl}" alt="${escapeHtml(e.nome || 'Empresa')}">
                <div>
                    <div class="empresa-name">
                        ${escapeHtml(e.nome || 'Empresa')}
                        <span class="verified-badge">✓ Verificado</span>
                    </div>
                    <span class="empresa-tipo">Recicladora</span>
                </div>
            </div>

            <div class="empresa-stars">
                ${stars}
                <span class="rating-text">${Number(rating.media || 0).toFixed(1)} (${rating.total} avaliações)</span>
            </div>

            <div class="empresa-meta">
                <span>📍 ${escapeHtml(e.cidade || 'Campinas, SP')}</span>
                <span>📞 ${escapeHtml(e.telefone || '--')}</span>
            </div>

            <div class="empresa-tags">
                ${materiais.map(m => `<span class="empresa-tag">${m}</span>`).join('')}
            </div>

            <div class="empresa-actions">
                <button class="btn-contact" type="button" onclick="abrirContato('${id}', '${escapeJsString(e.nome || '')}', '${escapeJsString(e.email || '')}', '${escapeJsString(e.telefone || '')}', '${escapeJsString(e.cnpj || '')}')">📞 Contato</button>
                <button class="btn-whatsapp" type="button" onclick="abrirWhatsapp('${escapeJsString(e.telefone || '')}')">💬 WhatsApp</button>
                <button class="btn-rate" type="button" onclick="abrirAvaliar('${id}', '${escapeJsString(e.nome || '')}')">⭐ Avaliar</button>
            </div>

            ${
                rating.reviews.length > 0
                    ? `
                <div class="reviews-section">
                    <h4 style="font-size:0.82rem;font-weight:700;margin-top:14px;margin-bottom:8px;">Avaliações recentes</h4>
                    ${rating.reviews.slice(0, 2).map(r => `
                        <div class="review-item">
                            <div class="review-top">
                                <span class="review-author">${escapeHtml(r.nomeAvaliador || 'Usuário')}</span>
                                <span class="review-stars">${'★'.repeat(r.estrelas || 0)}</span>
                            </div>
                            ${r.comentario ? `<p class="review-text">${escapeHtml(r.comentario)}</p>` : ''}
                            <span class="review-date">${r.data && r.data.seconds ? new Date(r.data.seconds * 1000).toLocaleDateString('pt-BR') : ''}</span>
                        </div>
                    `).join('')}
                </div>
            `
                    : ''
            }
        </div>
    `;
}

function renderStars(media = 0) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<span class="star ${i <= Math.round(media) ? '' : 'empty'}">★</span>`;
    }
    return html;
}

function escapeJsString(str = '') {
    return String(str)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, ' ')
        .replace(/\r/g, ' ');
}

async function calcularMedia(empresaId) {
    try {
        const snap = await db.collection('avaliacoes')
            .where('empresaId', '==', empresaId)
            .orderBy('data', 'desc')
            .limit(10)
            .get();

        let soma = 0;
        const reviews = [];

        snap.forEach(doc => {
            const d = doc.data();
            soma += Number(d.estrelas || 0);
            reviews.push(d);
        });

        return {
            media: snap.size > 0 ? soma / snap.size : 0,
            total: snap.size,
            reviews
        };
    } catch (error) {
        return {
            media: 0,
            total: 0,
            reviews: []
        };
    }
}

// ============================================================
// CONTATO
// ============================================================
function abrirContato(id, nome, email, telefone, cnpj) {
    const modal = document.getElementById('modal-contato');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    if (!modal || !title || !body) return;

    title.textContent = `Contato - ${nome || 'Empresa'}`;

    body.innerHTML = `
        <div class="contact-info">
            <div class="contact-row">
                <div class="contact-icon">🏢</div>
                <div class="contact-text">
                    <span class="contact-label">Empresa</span>
                    <span class="contact-value">${escapeHtml(nome || 'Não informado')}</span>
                </div>
            </div>

            <div class="contact-row">
                <div class="contact-icon">✉</div>
                <div class="contact-text">
                    <span class="contact-label">E-mail</span>
                    <span class="contact-value">${escapeHtml(email || 'Não informado')}</span>
                </div>
            </div>

            <div class="contact-row">
                <div class="contact-icon">📞</div>
                <div class="contact-text">
                    <span class="contact-label">Telefone</span>
                    <span class="contact-value">${escapeHtml(telefone || 'Não informado')}</span>
                </div>
            </div>

            <div class="contact-row">
                <div class="contact-icon">📄</div>
                <div class="contact-text">
                    <span class="contact-label">CNPJ</span>
                    <span class="contact-value">${escapeHtml(cnpj || 'Não informado')}</span>
                </div>
            </div>
        </div>

        ${telefone ? `<button class="btn-confirm" type="button" style="margin-top:16px;" onclick="abrirWhatsapp('${escapeJsString(telefone)}')">💬 Enviar WhatsApp</button>` : ''}
        ${email ? `<button class="btn-secondary" type="button" onclick="window.open('mailto:${email}', '_blank')">✉ Enviar E-mail</button>` : ''}
    `;

    modal.style.display = 'flex';
}

function fecharModal() {
    const modal = document.getElementById('modal-contato');
    if (modal) modal.style.display = 'none';
}

function abrirWhatsapp(telefone) {
    const numero = String(telefone || '').replace(/\D/g, '');

    if (!numero) {
        showToast('Telefone não informado', 'error');
        return;
    }

    const numeroBR = numero.startsWith('55') ? numero : `55${numero}`;
    const mensagem = encodeURIComponent('Olá! Vi seu perfil no Eco Pneus e gostaria de saber mais sobre coleta de pneus.');

    window.open(`https://wa.me/${numeroBR}?text=${mensagem}`, '_blank');
}

// ============================================================
// AVALIAÇÃO
// ============================================================
function abrirAvaliar(empresaId, nome) {
    avaliarEmpresaId = empresaId;
    avaliarEstrelas = 0;

    const modal = document.getElementById('modal-avaliar');
    const nomeEl = document.getElementById('avaliar-nome');
    const comentario = document.getElementById('avaliar-comentario');

    if (nomeEl) nomeEl.textContent = nome || 'Empresa';
    if (comentario) comentario.value = '';

    document.querySelectorAll('.star-select').forEach(star => {
        star.classList.remove('active');
        star.onclick = function () {
            avaliarEstrelas = parseInt(this.dataset.star, 10);

            document.querySelectorAll('.star-select').forEach((s, index) => {
                s.classList.toggle('active', index < avaliarEstrelas);
            });
        };
    });

    if (modal) modal.style.display = 'flex';
}

function fecharModalAvaliar() {
    const modal = document.getElementById('modal-avaliar');
    if (modal) modal.style.display = 'none';
}

async function enviarAvaliacao() {
    if (!currentUser) {
        showToast('Usuário não autenticado', 'error');
        return;
    }

    if (!avaliarEmpresaId) {
        showToast('Empresa inválida', 'error');
        return;
    }

    if (avaliarEstrelas === 0) {
        showToast('Selecione pelo menos 1 estrela', 'error');
        return;
    }

    const comentario = document.getElementById('avaliar-comentario')?.value.trim() || '';
    const btn = document.getElementById('btn-enviar-avaliacao');

    setLoading(btn, true, 'Enviando...');

    try {
        await db.collection('avaliacoes').add({
            empresaId: avaliarEmpresaId,
            avaliadorId: currentUser.uid,
            nomeAvaliador: currentUser.displayName || 'Usuário',
            estrelas: avaliarEstrelas,
            comentario: comentario,
            data: new Date()
        });

        showToast('Avaliação enviada com sucesso!');
        fecharModalAvaliar();
        await carregarEmpresasDestaque();

    } catch (error) {
        console.error(error);
        showToast('Erro ao enviar avaliação', 'error');
    } finally {
        setLoading(btn, false);
    }
}

// ============================================================
// MODAIS
// ============================================================
function configurarFechamentoModais() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.style.display = 'none';
        }
    });
}

// ============================================================
// LOGOUT
// ============================================================
function logout() {
    auth.signOut()
        .then(() => {
            window.location.href = 'index.html';
        })
        .catch(() => {
            showToast('Erro ao sair da conta', 'error');
        });
}
