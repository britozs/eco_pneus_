// ============================================================
// ECO PNEUS - Criar Conta
// ============================================================

let tipoSelecionado = 'empresa';
let tipoEmpresa = 'recicladores';

// Selecionar tipo de conta (Empresa / Pessoa Física)
function selecionarTipo(tipo) {
    tipoSelecionado = tipo;

    document.querySelectorAll('.tipo-tab').forEach(el => el.classList.remove('active'));
    document.querySelector(`.tipo-tab[data-tipo="${tipo}"]`).classList.add('active');

    const formEmpresa = document.getElementById('form-empresa');
    const formPessoa = document.getElementById('form-pessoa');

    if (tipo === 'empresa') {
        formEmpresa.style.display = 'block';
        formPessoa.style.display = 'none';
    } else {
        formEmpresa.style.display = 'none';
        formPessoa.style.display = 'block';
    }
}

// Selecionar tipo de empresa (Geradores / Transportadores / Recicladores)
function selecionarEmpresa(tipo) {
    tipoEmpresa = tipo;
    document.querySelectorAll('.empresa-card').forEach(el => el.classList.remove('active'));
    document.querySelector(`.empresa-card[data-empresa="${tipo}"]`).classList.add('active');
}

// Alternar visibilidade da senha
function togglePassword(inputId, icon) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// Buscar CEP automaticamente
async function buscarCEP(cep) {
    const limpo = cep.replace(/\D/g, '');
    if (limpo.length !== 8) return;

    try {
        const response = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
        const data = await response.json();

        if (data.erro) {
            if (typeof showToast === 'function') showToast('CEP não encontrado', 'error');
            return;
        }

        document.getElementById('endereco').value = `${data.logradouro}, ${data.bairro}`;
        document.getElementById('cidade').value = data.localidade;
        document.getElementById('uf').value = data.uf;
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
    }
}

// Máscaras
function mascaraCEP(input) {
    let v = input.value.replace(/\D/g, '');
    if (v.length > 8) v = v.slice(0, 8);
    if (v.length > 5) v = `${v.slice(0, 5)}-${v.slice(5)}`;
    input.value = v;
}

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

// Verificar força da senha
function checkPasswordStrength(password, contexto) {
    const container = contexto === 'empresa'
        ? document.getElementById('strength-empresa')
        : document.getElementById('strength-pessoa');
    if (!container) return;

    const bars = container.querySelectorAll('.strength-bar');
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

// Loading helper (caso showToast/setLoading não existam)
function setLoadingLocal(btn, loading) {
    if (!btn) return;
    if (loading) {
        btn.dataset.originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando...';
        btn.disabled = true;
    } else {
        btn.innerHTML = btn.dataset.originalText || 'Criar Conta';
        btn.disabled = false;
    }
}

function toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type);
    else alert(msg);
}

// Criar conta
async function criarConta() {
    const btn = document.querySelector('.btn-primary');

    if (tipoSelecionado === 'empresa') {
        const razaoSocial = document.getElementById('razao-social').value.trim();
        const email = document.getElementById('email-empresa').value.trim();
        const telefone = document.getElementById('telefone-empresa').value.trim();
        const cnpj = document.getElementById('cnpj').value.trim();
        const cep = document.getElementById('cep').value.trim();
        const endereco = document.getElementById('endereco').value.trim();
        const cidade = document.getElementById('cidade').value.trim();
        const uf = document.getElementById('uf').value;
        const senha = document.getElementById('senha-empresa').value;
        const confirmar = document.getElementById('confirmar-senha-empresa').value;

        if (!razaoSocial || !email || !telefone || !cnpj || !cep || !endereco || !cidade || !uf || !senha) {
            toast('Preencha todos os campos da empresa', 'error');
            return;
        }
        if (senha.length < 6) { toast('A senha deve ter pelo menos 6 caracteres', 'error'); return; }
        if (senha !== confirmar) { toast('As senhas não coincidem', 'error'); return; }

        setLoadingLocal(btn, true);

        try {
            const cred = await firebase.auth().createUserWithEmailAndPassword(email, senha);
            await cred.user.updateProfile({ displayName: razaoSocial });

            await firebase.firestore().collection('usuarios').doc(cred.user.uid).set({
                tipo: 'empresa',
                tipoEmpresa: tipoEmpresa,
                razaoSocial,
                email,
                telefone,
                cnpj,
                endereco: { cep, endereco, cidade, uf },
                criadoEm: new Date()
            });

            toast('Conta criada com sucesso!');
            setTimeout(() => window.location.href = 'dashboard.html', 1000);
        } catch (error) {
            let msg = 'Erro ao criar conta';
            if (error.code === 'auth/email-already-in-use') msg = 'Este email já está em uso';
            if (error.code === 'auth/invalid-email') msg = 'Email inválido';
            if (error.code === 'auth/weak-password') msg = 'Senha muito fraca';
            toast(msg, 'error');
            setLoadingLocal(btn, false);
        }

    } else {
        // Pessoa Física: somente nome, email, telefone, senha
        const nome = document.getElementById('nome-pessoa').value.trim();
        const email = document.getElementById('email-pessoa').value.trim();
        const telefone = document.getElementById('telefone-pessoa').value.trim();
        const senha = document.getElementById('senha-pessoa').value;
        const confirmar = document.getElementById('confirmar-senha-pessoa').value;

        if (!nome || !email || !telefone || !senha) {
            toast('Preencha todos os campos', 'error');
            return;
        }
        if (senha.length < 6) { toast('A senha deve ter pelo menos 6 caracteres', 'error'); return; }
        if (senha !== confirmar) { toast('As senhas não coincidem', 'error'); return; }

        setLoadingLocal(btn, true);

        try {
            const cred = await firebase.auth().createUserWithEmailAndPassword(email, senha);
            await cred.user.updateProfile({ displayName: nome });

            await firebase.firestore().collection('usuarios').doc(cred.user.uid).set({
                tipo: 'pessoa',
                nome,
                email,
                telefone,
                criadoEm: new Date()
            });

            toast('Conta criada com sucesso!');
            setTimeout(() => window.location.href = 'dashboard.html', 1000);
        } catch (error) {
            let msg = 'Erro ao criar conta';
            if (error.code === 'auth/email-already-in-use') msg = 'Este email já está em uso';
            if (error.code === 'auth/invalid-email') msg = 'Email inválido';
            if (error.code === 'auth/weak-password') msg = 'Senha muito fraca';
            toast(msg, 'error');
            setLoadingLocal(btn, false);
        }
    }
}

// Google login / cadastro
async function googleLogin() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await firebase.auth().signInWithPopup(provider);

        // Salva no Firestore se for primeiro acesso
        const user = result.user;
        const userRef = firebase.firestore().collection('usuarios').doc(user.uid);
        const snap = await userRef.get();
        if (!snap.exists) {
            await userRef.set({
                tipo: tipoSelecionado,
                tipoEmpresa: tipoSelecionado === 'empresa' ? tipoEmpresa : null,
                nome: user.displayName,
                email: user.email,
                criadoEm: new Date()
            });
        }

        toast('Conta criada com Google!');
        setTimeout(() => window.location.href = 'dashboard.html', 800);
    } catch (e) {
        toast('Erro ao entrar com Google', 'error');
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    selecionarTipo('empresa');
    selecionarEmpresa('recicladores');
});
