// ============================================================
// ECO PNEUS - Login
// ============================================================

// Login com email e senha
async function login() {
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const btn = document.querySelector('.btn-primary');

    if (!email || !senha) {
        showToast('Preencha todos os campos', 'error');
        return;
    }

    setLoading(btn, true);

    try {
        await firebase.auth().signInWithEmailAndPassword(email, senha);
        showToast('Login realizado com sucesso!');
        setTimeout(() => window.location.href = 'dashboard.html', 800);
    } catch (e) {
        let msg = 'Erro ao fazer login';
        if (e.code === 'auth/user-not-found') msg = 'Usuario nao encontrado';
        if (e.code === 'auth/wrong-password') msg = 'Senha incorreta';
        if (e.code === 'auth/invalid-email') msg = 'Email invalido';
        showToast(msg, 'error');
        setLoading(btn, false);
    }
}

// Login com Google
async function googleLogin() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await firebase.auth().signInWithPopup(provider);
        showToast('Login com Google realizado!');
        setTimeout(() => window.location.href = 'dashboard.html', 800);
    } catch (e) {
        showToast('Erro ao entrar com Google', 'error');
    }
}

// Enter key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') login();
});
