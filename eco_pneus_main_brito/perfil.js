// ============================================================
// ECO PNEUS - Perfil (Empresa / Pessoa)
// ============================================================

let perfilUser = null;
let perfilData = null;
let perfilTipo = 'pessoa';

// Auth
auth.onAuthStateChanged(async user => {
    if (!user) { window.location.href = 'login.html'; return; }
    perfilUser = user;

    // Basic data
    document.getElementById('perfil-nome').textContent = user.displayName || 'Usuario';
    document.getElementById('perfil-email-header').textContent = user.email || '';
    document.getElementById('perfil-avatar').src = user.photoURL ||
        'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || 'U') + '&background=0b6b3a&color=fff&size=150';

    // Firestore data
    try {
        const doc = await db.collection('usuarios').doc(user.uid).get();
        if (doc.exists) {
            perfilData = doc.data();
            perfilTipo = perfilData.tipo || 'pessoa';
        }
    } catch(e) { console.log('Sem dados extras'); }

    // Set badge
    document.getElementById('tipo-badge').textContent = perfilTipo === 'empresa' ? '\u{1F3E2}' : '\u{1F464}';

    // Load rating if empresa
    if (perfilTipo === 'empresa') {
        await carregarMinhaAvaliacao();
    }

    // Render profile
    await renderPerfil();
});

// --- Rating ---
async function carregarMinhaAvaliacao() {
    try {
        const snap = await db.collection('avaliacoes').where('empresaId', '==', perfilUser.uid).get();
        let soma = 0;
        snap.forEach(d => soma += d.data().estrelas);
        const media = snap.size > 0 ? soma / snap.size : 0;

        document.getElementById('perfil-rating').style.display = 'flex';
        document.getElementById('perfil-rating-num').textContent = media.toFixed(1);
        document.getElementById('perfil-rating-count').textContent = `(${snap.size} avaliacoes)`;

        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            starsHtml += `<span class="star ${i <= Math.round(media) ? '' : 'empty'}">&#9733;</span>`;
        }
        document.getElementById('perfil-stars').innerHTML = starsHtml;
    } catch(e) { console.log('Erro rating'); }
}

// --- Render ---
async function renderPerfil() {
    const content = document.getElementById('perfil-content');

    // Stats
    let totalPneus = 0, totalColetas = 0, pendentes = 0, concluidas = 0;
    try {
        const snap = await db.collection('coletas').where('uid', '==', perfilUser.uid).get();
        totalColetas = snap.size;
        snap.forEach(d => {
            totalPneus += Number(d.data().quantidade || 0);
            if (d.data().status === 'Pendente') pendentes++;
            if (d.data().status === 'Concluida') concluidas++;
        });
    } catch(e) {}

    let html = '';

    // Stats grid
    html += `
        <div class="perfil-stats fade-up">
            <div class="perfil-stat">
                <span class="stat-icon">&#128230;</span>
                <span class="stat-value green">${totalColetas}</span>
                <span class="stat-label">Total Coletas</span>
            </div>
            <div class="perfil-stat">
                <span class="stat-icon">&#9851;</span>
                <span class="stat-value">${totalPneus}</span>
                <span class="stat-label">Pneus Coletados</span>
            </div>
            <div class="perfil-stat">
                <span class="stat-icon">&#9203;</span>
                <span class="stat-value">${pendentes}</span>
                <span class="stat-label">Pendentes</span>
            </div>
            <div class="perfil-stat">
                <span class="stat-icon">&#9989;</span>
                <span class="stat-value green">${concluidas}</span>
                <span class="stat-label">Concluidas</span>
            </div>
        </div>
    `;

    // Verified badge
    if (perfilTipo === 'empresa') {
        html += `
            <div class="verified-row fade-up">
                <span class="v-icon">&#10003;</span>
                <span class="v-text">Empresa verificada na plataforma Eco Pneus</span>
            </div>
        `;
    }

    // Info section - DIFFERENT for empresa vs pessoa
    if (perfilTipo === 'empresa') {
        html += renderEmpresaPerfil();
    } else {
        html += renderPessoaPerfil();
    }

    // Reviews section (empresa only)
    if (perfilTipo === 'empresa') {
        html += await renderMinhasAvaliacoes();
    }

    // Actions
    html += `
        <div class="perfil-actions fade-up">
            <button class="btn-edit-full" onclick="toggleEditar()">&#9998; Editar Perfil</button>
            <button class="btn-logout" onclick="logout()">Sair da conta</button>
        </div>
    `;

    content.innerHTML = html;
}

function renderEmpresaPerfil() {
    const d = perfilData || {};
    return `
        <div class="info-section fade-up">
            <h3>&#127970; Dados da Empresa</h3>
            <div class="info-row">
                <span class="info-label">Razao Social</span>
                <span class="info-value">${d.nome || perfilUser.displayName || '--'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">CNPJ</span>
                <span class="info-value">${d.cnpj || '--'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">E-mail</span>
                <span class="info-value">${d.email || perfilUser.email || '--'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Telefone</span>
                <span class="info-value">${d.telefone || '--'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Cidade</span>
                <span class="info-value">${d.cidade || 'Nao informada'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Membro desde</span>
                <span class="info-value">${d.criadoEm && d.criadoEm.seconds ? new Date(d.criadoEm.seconds * 1000).toLocaleDateString('pt-BR') : '--'}</span>
            </div>
        </div>

        ${d.bio ? `
        <div class="info-section fade-up">
            <h3>&#128196; Sobre a Empresa</h3>
            <p class="bio-text">${d.bio}</p>
        </div>
        ` : ''}

        <div class="info-section fade-up">
            <h3>&#9851; Materiais e Capacidade</h3>
            <div class="material-tags">
                ${(d.materiais || 'Pneus,Borracha,Aco').split(',').map(m => `<span class="material-tag">${m.trim()}</span>`).join('')}
            </div>
            <div class="info-row">
                <span class="info-label">Capacidade mensal</span>
                <span class="info-value">${d.capacidade ? d.capacidade + ' toneladas' : 'Nao informada'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Tipo</span>
                <span class="info-value" style="color:var(--primary);font-weight:700;">Recicladora</span>
            </div>
        </div>
    `;
}

function renderPessoaPerfil() {
    const d = perfilData || {};
    return `
        <div class="info-section fade-up">
            <h3>&#128100; Dados Pessoais</h3>
            <div class="info-row">
                <span class="info-label">Nome</span>
                <span class="info-value">${d.nome || perfilUser.displayName || '--'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">E-mail</span>
                <span class="info-value">${d.email || perfilUser.email || '--'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Telefone</span>
                <span class="info-value">${d.telefone || '--'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Cidade</span>
                <span class="info-value">${d.cidade || 'Nao informada'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Tipo de conta</span>
                <span class="info-value">Pessoa Fisica</span>
            </div>
            <div class="info-row">
                <span class="info-label">Membro desde</span>
                <span class="info-value">${d.criadoEm && d.criadoEm.seconds ? new Date(d.criadoEm.seconds * 1000).toLocaleDateString('pt-BR') : '--'}</span>
            </div>
        </div>

        ${d.bio ? `
        <div class="info-section fade-up">
            <h3>&#128196; Sobre mim</h3>
            <p class="bio-text">${d.bio}</p>
        </div>
        ` : ''}

        <div class="info-section fade-up">
            <h3>&#127793; Contribuicao Ambiental</h3>
            <div class="info-row">
                <span class="info-label">Status</span>
                <span class="info-value" style="color:var(--primary);">&#10003; Ativo</span>
            </div>
            <div class="info-row">
                <span class="info-label">Nivel</span>
                <span class="info-value">${getNivel(perfilData)}</span>
            </div>
        </div>
    `;
}

function getNivel(data) {
    // Gamification based on coletas
    // Will be calculated from stats
    return '&#127793; Colaborador';
}

async function renderMinhasAvaliacoes() {
    try {
        const snap = await db.collection('avaliacoes')
            .where('empresaId', '==', perfilUser.uid)
            .orderBy('data', 'desc').limit(5).get();

        if (snap.empty) {
            return `
                <div class="info-section fade-up">
                    <h3>&#11088; Avaliacoes Recebidas</h3>
                    <p class="no-reviews">Nenhuma avaliacao recebida ainda</p>
                </div>
            `;
        }

        let reviewsHtml = '';
        snap.forEach(doc => {
            const r = doc.data();
            const data = r.data && r.data.seconds ? new Date(r.data.seconds * 1000).toLocaleDateString('pt-BR') : '';
            reviewsHtml += `
                <div class="review-card">
                    <div class="review-top">
                        <span class="review-author">${r.nomeAvaliador || 'Usuario'}</span>
                        <span class="review-stars">${'&#9733;'.repeat(r.estrelas)}${'&#9734;'.repeat(5 - r.estrelas)}</span>
                    </div>
                    ${r.comentario ? `<p class="review-text">${r.comentario}</p>` : ''}
                    <span class="review-date">${data}</span>
                </div>
            `;
        });

        return `
            <div class="info-section fade-up">
                <h3>&#11088; Avaliacoes Recebidas (${snap.size})</h3>
                <div class="reviews-list">${reviewsHtml}</div>
            </div>
        `;
    } catch(e) {
        return '';
    }
}

// --- Editar ---
function toggleEditar() {
    const d = perfilData || {};
    document.getElementById('edit-nome').value = d.nome || perfilUser.displayName || '';
    document.getElementById('edit-telefone').value = d.telefone || '';
    document.getElementById('edit-cnpj').value = d.cnpj || '';
    document.getElementById('edit-cidade').value = d.cidade || '';
    document.getElementById('edit-bio').value = d.bio || '';

    if (perfilTipo === 'empresa') {
        document.getElementById('edit-empresa-fields').style.display = 'block';
        document.getElementById('edit-cnpj-label').textContent = 'CNPJ';
        document.getElementById('edit-materiais').value = d.materiais || 'Pneus, Borracha, Aco';
        document.getElementById('edit-capacidade').value = d.capacidade || '';
    } else {
        document.getElementById('edit-empresa-fields').style.display = 'none';
        document.getElementById('edit-cnpj-label').textContent = 'CPF (opcional)';
    }

    document.getElementById('modal-editar').style.display = 'flex';
}

function fecharEditar() { document.getElementById('modal-editar').style.display = 'none'; }

async function salvarPerfil() {
    const nome = document.getElementById('edit-nome').value.trim();
    const telefone = document.getElementById('edit-telefone').value.trim();
    const cnpj = document.getElementById('edit-cnpj').value.trim();
    const cidade = document.getElementById('edit-cidade').value.trim();
    const bio = document.getElementById('edit-bio').value.trim();
    const btn = document.querySelector('.btn-save');

    if (!nome) { showToast('Informe o nome', 'error'); return; }

    setLoading(btn, true);

    try {
        const updateData = {
            nome, telefone, cnpj, cidade, bio,
            tipo: perfilTipo
        };

        if (perfilTipo === 'empresa') {
            updateData.materiais = document.getElementById('edit-materiais').value.trim();
            updateData.capacidade = document.getElementById('edit-capacidade').value || null;
        }

        await db.collection('usuarios').doc(perfilUser.uid).set(updateData, { merge: true });

        // Update displayName
        await perfilUser.updateProfile({ displayName: nome });

        perfilData = { ...perfilData, ...updateData };
        document.getElementById('perfil-nome').textContent = nome;

        showToast('Perfil atualizado com sucesso!');
        fecharEditar();
        await renderPerfil();

    } catch(e) {
        console.error(e);
        showToast('Erro ao salvar', 'error');
        setLoading(btn, false);
    }
}

function mascaraTel(input) {
    let v = input.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 6) v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    input.value = v;
}

// Close modal on overlay
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) e.target.style.display = 'none';
});

function voltar() { window.location.href = 'dashboard.html'; }
function logout() { auth.signOut().then(() => { window.location.href = 'login.html'; }); }
