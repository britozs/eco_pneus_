// ============================================================
// ECO PNEUS - Perfil
// ============================================================

// Auth
auth.onAuthStateChanged(async user => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    let fotoFinal = '';

    // Dados basicos do Auth (fallback)
    document.getElementById('perfil-nome').textContent = user.displayName || 'Usuario';
    document.getElementById('perfil-email-header').textContent = user.email || '';

    document.getElementById('info-email').textContent = user.email || '--';

    // 🔥 GARANTE QUE O USUARIO EXISTE NO FIRESTORE
    try {
        const ref = db.collection('usuarios').doc(user.uid);
        let doc = await ref.get();

        if (!doc.exists) {
            await ref.set({
                nome: user.displayName || 'Usuario',
                email: user.email,
                telefone: '',
                cnpj: '',
                tipo: 'pessoa',

                xp: 0,
                nivel: 1,
                totalPneus: 0,
                totalColetas: 0,

                rating: 0,
                totalAvaliacoes: 0,

                foto: user.photoURL || '',

                criadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });

            doc = await ref.get();
        }

        const data = doc.data();

        // 🔥 AGORA USA OS DADOS DO FIRESTORE
        document.getElementById('perfil-nome').textContent = data.nome || user.displayName || 'Usuario';

        document.getElementById('info-telefone').textContent = data.telefone || '--';
        document.getElementById('info-cnpj').textContent = data.cnpj || '--';
        document.getElementById('info-tipo').textContent =
            data.tipo === 'empresa' ? 'Empresa' : 'Pessoa Fisica';

        // Foto do banco
        if (data.foto) {
            fotoFinal = data.foto;
        }

    } catch (e) {
        console.log('Erro ao buscar/criar usuario', e);
    }

    // 🔥 fallback inteligente da foto
    if (!fotoFinal) {
        if (user.photoURL) {
            fotoFinal = user.photoURL;
        } else {
            fotoFinal = 'https://ui-avatars.com/api/?name=' +
                encodeURIComponent(user.displayName || 'U') +
                '&background=0b6b3a&color=fff&size=150';
        }
    }

    // Aplica a foto
    document.getElementById('perfil-avatar').src = fotoFinal;

    // Carregar estatisticas
    try {
        const snapshot = await db.collection('coletas')
            .where('uid', '==', user.uid)
            .get();

        let totalPneus = 0;
        let pendentes = 0;

        snapshot.forEach(doc => {
            const c = doc.data();
            totalPneus += Number(c.quantidade || 0);
            if (c.status === 'Pendente') pendentes++;
        });

        document.getElementById('stat-coletas').textContent = snapshot.size;
        document.getElementById('stat-pneus').textContent = totalPneus;
        document.getElementById('stat-pendentes').textContent = pendentes;
        document.getElementById('stat-concluidas').textContent = snapshot.size - pendentes;

    } catch (e) {
        console.error(e);
    }
});

// Voltar
function voltar() {
    window.location.href = 'dashboard.html';
}

// Logout
function logout() {
    auth.signOut().then(() => {
        window.location.href = 'login.html';
    });
}