// ============================================================
// ECO PNEUS - Criar Conta
// ============================================================

let tipoSelecionado = 'empresa';

// Selecionar tipo de conta
function selecionarTipo(tipo) {
    tipoSelecionado = tipo;
    document.querySelectorAll('.tipo-option').forEach(el => el.classList.remove('active'));
    document.querySelector(`[data-tipo="${tipo}"]`).classList.add('active');

    const cnpjGroup = document.getElementById('cnpj-group');
    if (tipo === 'pessoa') {
        cnpjGroup.style.display = 'none';
    } else {
        cnpjGroup.style.display = 'block';
        document.getElementById('cnpj-label').textContent = 'CNPJ';
        document.getElementById('cnpj').placeholder = '00.000.000/0001-00';
    }
}

// Verificar forca da senha
function checkPasswordStrength(password) {
    const bars = document.querySelectorAll('.strength-bar');
    bars.forEach(b => b.className = 'strength-bar');

    if (password.length === 0) return;

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8 && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) strength++;

    const levels = ['weak', 'medium', 'strong'];
    for (let i = 0; i < strength; i++) {
        bars[i].classList.add(levels[Math.min(i, 2)]);
    }
}

// Mascara telefone
function mascaraTelefone(input) {
    let v = input.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 6) {
        v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    } else if (v.length > 2) {
        v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    }
    input.value = v;
}

// Mascara CNPJ
function mascaraCNPJ(input) {
    let v = input.value.replace(/\D/g, '');
    if (v.length > 14) v = v.slice(0, 14);
    if (v.length > 12) {
        v = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5,8)}/${v.slice(8,12)}-${v.slice(12)}`;
    } else if (v.length > 8) {
        v = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5,8)}/${v.slice(8)}`;
    } else if (v.length > 5) {
        v = `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5)}`;
    } else if (v.length > 2) {
        v = `${v.slice(0,2)}.${v.slice(2)}`;
    }
    input.value = v;
}

// Criar conta
async function criarConta() {
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefone = document.getElementById('telefone').value.trim();
    const cnpj = document.getElementById('cnpj') ? document.getElementById('cnpj').value.trim() : '';
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmar-senha').value;
    const btn = document.querySelector('.btn-primary');

    if (!nome || !email || !telefone || !senha) {
        showToast('Preencha todos os campos obrigatorios', 'error');
        return;
    }

    if (tipoSelecionado === 'empresa' && !cnpj) {
        showToast('Informe o CNPJ da empresa', 'error');
        return;
    }

    if (senha.length < 6) {
        showToast('A senha deve ter pelo menos 6 caracteres', 'error');
        return;
    }

    if (senha !== confirmarSenha) {
        showToast('As senhas nao coincidem', 'error');
        return;
    }

    setLoading(btn, true);

    try {
        const cred = await firebase.auth().createUserWithEmailAndPassword(email, senha);

        await cred.user.updateProfile({ displayName: nome });

        await db.collection('usuarios').doc(cred.user.uid).set({
            nome: nome,
            email: email,
            telefone: telefone,
            cnpj: cnpj,
            tipo: tipoSelecionado,

            xp: 0,
            nivel: 1,
            totalPneus: 0,
            totalColetas: 0,

            rating: 0,
            totalAvaliacoes: 0,

            foto: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(nome),

            criadoEm: firebase.firestore.FieldValue.serverTimestamp()
        });

        showToast('Conta criada com sucesso!');
        setTimeout(() => window.location.href = 'dashboard.html', 1000);

    } catch (error) {
        let msg = 'Erro ao criar conta';
        if (error.code === 'auth/email-already-in-use') msg = 'Este email ja esta em uso';
        if (error.code === 'auth/invalid-email') msg = 'Email invalido';
        if (error.code === 'auth/weak-password') msg = 'Senha muito fraca';
        showToast(msg, 'error');
        setLoading(btn, false);
    }
}

// 🔥 GOOGLE LOGIN CORRIGIDO
async function googleLogin() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await firebase.auth().signInWithPopup(provider);

        const user = result.user;
        const ref = db.collection('usuarios').doc(user.uid);
        const doc = await ref.get();

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
        }

        showToast('Conta criada com Google!');
        setTimeout(() => window.location.href = 'dashboard.html', 800);

    } catch (e) {
        showToast('Erro ao entrar com Google', 'error');
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    selecionarTipo('empresa');
});