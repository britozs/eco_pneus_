require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();

// ===== CONFIGURAÇÕES =====
app.use(cors());
app.use(express.json());

// Servir o frontend
app.use(express.static(path.join(__dirname, '../frontend')));

const SECRET = process.env.JWT_SECRET || "dev";
const PORT = process.env.PORT || 3000;

// ===== BANCO DE DADOS EM MEMÓRIA =====
let users = [
    { email: "admin@eco.com", senha: "123456" }
];

let coletas = [];

// ===== MIDDLEWARE DE AUTENTICAÇÃO =====
function auth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(403).json({
            msg: "Token não fornecido ou inválido"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            msg: "Token inválido ou expirado"
        });
    }
}

// ===== ROTAS =====

// Página inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Login tradicional
app.post('/login', (req, res) => {
    const { email, senha } = req.body;

    const user = users.find(
        u => u.email === email && u.senha === senha
    );

    if (!user) {
        return res.status(401).json({
            msg: "Login inválido"
        });
    }

    const token = jwt.sign(
        { email: user.email },
        SECRET,
        { expiresIn: "2h" }
    );

    res.json({ token });
});

// Login via Firebase/Google
app.post('/google-login', (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({
            msg: "Token não enviado"
        });
    }

    // Simulação de validação do Firebase
    const email = "google_user@eco.com";

    let user = users.find(u => u.email === email);
    if (!user) {
        user = { email, senha: null };
        users.push(user);
    }

    const localToken = jwt.sign(
        { email: user.email },
        SECRET,
        { expiresIn: "2h" }
    );

    res.json({ token: localToken });
});

// Cadastro de usuário
app.post('/register', (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({
            msg: "Preencha todos os campos"
        });
    }

    if (users.find(u => u.email === email)) {
        return res.status(400).json({
            msg: "Usuário já existe"
        });
    }

    users.push({ email, senha });

    res.status(201).json({
        msg: "Conta criada com sucesso"
    });
});

// Registrar coleta
app.post('/coleta', auth, (req, res) => {
    const nova = {
        id: coletas.length + 1,
        quantidade: req.body.quantidade || 0,
        tipoPneu: req.body.tipoPneu || "Passeio",
        endereco: req.body.endereco || "Não informado",
        status: "Pendente",
        lat: req.body.lat,
        lng: req.body.lng,
        data: new Date().toLocaleDateString('pt-BR'),
        codigo: Math.floor(1000 + Math.random() * 9000),
        usuario: req.user.email
    };

    coletas.push(nova);
    res.json(nova);
});

// Listar coletas
app.get('/coletas', auth, (req, res) => {
    res.json(coletas);
});

// Status da API
app.get('/api/status', (req, res) => {
    res.json({
        status: "OK",
        mensagem: "API Eco Pneus funcionando 🚀"
    });
});

// Inicialização do servidor
app.listen(PORT, () => {
    console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
});