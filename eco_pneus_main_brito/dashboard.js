// ============================================================
// ECO PNEUS - Dashboard (Complete)
// ============================================================

let currentUser = null;
let currentUserData = null;
let selectedTipoPneu = '';
let selectedUrgencia = 'normal';
let avaliarEmpresaId = '';
let avaliarEstrelas = 0;

// --- Auth ---
auth.onAuthStateChanged(async user => {
    if (!user) { window.location.href = 'login.html'; return; }
    currentUser = user;
    document.getElementById('user-name').textContent = user.displayName || 'Usuario';

    // Buscar dados do usuario
    try {
        const doc = await db.collection('usuarios').doc(user.uid).get();
        if (doc.exists) currentUserData = doc.data();
    } catch(e) { console.log('Sem dados extras'); }

    nav('dashboard');
});

// --- Navigation ---
function nav(aba) {
    const content = document.getElementById('app-content');
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`[data-nav="${aba}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    if (aba === 'dashboard') renderDashboard(content);
    else if (aba === 'registrar') renderRegistrar(content);
    else if (aba === 'empresas') renderEmpresas(content);
    else if (aba === 'listar') renderListar(content);
    else if (aba === 'perfil') window.location.href = 'perfil.html';

    setTimeout(() => lucide.createIcons(), 100);
}

// ============================================================
// DASHBOARD
// ============================================================
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
                <p>Escolher local no mapa</p>
            </div>
            <div class="action-card" onclick="nav('empresas')">
                <div class="action-icon" style="background:#fef3c7;color:#d97706;">&#127970;</div>
                <h3>Empresas</h3>
                <p>Ver recicladoras</p>
            </div>
            <div class="action-card" onclick="nav('listar')">
                <div class="action-icon" style="background:#faf5ff;color:#9333ea;">&#128203;</div>
                <h3>Minhas Coletas</h3>
                <p>Historico completo</p>
            </div>
        </div>

        <h3 class="section-title">Coletas recentes</h3>
        <div id="recent-list" class="fade-up">
            <div class="empty-state"><div class="empty-icon">&#128230;</div><p>Carregando...</p></div>
        </div>

        <h3 class="section-title" style="margin-top:24px;">Empresas em destaque</h3>
        <p class="section-subtitle">Recicladoras melhor avaliadas</p>
        <div id="dash-empresas" class="fade-up">
            <div class="empty-state"><div class="empty-icon">&#127970;</div><p>Carregando...</p></div>
        </div>
    `;

    await carregarDados();
    await carregarEmpresasDestaque();
}

async function carregarDados() {
    if (!currentUser) return;
    try {
        const snapshot = await db.collection('coletas')
            .where('uid', '==', currentUser.uid)
            .orderBy('data', 'desc').limit(5).get();

        let totalPneus = 0, totalPendentes = 0, html = '';

        if (snapshot.empty) {
            html = '<div class="empty-state"><div class="empty-icon">&#128230;</div><h3>Nenhuma coleta ainda</h3><p>Registre sua primeira coleta!</p></div>';
        } else {
            html = '<div class="coleta-list">';
            snapshot.forEach(doc => {
                const c = doc.data();
                totalPneus += Number(c.quantidade || 0);
                if (c.status === 'Pendente') totalPendentes++;
                const data = c.data && c.data.seconds ? new Date(c.data.seconds * 1000).toLocaleDateString('pt-BR') : '--';
                const statusClass = c.status === 'Pendente' ? 'pendente' : c.status === 'Cancelada' ? 'cancelada' : 'concluida';
                html += `
                    <div class="coleta-item">
                        <div class="coleta-icon">&#9851;</div>
                        <div class="coleta-info">
                            <strong>${c.quantidade} pneus${c.tipoPneu ? ' (' + c.tipoPneu + ')' : ''}</strong>
                            <span>${c.endereco || (c.lat ? 'Lat: ' + c.lat.toFixed(3) : '--')} &bull; ${data}</span>
                        </div>
                        <span class="coleta-status ${statusClass}">${c.status || 'Pendente'}</span>
                    </div>`;
            });
            html += '</div>';
        }

        // Buscar total geral
        const allSnap = await db.collection('coletas').where('uid', '==', currentUser.uid).get();
        let allPneus = 0, allPend = 0;
        allSnap.forEach(d => { allPneus += Number(d.data().quantidade || 0); if (d.data().status === 'Pendente') allPend++; });

        document.getElementById('total-pneus').textContent = allPneus;
        document.getElementById('total-coletas').textContent = allSnap.size;
        document.getElementById('total-pendentes').textContent = allPend;
        document.getElementById('recent-list').innerHTML = html;
    } catch (e) {
        console.error(e);
        document.getElementById('recent-list').innerHTML = '<div class="empty-state"><div class="empty-icon">&#9888;</div><p>Erro ao carregar coletas</p></div>';
    }
}

async function carregarEmpresasDestaque() {
    try {
        const snap = await db.collection('usuarios').where('tipo', '==', 'empresa').limit(3).get();
        let html = '';
        if (snap.empty) {
            html = '<div class="empty-state"><p>Nenhuma empresa cadastrada ainda</p></div>';
        } else {
            for (const doc of snap.docs) {
                const e = doc.data();
                if (doc.id === currentUser.uid) continue;
                const rating = await calcularMedia(doc.id);
                html += renderEmpresaCard(doc.id, e, rating);
            }
            if (!html) html = '<div class="empty-state"><p>Nenhuma empresa encontrada</p></div>';
        }
        document.getElementById('dash-empresas').innerHTML = html;
    } catch(e) {
        console.error(e);
        document.getElementById('dash-empresas').innerHTML = '<div class="empty-state"><p>Erro ao carregar</p></div>';
    }
}

// ============================================================
// REGISTRAR COLETA (COMPLETO)
// ============================================================
function renderRegistrar(content) {
    selectedTipoPneu = '';
    selectedUrgencia = 'normal';
    content.innerHTML = `
        <div class="form-container fade-up">
            <h2>&#10133; Registrar Nova Coleta</h2>
            <p class="form-desc">Preencha os dados da coleta de pneus</p>

            <label>Tipo de Pneu *</label>
            <div class="tipo-grid">
                <div class="tipo-chip" onclick="selecionarTipoPneu(this, 'Passeio')">
                    <span class="chip-icon">&#128663;</span> Passeio
                </div>
                <div class="tipo-chip" onclick="selecionarTipoPneu(this, 'Caminhao')">
                    <span class="chip-icon">&#128666;</span> Caminhao
                </div>
                <div class="tipo-chip" onclick="selecionarTipoPneu(this, 'Moto')">
                    <span class="chip-icon">&#127949;</span> Moto
                </div>
                <div class="tipo-chip" onclick="selecionarTipoPneu(this, 'Onibus')">
                    <span class="chip-icon">&#128653;</span> Onibus
                </div>
                <div class="tipo-chip" onclick="selecionarTipoPneu(this, 'Agricola')">
                    <span class="chip-icon">&#127806;</span> Agricola
                </div>
                <div class="tipo-chip" onclick="selecionarTipoPneu(this, 'Outro')">
                    <span class="chip-icon">&#128260;</span> Outro
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>Quantidade *</label>
                    <input type="number" id="reg-qtd" placeholder="Ex: 50" min="1">
                </div>
                <div class="form-group">
                    <label>Peso estimado (kg)</label>
                    <input type="number" id="reg-peso" placeholder="Ex: 500" min="0">
                </div>
            </div>

            <label>Endereco completo *</label>
            <input type="text" id="reg-endereco" placeholder="Rua, numero, bairro, cidade">

            <label>Urgencia</label>
            <div class="urgencia-row">
                <div class="urgencia-chip active-low" onclick="selecionarUrgencia(this, 'baixa', 'active-low')">&#128994; Baixa</div>
                <div class="urgencia-chip" onclick="selecionarUrgencia(this, 'normal', 'active-med')">&#128992; Normal</div>
                <div class="urgencia-chip" onclick="selecionarUrgencia(this, 'alta', 'active-high')">&#128308; Alta</div>
            </div>

            <label>Observacoes</label>
            <textarea id="reg-obs" placeholder="Informacoes adicionais (estado dos pneus, acesso ao local...)" rows="3"></textarea>

            <label>Nome do responsavel</label>
            <input type="text" id="reg-responsavel" placeholder="Nome de quem vai entregar" value="${currentUser?.displayName || ''}">

            <label>Telefone para contato</label>
            <input type="tel" id="reg-telefone" placeholder="(11) 99999-0000" oninput="mascaraTel(this)">

            <button class="btn-confirm" onclick="registrarColeta()">Confirmar Coleta</button>
            <button class="btn-secondary" onclick="window.location.href='coleta.html'">&#128205; Registrar com Mapa</button>
        </div>
    `;

    // Pre-fill telefone
    if (currentUserData && currentUserData.telefone) {
        document.getElementById('reg-telefone').value = currentUserData.telefone;
    }
}

function selecionarTipoPneu(el, tipo) {
    document.querySelectorAll('.tipo-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    selectedTipoPneu = tipo;
}

function selecionarUrgencia(el, nivel, cls) {
    document.querySelectorAll('.urgencia-chip').forEach(c => {
        c.classList.remove('active-low', 'active-med', 'active-high');
    });
    el.classList.add(cls);
    selectedUrgencia = nivel;
}

function mascaraTel(input) {
    let v = input.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 6) v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    input.value = v;
}

async function registrarColeta() {
    const qtd = document.getElementById('reg-qtd').value;
    const peso = document.getElementById('reg-peso').value;
    const endereco = document.getElementById('reg-endereco').value;
    const obs = document.getElementById('reg-obs').value;
    const responsavel = document.getElementById('reg-responsavel').value;
    const telefone = document.getElementById('reg-telefone').value;
    const btn = document.querySelector('.btn-confirm');

    if (!selectedTipoPneu) { showToast('Selecione o tipo de pneu', 'error'); return; }
    if (!qtd || qtd < 1) { showToast('Informe a quantidade', 'error'); return; }
    if (!endereco) { showToast('Informe o endereco', 'error'); return; }

    setLoading(btn, true);
    const codigo = Math.floor(1000 + Math.random() * 9000);

    try {
        await db.collection('coletas').add({
            uid: currentUser.uid,
            nomeUsuario: currentUser.displayName || 'Usuario',
            quantidade: Number(qtd),
            pesoEstimado: peso ? Number(peso) : null,
            tipoPneu: selectedTipoPneu,
            endereco: endereco,
            urgencia: selectedUrgencia,
            observacoes: obs || '',
            responsavel: responsavel || '',
            telefone: telefone || '',
            codigo: codigo,
            status: 'Pendente',
            data: new Date()
        });

        showToast('Coleta #' + codigo + ' registrada com sucesso!');
        setTimeout(() => nav('listar'), 600);
    } catch (e) {
        console.error(e);
        showToast('Erro ao registrar coleta', 'error');
        setLoading(btn, false);
    }
}

// ============================================================
// LISTAR COLETAS (COMPLETO)
// ============================================================
async function renderListar(content) {
    content.innerHTML = `
        <div class="fade-up">
            <h3 class="section-title" style="margin-top:8px;">Todas as Coletas</h3>
            <div id="all-list"><div class="empty-state"><div class="empty-icon">&#128230;</div><p>Carregando...</p></div></div>
        </div>
    `;
    if (!currentUser) return;

    try {
        const snapshot = await db.collection('coletas')
            .where('uid', '==', currentUser.uid)
            .orderBy('data', 'desc').get();

        let html = '';
        if (snapshot.empty) {
            html = '<div class="empty-state"><div class="empty-icon">&#128230;</div><h3>Nenhuma coleta registrada</h3><p>Comece registrando uma coleta!</p></div>';
        } else {
            html = '<div class="coleta-list">';
            snapshot.forEach(doc => {
                const c = doc.data();
                const id = doc.id;
                const data = c.data && c.data.seconds ? new Date(c.data.seconds * 1000).toLocaleDateString('pt-BR') : '--';
                const statusClass = c.status === 'Pendente' ? 'pendente' : c.status === 'Cancelada' ? 'cancelada' : 'concluida';
                const urgClass = c.urgencia === 'alta' ? '&#128308;' : c.urgencia === 'baixa' ? '&#128994;' : '&#128992;';

                html += `
                    <div class="coleta-item coleta-item-expand" onclick="toggleDetail('${id}')">
                        <div class="coleta-icon">&#9851;</div>
                        <div class="coleta-info">
                            <strong>${c.quantidade} pneus${c.tipoPneu ? ' (' + c.tipoPneu + ')' : ''}</strong>
                            <span>${urgClass} ${c.endereco || (c.lat ? 'GPS' : '--')} &bull; ${data}${c.codigo ? ' &bull; #' + c.codigo : ''}</span>
                        </div>
                        <span class="coleta-status ${statusClass}">${c.status || 'Pendente'}</span>
                    </div>
                    <div class="coleta-detail" id="detail-${id}">
                        <div class="detail-grid">
                            <div class="detail-item"><span class="d-label">Codigo</span><span class="d-value">#${c.codigo || '--'}</span></div>
                            <div class="detail-item"><span class="d-label">Peso</span><span class="d-value">${c.pesoEstimado ? c.pesoEstimado + ' kg' : '--'}</span></div>
                            <div class="detail-item"><span class="d-label">Responsavel</span><span class="d-value">${c.responsavel || '--'}</span></div>
                            <div class="detail-item"><span class="d-label">Telefone</span><span class="d-value">${c.telefone || '--'}</span></div>
                        </div>
                        ${c.observacoes ? '<p style="font-size:0.8rem;color:var(--text-secondary);margin-top:8px;"><strong>Obs:</strong> ' + c.observacoes + '</p>' : ''}
                        ${c.status === 'Pendente' ? `
                            <div class="coleta-actions-row">
                                <button class="btn-sm green" onclick="event.stopPropagation();marcarConcluida('${id}')">&#10003; Concluir</button>
                                <button class="btn-sm red" onclick="event.stopPropagation();cancelarColeta('${id}')">&#10007; Cancelar</button>
                            </div>
                        ` : ''}
                    </div>`;
            });
            html += '</div>';
        }
        document.getElementById('all-list').innerHTML = html;
    } catch (e) {
        console.error(e);
        document.getElementById('all-list').innerHTML = '<div class="empty-state"><div class="empty-icon">&#9888;</div><p>Erro ao carregar coletas</p></div>';
    }
}

function toggleDetail(id) {
    const el = document.getElementById('detail-' + id);
    if (el) el.classList.toggle('show');
}

async function marcarConcluida(id) {
    try {
        await db.collection('coletas').doc(id).update({ status: 'Concluida' });
        showToast('Coleta marcada como concluida!');
        nav('listar');
    } catch(e) { showToast('Erro ao atualizar', 'error'); }
}

async function cancelarColeta(id) {
    if (!confirm('Tem certeza que deseja cancelar esta coleta?')) return;
    try {
        await db.collection('coletas').doc(id).update({ status: 'Cancelada' });
        showToast('Coleta cancelada');
        nav('listar');
    } catch(e) { showToast('Erro ao cancelar', 'error'); }
}

// ============================================================
// EMPRESAS / AVALIACOES
// ============================================================
let currentFilter = 'todos';

async function renderEmpresas(content) {
    content.innerHTML = `
        <div class="fade-up">
            <h3 class="section-title" style="margin-top:8px;">Empresas e Recicladoras</h3>
            <p class="section-subtitle">Encontre parceiros para destinacao de pneus</p>
            <div class="empresas-filter">
                <div class="filter-chip active" onclick="filtrarEmpresas('todos', this)">Todas</div>
                <div class="filter-chip" onclick="filtrarEmpresas('recicladora', this)">Recicladoras</div>
                <div class="filter-chip" onclick="filtrarEmpresas('transportadora', this)">Transportadoras</div>
                <div class="filter-chip" onclick="filtrarEmpresas('melhor', this)">Melhor Avaliadas</div>
            </div>
            <div id="empresas-list"><div class="empty-state"><div class="empty-icon">&#127970;</div><p>Carregando...</p></div></div>
        </div>
    `;
    await carregarEmpresas();
}

function filtrarEmpresas(filtro, el) {
    currentFilter = filtro;
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    carregarEmpresas();
}

async function carregarEmpresas() {
    try {
        let q = db.collection('usuarios').where('tipo', '==', 'empresa');
        const snap = await q.get();

        let empresas = [];
        for (const doc of snap.docs) {
            if (doc.id === currentUser.uid) continue;
            const e = doc.data();
            const rating = await calcularMedia(doc.id);
            empresas.push({ id: doc.id, data: e, rating: rating });
        }

        if (currentFilter === 'melhor') {
            empresas.sort((a, b) => b.rating.media - a.rating.media);
        }

        let html = '';
        if (empresas.length === 0) {
            html = '<div class="empty-state"><div class="empty-icon">&#127970;</div><h3>Nenhuma empresa encontrada</h3><p>Empresas cadastradas aparecerão aqui</p></div>';
        } else {
            empresas.forEach(emp => {
                html += renderEmpresaCard(emp.id, emp.data, emp.rating);
            });
        }
        document.getElementById('empresas-list').innerHTML = html;
    } catch(e) {
        console.error(e);
        document.getElementById('empresas-list').innerHTML = '<div class="empty-state"><p>Erro ao carregar empresas</p></div>';
    }
}

function renderEmpresaCard(id, e, rating) {
    const avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(e.nome || 'E') + '&background=0b6b3a&color=fff&size=100';
    const stars = renderStars(rating.media);
    const materiais = ['Pneus', 'Borracha', 'Aco'];

    return `
        <div class="empresa-card">
            <div class="empresa-top">
                <img class="empresa-avatar" src="${avatarUrl}" alt="${e.nome}">
                <div>
                    <div class="empresa-name">${e.nome || 'Empresa'} <span class="verified-badge">&#10003; Verificado</span></div>
                    <span class="empresa-tipo">Recicladora</span>
                </div>
            </div>
            <div class="empresa-stars">
                ${stars}
                <span class="rating-text">${rating.media.toFixed(1)} (${rating.total} avaliacoes)</span>
            </div>
            <div class="empresa-meta">
                <span>&#128205; ${e.cidade || 'Campinas, SP'}</span>
                <span>&#128222; ${e.telefone || '--'}</span>
            </div>
            <div class="empresa-tags">
                ${materiais.map(m => `<span class="empresa-tag">${m}</span>`).join('')}
            </div>
            <div class="empresa-actions">
                <button class="btn-contact" onclick="abrirContato('${id}', '${(e.nome||'').replace(/'/g, '')}', '${e.email||''}', '${e.telefone||''}', '${e.cnpj||''}')">&#128222; Contato</button>
                <button class="btn-whatsapp" onclick="abrirWhatsapp('${e.telefone||''}')">&#128172; WhatsApp</button>
                <button class="btn-rate" onclick="abrirAvaliar('${id}', '${(e.nome||'').replace(/'/g, '')}')">&#11088; Avaliar</button>
            </div>
            ${rating.reviews.length > 0 ? `
                <div class="reviews-section">
                    <h4 style="font-size:0.82rem;font-weight:700;margin-top:14px;margin-bottom:8px;">Avaliacoes recentes</h4>
                    ${rating.reviews.slice(0, 2).map(r => `
                        <div class="review-item">
                            <div class="review-top">
                                <span class="review-author">${r.nomeAvaliador || 'Usuario'}</span>
                                <span class="review-stars">${'&#9733;'.repeat(r.estrelas)}</span>
                            </div>
                            ${r.comentario ? `<p class="review-text">${r.comentario}</p>` : ''}
                            <span class="review-date">${r.data && r.data.seconds ? new Date(r.data.seconds * 1000).toLocaleDateString('pt-BR') : ''}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

function renderStars(media) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<span class="star ${i <= Math.round(media) ? '' : 'empty'}">&#9733;</span>`;
    }
    return html;
}

async function calcularMedia(empresaId) {
    try {
        const snap = await db.collection('avaliacoes').where('empresaId', '==', empresaId).orderBy('data', 'desc').limit(10).get();
        let soma = 0;
        let reviews = [];
        snap.forEach(doc => {
            const d = doc.data();
            soma += d.estrelas;
            reviews.push(d);
        });
        return { media: snap.size > 0 ? soma / snap.size : 0, total: snap.size, reviews: reviews };
    } catch(e) {
        return { media: 0, total: 0, reviews: [] };
    }
}

// --- Contato ---
function abrirContato(id, nome, email, telefone, cnpj) {
    document.getElementById('modal-title').textContent = 'Contato - ' + nome;
    document.getElementById('modal-body').innerHTML = `
        <div class="contact-info">
            <div class="contact-row">
                <div class="contact-icon">&#127970;</div>
                <div class="contact-text">
                    <span class="contact-label">Empresa</span>
                    <span class="contact-value">${nome}</span>
                </div>
            </div>
            <div class="contact-row">
                <div class="contact-icon">&#9993;</div>
                <div class="contact-text">
                    <span class="contact-label">E-mail</span>
                    <span class="contact-value">${email || 'Nao informado'}</span>
                </div>
            </div>
            <div class="contact-row">
                <div class="contact-icon">&#128222;</div>
                <div class="contact-text">
                    <span class="contact-label">Telefone</span>
                    <span class="contact-value">${telefone || 'Nao informado'}</span>
                </div>
            </div>
            <div class="contact-row">
                <div class="contact-icon">&#128196;</div>
                <div class="contact-text">
                    <span class="contact-label">CNPJ</span>
                    <span class="contact-value">${cnpj || 'Nao informado'}</span>
                </div>
            </div>
        </div>
        ${telefone ? `<button class="btn-confirm" style="margin-top:16px;" onclick="abrirWhatsapp('${telefone}')">&#128172; Enviar WhatsApp</button>` : ''}
        ${email ? `<button class="btn-secondary" onclick="window.open('mailto:${email}')">&#9993; Enviar E-mail</button>` : ''}
    `;
    document.getElementById('modal-contato').style.display = 'flex';
}

function fecharModal() { document.getElementById('modal-contato').style.display = 'none'; }

function abrirWhatsapp(telefone) {
    const num = telefone.replace(/\D/g, '');
    if (!num) { showToast('Telefone nao informado', 'error'); return; }
    const numBR = num.startsWith('55') ? num : '55' + num;
    window.open('https://wa.me/' + numBR + '?text=Ola! Vi seu perfil no Eco Pneus e gostaria de saber mais sobre coleta de pneus.', '_blank');
}

// --- Avaliar ---
function abrirAvaliar(empresaId, nome) {
    avaliarEmpresaId = empresaId;
    avaliarEstrelas = 0;
    document.getElementById('avaliar-nome').textContent = nome;
    document.getElementById('avaliar-comentario').value = '';
    document.querySelectorAll('.star-select').forEach(s => s.classList.remove('active'));
    document.getElementById('modal-avaliar').style.display = 'flex';

    // Star click handlers
    document.querySelectorAll('.star-select').forEach(star => {
        star.onclick = function() {
            avaliarEstrelas = parseInt(this.dataset.star);
            document.querySelectorAll('.star-select').forEach((s, i) => {
                s.classList.toggle('active', i < avaliarEstrelas);
            });
        };
    });
}

function fecharModalAvaliar() { document.getElementById('modal-avaliar').style.display = 'none'; }

async function enviarAvaliacao() {
    if (avaliarEstrelas === 0) { showToast('Selecione pelo menos 1 estrela', 'error'); return; }
    const comentario = document.getElementById('avaliar-comentario').value.trim();
    const btn = document.getElementById('btn-enviar-avaliacao');

    setLoading(btn, true);

    try {
        await db.collection('avaliacoes').add({
            empresaId: avaliarEmpresaId,
            avaliadorId: currentUser.uid,
            nomeAvaliador: currentUser.displayName || 'Usuario',
            estrelas: avaliarEstrelas,
            comentario: comentario,
            data: new Date()
        });

        showToast('Avaliacao enviada com sucesso!');
        fecharModalAvaliar();

        // Refresh current view
        const currentNav = document.querySelector('.nav-item.active');
        if (currentNav) {
            const aba = currentNav.dataset.nav;
            nav(aba);
        }
    } catch(e) {
        console.error(e);
        showToast('Erro ao enviar avaliacao', 'error');
        setLoading(btn, false);
    }
}

// --- Close modals on overlay click ---
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.style.display = 'none';
    }
});

// --- Logout ---
function logout() {
    auth.signOut().then(() => { window.location.href = 'index.html'; });
}

// Init
document.addEventListener('DOMContentLoaded', () => { lucide.createIcons(); });
