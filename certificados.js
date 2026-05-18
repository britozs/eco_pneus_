/**
 * ============================================================
 * ECO PNEUS - SISTEMA DE CERTIFICADOS PDF (CORRIGIDO)
 * ============================================================
 * 
 * Gera certificado PDF consolidado com TODAS as coletas
 * concluídas do usuário logado, usando SOMENTE dados reais do Firestore.
 * 
 * Requisitos:
 * - Firebase Modular v10+
 * - jsPDF para geração de PDF
 * - Compatível com firebase-config.js existente
 * 
 * ============================================================
 */

// ============================================================
// IMPORTS DO FIREBASE MODULAR (v10+)
// ============================================================
// Usamos os imports modulares via CDN para compatibilidade
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    getDocs, 
    onSnapshot,
    doc,
    getDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { 
    getAuth, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// ============================================================
// CONFIGURAÇÃO FIREBASE
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyCnO3B_Px9KkQUl79MVq3zcxwoxa3x87XU",
    authDomain: "eco-pneus.firebaseapp.com",
    projectId: "eco-pneus",
    storageBucket: "eco-pneus.firebasestorage.app",
    messagingSenderId: "621224107269",
    appId: "1:621224107269:web:13cd1e804ee275621b2b6c"
};

// Inicializa Firebase (apenas se ainda não inicializado)
let app;
let db;
let auth;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
} catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
}

// ============================================================
// ESTADO GLOBAL
// ============================================================
const CertificadosState = {
    isLoading: false,
    isReady: false,
    error: null,
    coletas: [],
    usuario: null,
    userData: null,
    unsubscribe: null
};

// ============================================================
// FUNÇÕES DE SUPORTE
// ============================================================

/**
 * Formata data do Firestore para string legível
 */
function formatarData(data) {
    if (!data) return '—';
    
    try {
        let dateObj;
        if (data.seconds) {
            dateObj = new Date(data.seconds * 1000);
        } else if (data.toDate) {
            dateObj = data.toDate();
        } else if (typeof data === 'string') {
            dateObj = new Date(data);
        } else {
            dateObj = data;
        }
        
        if (isNaN(dateObj.getTime())) return '—';
        
        return dateObj.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        return '—';
    }
}

/**
 * Formata data completa para exibição
 */
function formatarDataCompleta(data) {
    if (!data) return '';
    
    try {
        let dateObj;
        if (data.seconds) {
            dateObj = new Date(data.seconds * 1000);
        } else if (data.toDate) {
            dateObj = data.toDate();
        } else {
            dateObj = new Date(data);
        }
        
        return dateObj.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    } catch (e) {
        return '';
    }
}

/**
 * Extrai quantidade de pneus da coleta
 */
function getQuantidade(coleta) {
    return Number(coleta.quantidade || coleta.qtd || coleta.totalPneus || 0);
}

/**
 * Extrai tipo de material/pneu
 */
function getTipoMaterial(coleta) {
    return coleta.tipoPneu || coleta.tipo || 'Pneus';
}

/**
 * Extrai endereço da coleta
 */
function getEndereco(coleta) {
    return coleta.endereco || 'Não informado';
}

/**
 * Extrai código/protocolo da coleta
 */
function getCodigo(coleta, docId) {
    return coleta.protocolo || coleta.codigo || coleta.codigoConfirmacao || `EC-${docId.substring(0, 8).toUpperCase()}`;
}

/**
 * Calcula o resumo ambiental das coletas
 */
function calcularResumoAmbiental(coletas) {
    let totalPneus = 0;
    let totalCO2 = 0;
    let totalAgua = 0;
    let totalEnergia = 0;
    let totalAterro = 0;

    coletas.forEach(coleta => {
        const qtd = getQuantidade(coleta);
        totalPneus += qtd;
        
        // Cálculos de impacto ambiental (valores aproximados por pneu)
        totalCO2 += qtd * 0.0027; // toneladas de CO2 evitadas
        totalAgua += qtd * 14.7; // litros de água economizados
        totalEnergia += qtd * 0.0049; // MWh de energia evitada
        totalAterro += qtd * 0.00075; // toneladas de aterro evitado
    });

    return {
        totalPneus,
        totalCO2: totalCO2.toFixed(2),
        totalAgua: totalAgua.toFixed(0),
        totalEnergia: totalEnergia.toFixed(2),
        totalAterro: totalAterro.toFixed(2),
        totalColetas: coletas.length
    };
}

/**
 * Calcula o nível sustentável do usuário
 */
function calcularNivelSustentavel(resumo) {
    const totalPneus = resumo.totalPneus;
    let nivel = 'Iniciante';
    let pontos = 0;

    if (totalPneus >= 1000) {
        nivel = 'Mestre da Sustentabilidade';
        pontos = 5;
    } else if (totalPneus >= 500) {
        nivel = 'Embaixador Eco';
        pontos = 4;
    } else if (totalPneus >= 200) {
        nivel = 'Guardião Verde';
        pontos = 3;
    } else if (totalPneus >= 50) {
        nivel = 'Aliado do Planeta';
        pontos = 2;
    } else if (totalPneus >= 10) {
        nivel = 'Contribuidor Sustentável';
        pontos = 1;
    }

    return { nivel, pontos, totalPneus };
}

// ============================================================
// FUNÇÕES PRINCIPAIS - FIRESTORE MODULAR
// ============================================================

/**
 * Busca dados do usuário no Firestore usando Firebase Modular
 */
async function buscarDadosUsuario(uid) {
    if (!db) {
        throw new Error('Firestore não disponível');
    }

    try {
        const userDocRef = doc(db, 'usuarios', uid);
        const userSnap = await getDoc(userDocRef);
        
        if (!userSnap.exists()) {
            // Retorna dados básicos se documento não existir
            return {
                uid: uid,
                nome: CertificadosState.usuario?.displayName || 'Usuário',
                email: CertificadosState.usuario?.email || '',
                telefone: '',
                tipo: 'pessoa_fisica',
                tipoEmpresa: '',
                razaoSocial: '',
                endereco: {}
            };
        }
        
        return { uid, ...userSnap.data() };
    } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        throw new Error('Falha ao carregar dados do usuário');
    }
}

/**
 * Busca TODAS as coletas concluídas do usuário usando Firebase Modular
 */
async function buscarColetasConcluidas(uid) {
    if (!db) {
        throw new Error('Firestore não disponível');
    }

    try {
        // Query para buscar coletas concluídas do usuário
        const coletasRef = collection(db, 'coletas');
        const q = query(
            coletasRef, 
            where('uid', '==', uid), 
            where('status', '==', 'concluida')
        );
        
        const querySnapshot = await getDocs(q);
        const coletas = [];
        
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            coletas.push({
                id: docSnap.id,
                codigo: getCodigo(data, docSnap.id),
                ...data
            });
        });

        // Ordena por data (mais recente primeiro)
        coletas.sort((a, b) => {
            const dateA = a.data?.seconds ? a.data.seconds : 
                         a.criadoEm?.seconds ? a.criadoEm.seconds : 0;
            const dateB = b.data?.seconds ? b.data.seconds : 
                         b.criadoEm?.seconds ? b.criadoEm.seconds : 0;
            return dateB - dateA;
        });

        return coletas;
    } catch (error) {
        console.error('Erro ao buscar coletas:', error);
        
        // Se falhar por falta de índice composto, tenta fallback
        if (error.code === 'failed-precondition' || error.message?.includes('index')) {
            return await buscarColetasConcluidasFallback(uid);
        }
        
        throw new Error('Falha ao carregar coletas');
    }
}

/**
 * Fallback para quando o índice composto não existe
 */
async function buscarColetasConcluidasFallback(uid) {
    try {
        const coletasRef = collection(db, 'coletas');
        const q = query(coletasRef, where('uid', '==', uid));
        
        const querySnapshot = await getDocs(q);
        const coletas = [];
        
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const status = String(data.status || '').toLowerCase();
            if (status === 'concluida' || status === 'concluída') {
                coletas.push({
                    id: docSnap.id,
                    codigo: getCodigo(data, docSnap.id),
                    ...data
                });
            }
        });

        // Ordena por data
        coletas.sort((a, b) => {
            const dateA = a.data?.seconds ? a.data.seconds : 
                         a.criadoEm?.seconds ? a.criadoEm.seconds : 0;
            const dateB = b.data?.seconds ? b.data.seconds : 
                         b.criadoEm?.seconds ? b.criadoEm.seconds : 0;
            return dateB - dateA;
        });

        return coletas;
    } catch (error) {
        console.error('Erro no fallback de coletas:', error);
        return [];
    }
}

/**
 * Listener em tempo real para atualizações de coletas usando Firebase Modular
 */
function ouvirColetasEmTempoReal(uid, callback) {
    if (!db) {
        console.warn('Firestore não disponível');
        return null;
    }

    try {
        const coletasRef = collection(db, 'coletas');
        const q = query(coletasRef, where('uid', '==', uid));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const coletas = [];
            
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const status = String(data.status || '').toLowerCase();
                if (status === 'concluida' || status === 'concluída') {
                    coletas.push({
                        id: docSnap.id,
                        codigo: getCodigo(data, docSnap.id),
                        ...data
                    });
                }
            });

            // Ordena por data
            coletas.sort((a, b) => {
                const dateA = a.data?.seconds ? a.data.seconds : 
                             a.criadoEm?.seconds ? a.criadoEm.seconds : 0;
                const dateB = b.data?.seconds ? b.data.seconds : 
                             b.criadoEm?.seconds ? b.criadoEm.seconds : 0;
                return dateB - dateA;
            });

            if (typeof callback === 'function') {
                callback(coletas);
            }
        }, (error) => {
            console.error('Erro no listener de coletas:', error);
        });

        return unsubscribe;
    } catch (error) {
        console.error('Erro ao ouvir coletas:', error);
        return null;
    }
}

// ============================================================
// GERAÇÃO DO CERTIFICADO
// ============================================================

/**
 * Gera o HTML do certificado para conversão em PDF
 */
function gerarHTMLCertificado(params) {
    const { usuario, userData, coletas, resumo, nivel, dataEmissao } = params;

    // Dados do usuário
    const nomeUsuario = userData.razaoSocial || userData.nome || usuario?.displayName || 'Usuário';
    const email = userData.email || usuario?.email || 'Não informado';
    const telefone = userData.telefone || 'Não informado';
    
    // Tipo de empresa
    const tipoEmpresaRaw = userData.tipoEmpresa || '';
    let tipoEmpresa = 'Gerador';
    if (tipoEmpresaRaw === 'recicladores') tipoEmpresa = 'Recicladora';
    else if (tipoEmpresaRaw === 'transportadores') tipoEmpresa = 'Transportadora';
    else if (tipoEmpresaRaw === 'geradores') tipoEmpresa = 'Gerador';
    
    // Endereço
    const enderecoObj = userData.endereco || {};
    const endereco = enderecoObj.endereco ? 
        `${enderecoObj.endereco || ''}, ${enderecoObj.cidade || ''} - ${enderecoObj.uf || ''}` : 
        'Não informado';

    // Data de emissão formatada
    const dataEmissaoFormatada = formatarDataCompleta(dataEmissao);

    // Gera tabela de coletas
    let tabelaColetasHTML = '';
    coletas.forEach((coleta, index) => {
        const dataColeta = formatarData(coleta.data || coleta.criadoEm || coleta.createdAt);
        const qtd = getQuantidade(coleta);
        const tipoMaterial = getTipoMaterial(coleta);
        const enderecoColeta = getEndereco(coleta);
        const codigo = coleta.codigo || '—';

        tabelaColetasHTML += `
            <tr class="coleta-row ${index % 2 === 0 ? 'even' : 'odd'}">
                <td class="col-codigo">${codigo}</td>
                <td class="col-data">${dataColeta}</td>
                <td class="col-qtd">${qtd}</td>
                <td class="col-material">${tipoMaterial}</td>
                <td class="col-endereco">${enderecoColeta}</td>
                <td class="col-status"><span class="status-badge status-concluida">Concluída</span></td>
            </tr>
        `;
    });

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificado Eco Pneus</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #fff;
            color: #1a1a2e;
            line-height: 1.6;
            padding: 40px;
            max-width: 900px;
            margin: 0 auto;
        }
        
        .certificado-header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 3px solid #0b6b3a;
        }
        
        .logo {
            width: 80px;
            height: 80px;
            margin-bottom: 15px;
        }
        
        .certificado-titulo {
            font-size: 28px;
            font-weight: 700;
            color: #0b6b3a;
            margin-bottom: 5px;
        }
        
        .certificado-subtitulo {
            font-size: 14px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        .certificado-info {
            background: #f8fafc;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 30px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .info-item {
            display: flex;
            flex-direction: column;
        }
        
        .info-label {
            font-size: 11px;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 1px;
            margin-bottom: 4px;
        }
        
        .info-value {
            font-size: 15px;
            font-weight: 600;
            color: #1a1a2e;
        }
        
        .nivel-badge {
            display: inline-block;
            background: linear-gradient(135deg, #0b6b3a, #10b981);
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-top: 10px;
        }
        
        .coletas-section {
            margin-bottom: 30px;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: 700;
            color: #1a1a2e;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .section-title::before {
            content: '';
            width: 4px;
            height: 20px;
            background: #0b6b3a;
            border-radius: 2px;
        }
        
        .coletas-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }
        
        .coletas-table th {
            background: #0b6b3a;
            color: white;
            padding: 10px 12px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
        }
        
        .coletas-table th:first-child {
            border-radius: 8px 0 0 0;
        }
        
        .coletas-table th:last-child {
            border-radius: 0 8px 0 0;
        }
        
        .coletas-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .coleta-row.even {
            background: #f8fafc;
        }
        
        .status-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
        }
        
        .status-concluida {
            background: #d1fae5;
            color: #065f46;
        }
        
        .resumo-section {
            background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 30px;
            border: 1px solid #bbf7d0;
        }
        
        .resumo-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-top: 15px;
        }
        
        .resumo-item {
            text-align: center;
        }
        
        .resumo-valor {
            font-size: 24px;
            font-weight: 700;
            color: #0b6b3a;
        }
        
        .resumo-label {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 5px;
        }
        
        .certificado-footer {
            margin-top: 50px;
            padding-top: 30px;
            border-top: 2px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .footer-info {
            font-size: 12px;
            color: #64748b;
        }
        
        .footer-data {
            font-size: 13px;
            color: #1a1a2e;
            font-weight: 600;
        }
        
        .assinatura {
            text-align: center;
            margin-top: 40px;
        }
        
        .assinatura-linha {
            width: 300px;
            border-top: 2px solid #1a1a2e;
            margin: 0 auto 10px;
        }
        
        .assinatura-texto {
            font-size: 13px;
            color: #64748b;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        @media print {
            body {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="certificado-header">
        <img src="https://www.image2url.com/r2/default/images/1777093024202-b764b621-3e6f-4b89-b838-ca9fd5e06ab4.png" alt="Eco Pneus" class="logo">
        <h1 class="certificado-titulo">Certificado de Destinação Sustentável</h1>
        <p class="certificado-subtitulo">Logística Reversa de Pneus</p>
    </div>

    <div class="certificado-info">
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Certificado para</span>
                <span class="info-value">${nomeUsuario}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Nível Sustentável</span>
                <span class="nivel-badge">${nivel.nivel}</span>
            </div>
            <div class="info-item">
                <span class="info-label">E-mail</span>
                <span class="info-value">${email}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Telefone</span>
                <span class="info-value">${telefone}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Tipo de Empresa</span>
                <span class="info-value">${tipoEmpresa}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Endereço</span>
                <span class="info-value">${endereco}</span>
            </div>
        </div>
    </div>

    <div class="coletas-section">
        <h2 class="section-title">Coletas Concluídas (${coletas.length})</h2>
        <table class="coletas-table">
            <thead>
                <tr>
                    <th>Código</th>
                    <th>Data</th>
                    <th>Qtd. Pneus</th>
                    <th>Material</th>
                    <th>Local</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${tabelaColetasHTML}
            </tbody>
        </table>
    </div>

    <div class="resumo-section">
        <h2 class="section-title">Impacto Ambiental Total</h2>
        <div class="resumo-grid">
            <div class="resumo-item">
                <div class="resumo-valor">${resumo.totalPneus.toLocaleString('pt-BR')}</div>
                <div class="resumo-label">Pneus Reciclados</div>
            </div>
            <div class="resumo-item">
                <div class="resumo-valor">${resumo.totalCO2} t</div>
                <div class="resumo-label">CO₂ Evitado</div>
            </div>
            <div class="resumo-item">
                <div class="resumo-valor">${resumo.totalAgua} L</div>
                <div class="resumo-label">Água Economizada</div>
            </div>
            <div class="resumo-item">
                <div class="resumo-valor">${resumo.totalAterro} t</div>
                <div class="resumo-label">Aterro Evitado</div>
            </div>
        </div>
    </div>

    <div class="assinatura">
        <div class="assinatura-linha"></div>
        <div class="assinatura-texto">Eco Pneus - Sistema de Logística Reversa</div>
        <div class="assinatura-texto">Certificado emitido em ${dataEmissaoFormatada}</div>
    </div>

    <div class="certificado-footer">
        <div class="footer-info">
            <p>Eco Pneus © ${new Date().getFullYear()} - Todos os direitos reservados</p>
            <p>Documento gerado eletronicamente</p>
        </div>
        <div class="footer-data">
            <p>Emitido em: ${dataEmissaoFormatada}</p>
        </div>
    </div>
</body>
</html>
    `;
}

/**
 * Inicializa o sistema de certificados
 */
async function initCertificados(user) {
    if (!user) {
        CertificadosState.error = 'Usuário não autenticado';
        return false;
    }

    CertificadosState.usuario = user;
    CertificadosState.isLoading = true;
    CertificadosState.error = null;

    try {
        // Busca dados do usuário no Firestore
        CertificadosState.userData = await buscarDadosUsuario(user.uid);
        
        // Busca todas as coletas concluídas do usuário
        CertificadosState.coletas = await buscarColetasConcluidas(user.uid);
        
        CertificadosState.isLoading = false;
        CertificadosState.isReady = true;
        return true;
    } catch (error) {
        console.error('Erro ao iniciar certificados:', error);
        CertificadosState.error = error.message;
        CertificadosState.isLoading = false;
        return false;
    }
}

/**
 * Gera e exibe o PDF do certificado
 */
async function gerarPDFCertificado() {
    // Verifica se há usuário autenticado
    const user = auth?.currentUser;
    if (!user) {
        throw new Error('Usuário não autenticado. Faça login para gerar o certificado.');
    }

    // Inicializa se necessário
    if (!CertificadosState.isReady && !CertificadosState.isLoading) {
        await initCertificados(user);
    }

    // Verifica se há coletas
    if (!CertificadosState.coletas || CertificadosState.coletas.length === 0) {
        throw new Error('Nenhuma coleta concluída encontrada para este usuário.');
    }

    // Calcula resumo e nível
    const resumo = calcularResumoAmbiental(CertificadosState.coletas);
    const nivel = calcularNivelSustentavel(resumo);
    const dataEmissao = new Date();

    // Gera HTML
    const html = gerarHTMLCertificado({
        usuario: user,
        userData: CertificadosState.userData,
        coletas: CertificadosState.coletas,
        resumo,
        nivel,
        dataEmissao
    });

    // Cria blob e abre em nova janela para impressão
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const novaJanela = window.open(url, '_blank');

    if (!novaJanela) {
        throw new Error('Não foi possível abrir a janela de impressão. Verifique os bloqueadores de popup.');
    }

    // Aguarda carregamento e imprime
    novaJanela.onload = () => {
        setTimeout(() => {
            novaJanela.print();
        }, 500);
    };

    return { 
        success: true, 
        coletasCount: CertificadosState.coletas.length, 
        resumo,
        nivel
    };
}

/**
 * Função completa que inicializa e gera o PDF em uma única chamada
 */
async function gerarCertificadoCompleto() {
    const user = auth?.currentUser;
    
    if (!user) {
        return {
            success: false,
            error: 'Usuário não autenticado'
        };
    }

    try {
        CertificadosState.isLoading = true;
        CertificadosState.error = null;

        // Inicializa e busca dados
        const initialized = await initCertificados(user);
        
        if (!initialized) {
            throw new Error(CertificadosState.error || 'Falha ao inicializar');
        }

        // Gera o PDF
        const result = await gerarPDFCertificado();
        
        CertificadosState.isLoading = false;
        return result;
    } catch (error) {
        console.error('Erro ao gerar certificado:', error);
        CertificadosState.isLoading = false;
        CertificadosState.error = error.message;
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Atualiza os dados em tempo real
 */
function iniciarAtualizacaoTempoReal(uid, callback) {
    if (CertificadosState.unsubscribe) {
        CertificadosState.unsubscribe();
    }

    CertificadosState.unsubscribe = ouvirColetasEmTempoReal(uid, (coletas) => {
        CertificadosState.coletas = coletas;
        if (typeof callback === 'function') {
            callback(coletas);
        }
    });
}

/**
 * Para a atualização em tempo real
 */
function pararAtualizacaoTempoReal() {
    if (CertificadosState.unsubscribe) {
        CertificadosState.unsubscribe();
        CertificadosState.unsubscribe = null;
    }
}

// ============================================================
// INTEGRAÇÃO COM O SISTEMA EXISTENTE
// ============================================================

/**
 * Verifica se o Firebase está disponível
 */
function verificarFirebaseDisponivel() {
    if (!app || !db || !auth) {
        console.error('Firebase não inicializado corretamente');
        return false;
    }
    return true;
}

/**
 * Obtém o estado atual do sistema
 */
function getEstado() {
    return {
        isLoading: CertificadosState.isLoading,
        isReady: CertificadosState.isReady,
        error: CertificadosState.error,
        coletasCount: CertificadosState.coletas?.length || 0,
        totalPneus: CertificadosState.coletas?.reduce((acc, c) => acc + getQuantidade(c), 0) || 0
    };
}

/**
 * Exporta funções para uso global
 */
window.CertificadosEcoPneus = {
    // Inicialização
    init: initCertificados,
    
    // Geração de PDF
    gerarPDF: gerarPDFCertificado,
    gerarCertificadoCompleto: gerarCertificadoCompleto,
    
    // Dados
    getEstado: getEstado,
    getColetas: () => CertificadosState.coletas,
    getUsuario: () => CertificadosState.usuario,
    getUserData: () => CertificadosState.userData,
    
    // Tempo real
    ouvirEmTempoReal: ouvirColetasEmTempoReal,
    iniciarAtualizacaoTempoReal: iniciarAtualizacaoTempoReal,
    pararAtualizacaoTempoReal: pararAtualizacaoTempoReal,
    
    // Estado
    state: CertificadosState,
    
    // Firebase
    verificarFirebase: verificarFirebaseDisponivel,
    
    // Utilitários
    calcularResumoAmbiental: calcularResumoAmbiental,
    calcularNivelSustentavel: calcularNivelSustentavel
};

// ============================================================
// AUTO-INICIALIZAÇÃO (opcional)
// ============================================================

/**
 * Inicializa automaticamente quando o DOM estiver pronto
 * e houver um usuário autenticado
 */
document.addEventListener('DOMContentLoaded', async () => {
    if (!verificarFirebaseDisponivel()) {
        console.warn('Firebase não disponível para certificados');
        return;
    }

    // Ouve mudanças de autenticação
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Usuário autenticado - inicializa certificados
            await initCertificados(user);
            
            // Inicia listener em tempo real
            iniciarAtualizacaoTempoReal(user.uid, (coletas) => {
                console.log('Coletas atualizadas:', coletas.length);
            });
        } else {
            // Usuário deslogado - limpa estado
            CertificadosState.usuario = null;
            CertificadosState.userData = null;
            CertificadosState.coletas = [];
            CertificadosState.isReady = false;
            pararAtualizacaoTempoReal();
        }
    });
});

console.log('Certificados Eco Pneus carregado - Sistema corrigido com Firebase Modular v10+');