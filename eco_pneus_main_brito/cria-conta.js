// ============================================================
// ECO PNEUS - Criar Conta
// ============================================================

let tipoSelecionado = 'empresa';

// Selecionar tipo de conta
function selecionarTipo(tipo) {
    tipoSelecionado = tipo;
    document.querySelectorAll('.tipo-option').forEach(el => el.classList.remove('active'));
    document.querySelector(`[data-tipo="${tipo}"]`).classList.add('active');

    // Mostrar/esconder campo CNPJ e Endereço
    const cnpjGroup = document.getElementById('cnpj-group');
    const enderecoContainer = document.getElementById('endereco-container');
    
    if (tipo === 'pessoa') {
        cnpjGroup.style.display = 'none';
        enderecoContainer.style.display = 'none';
    } else {
        cnpjGroup.style.display = 'block';
        enderecoContainer.style.display = 'block';
        document.getElementById('cnpj-label').textContent = 'CNPJ *';
        document.getElementById('cnpj').placeholder = '00.000.000/0001-00';
    }
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
            showToast('CEP não encontrado', 'error');
            return;
        }

        document.getElementById('endereco').value = `${data.logradouro}, ${data.bairro}`;
        document.getElementById('cidade').value = data.localidade;
        document.getElementById('uf').value = data.uf;
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
    }
}

// Mascara CEP
function mascaraCEP(input) {
    let v = input.value.replace(/\D/g, '');
    if (v.length > 8) v = v.slice(0, 8);
    if (v.length > 5) {
        v = `${v.slice(0, 5)}-${v.slice(5)}`;
    }
    input.value = v;
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
    
    // Dados de endereço (apenas para empresa)
    const cep = document.getElementById('cep').value.trim();
    const endereco = document.getElementById('endereco').value.trim();
    const cidade = document.getElementById('cidade').value.trim();
    const uf = document.getElementById('uf').value;

    const btn = document.querySelector('.btn-primary');

    // Validacoes basicas
    if (!nome || !email || !telefone || !senha) {
        showToast('Preencha todos os campos obrigatorios', 'error');
        return;
    }

    if (tipoSelecionado === 'empresa') {
        if (!cnpj || !cep || !endereco || !cidade || !uf) {
            showToast('Preencha todos os dados da empresa', 'error');
            return;
        }
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

        const userData = {
            nome: nome,
            email: email,
            telefone: telefone,
            tipo: tipoSelecionado,
            criadoEm: new Date()
        };

        if (tipoSelecionado === 'empresa') {
            userData.cnpj = cnpj;
            userData.endereco = {
                cep, endereco, cidade, uf
            };
        }

        await db.collection('usuarios').doc(cred.user.uid).set(userData);

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

// Google login
async function googleLogin() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await firebase.auth().signInWithPopup(provider);
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