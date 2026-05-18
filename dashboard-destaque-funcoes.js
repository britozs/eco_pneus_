/**
 * ============================================================
 * ECO PNEUS - Funções JavaScript para dashboard.html
 * ============================================================
 * 
 * Este arquivo contém as funções JavaScript limpas e comentadas
 * para implementação da seção "Empresas em Destaque" no Dashboard:
 * 
 * - Query para buscar as 3 empresas com maior nota média
 * - Uso de orderBy('notaMedia', 'desc') + limit(3)
 * - Renderização dos cards de empresas destacadas
 * 
 * ============================================================
 */

// ============================================================
// 1. QUERY - TOP 3 EMPRESAS POR NOTA MÉDIA
// ============================================================

/**
 * Busca as 3 empresas/parceiros com a maior nota média no Firestore.
 * Inclui tanto a coleção 'parceiros' quanto usuários com conta de empresa ('usuarios').
 * 
 * Usa os operadores do Firestore:
 * - orderBy('notaMedia', 'desc') para ordenar pela maior nota
 * - limit(3) para retornar apenas os 3 primeiros
 * 
 * IMPORTANTE: Esta query requer um índice composto no Firestore.
 * Se o índice não existir, o Firestore fornecerá um link para criá-lo.
 * 
 * @returns {Promise<Array>} Lista das 3 empresas melhor avaliadas
 */
async function buscarTop3EmpresasDestaque() {
    if (typeof db === 'undefined') {
        console.warn('Firestore não disponível');
        return [];
    }

    try {
        // Busca parceiros da coleção 'parceiros'
        const parceirosSnapshot = await db.collection('parceiros')
            .orderBy('notaMedia', 'desc')
            .limit(5)  // Busca mais para combinar com usuários
            .get();

        // Busca usuários com conta de empresa da coleção 'usuarios'
        const usuariosSnapshot = await db.collection('usuarios')
            .where('tipo', '==', 'empresa')
            .get();

        const empresasMap = new Map();
        
        // Processa parceiros
        parceirosSnapshot.forEach(doc => {
            const dados = doc.data() || {};
            const notaMedia = Number(dados.notaMedia || dados.rating || 0);
            // Só inclui se tiver nota > 0
            if (notaMedia > 0) {
                empresasMap.set('parceiro_' + doc.id, {
                    id: doc.id,
                    origem: 'parceiro',
                    nome: dados.nome || dados.razaoSocial || 'Empresa',
                    notaMedia: notaMedia,
                    totalAvaliacoes: Number(dados.totalAvaliacoes || dados.avaliacoes || 0),
                    categoria: dados.categoria || dados.tipoEmpresa || 'empresa',
                    cidade: dados.cidade || '—',
                    imagem: dados.imagem || dados.fotoUrl || '',
                    verificado: dados.verificado || false,
                    tags: dados.tags || [],
                    whatsapp: dados.whatsapp || dados.telefone || '',
                    email: dados.email || ''
                });
            }
        });

        // Processa usuários com conta de empresa
        usuariosSnapshot.forEach(doc => {
            const dados = doc.data() || {};
            const notaMedia = Number(dados.notaMedia || dados.rating || dados.avaliacaoMedia || 0);
            const totalAvaliacoes = Number(dados.totalAvaliacoes || dados.avaliacoes || dados.numAvaliacoes || 0);
            
            // Só inclui se tiver nota > 0
            if (notaMedia > 0) {
                empresasMap.set('usuario_' + doc.id, {
                    id: doc.id,
                    origem: 'usuario',
                    nome: dados.razaoSocial || dados.nome || 'Empresa',
                    notaMedia: notaMedia,
                    totalAvaliacoes: totalAvaliacoes,
                    categoria: dados.tipoEmpresa || 'empresa',
                    cidade: (dados.endereco && dados.endereco.cidade) || dados.cidade || '—',
                    imagem: dados.fotoPerfilUrl || dados.perfilFotoDataUrl || '',
                    verificado: dados.verificado || false,
                    tags: [],
                    whatsapp: dados.whatsapp || dados.telefone || '',
                    email: dados.email || ''
                });
            }
        });

        // Converte para array e ordena por nota média
        const empresas = Array.from(empresasMap.values());
        empresas.sort((a, b) => b.notaMedia - a.notaMedia);

        // Retorna apenas as top 3
        const top3 = empresas.slice(0, 3);
        console.log(`Top 3 empresas carregadas: ${top3.length} (de ${empresas.length} total)`);
        
        return top3;

    } catch (error) {
        // Se falhar por falta de índice, tenta fallback com limit + ordenação manual
        console.warn('Query com orderBy falhou (possível falta de índice):', error.message);
        
        if (error.code === 'failed-precondition' || error.message.includes('index')) {
            console.log('Tentando fallback sem orderBy...');
            return await buscarTop3EmpresasFallback();
        }
        
        console.error('Erro ao buscar empresas destaque:', error);
        return [];
    }
}

/**
 * Fallback para quando o índice do Firestore não existe.
 * Busca empresas das coleções 'parceiros' e 'usuarios' (tipo=empresa) e ordena localmente.
 * 
 * @returns {Promise<Array>} Lista das 3 empresas melhor avaliadas
 */
async function buscarTop3EmpresasFallback() {
    try {
        const empresasMap = new Map();
        
        // Busca parceiros (limita a 50 para ordenação local)
        const parceirosSnapshot = await db.collection('parceiros')
            .limit(50)
            .get();

        parceirosSnapshot.forEach(doc => {
            const dados = doc.data() || {};
            const notaMedia = Number(dados.notaMedia || dados.rating || 0);
            if (notaMedia > 0) {
                empresasMap.set('parceiro_' + doc.id, {
                    id: doc.id,
                    origem: 'parceiro',
                    nome: dados.nome || dados.razaoSocial || 'Empresa',
                    notaMedia: notaMedia,
                    totalAvaliacoes: Number(dados.totalAvaliacoes || dados.avaliacoes || 0),
                    categoria: dados.categoria || dados.tipoEmpresa || 'empresa',
                    cidade: dados.cidade || '—',
                    imagem: dados.imagem || dados.fotoUrl || '',
                    verificado: dados.verificado || false,
                    tags: dados.tags || [],
                    whatsapp: dados.whatsapp || dados.telefone || '',
                    email: dados.email || ''
                });
            }
        });

        // Busca usuários com conta de empresa
        const usuariosSnapshot = await db.collection('usuarios')
            .where('tipo', '==', 'empresa')
            .get();

        usuariosSnapshot.forEach(doc => {
            const dados = doc.data() || {};
            const notaMedia = Number(dados.notaMedia || dados.rating || dados.avaliacaoMedia || 0);
            const totalAvaliacoes = Number(dados.totalAvaliacoes || dados.avaliacoes || dados.numAvaliacoes || 0);
            
            if (notaMedia > 0) {
                empresasMap.set('usuario_' + doc.id, {
                    id: doc.id,
                    origem: 'usuario',
                    nome: dados.razaoSocial || dados.nome || 'Empresa',
                    notaMedia: notaMedia,
                    totalAvaliacoes: totalAvaliacoes,
                    categoria: dados.tipoEmpresa || 'empresa',
                    cidade: (dados.endereco && dados.endereco.cidade) || dados.cidade || '—',
                    imagem: dados.fotoPerfilUrl || dados.perfilFotoDataUrl || '',
                    verificado: dados.verificado || false,
                    tags: [],
                    whatsapp: dados.whatsapp || dados.telefone || '',
                    email: dados.email || ''
                });
            }
        });

        // Converte para array e ordena por nota média
        const empresas = Array.from(empresasMap.values());
        empresas.sort((a, b) => b.notaMedia - a.notaMedia);

        console.log(`Fallback: ${empresas.length} empresas encontradas`);
        
        // Retorna apenas as top 3
        return empresas.slice(0, 3);

    } catch (error) {
        console.error('Erro no fallback:', error);
        return [];
    }
}

/**
 * Listener em tempo real para as empresas em destaque.
 * Sempre que as avaliações mudarem, a lista é atualizada.
 * 
 * @param {Function} callback - Função chamada quando os dados mudam
 * @returns {Function} Função unsubscribe para cancelar o listener
 */
function ouvirTop3EmpresasDestaque(callback) {
    if (typeof db === 'undefined') {
        console.warn('Firestore não disponível');
        return null;
    }

    try {
        // Listener em tempo real na coleção parceiros
        const unsubscribe = db.collection('parceiros')
            .orderBy('notaMedia', 'desc')
            .limit(3)
            .onSnapshot(
                // Callback de sucesso
                (snapshot) => {
                    const empresas = [];
                    
                    snapshot.forEach(doc => {
                        const dados = doc.data() || {};
                        empresas.push({
                            id: doc.id,
                            ...dados,
                            notaMedia: Number(dados.notaMedia || dados.rating || 0),
                            totalAvaliacoes: Number(dados.totalAvaliacoes || dados.avaliacoes || 0)
                        });
                    });

                    if (typeof callback === 'function') {
                        callback(empresas);
                    }
                },
                
                // Callback de erro
                (error) => {
                    console.error('Erro no listener de empresas destaque:', error);
                    
                    // Tenta fallback
                    if (error.code === 'failed-precondition') {
                        console.log('Usando polling como fallback...');
                        iniciarPollingEmpresasDestaque(callback, 30000); // Atualiza a cada 30s
                    }
                }
            );

        return unsubscribe;

    } catch (error) {
        console.error('Falha ao iniciar listener:', error);
        return null;
    }
}

/**
 * Fallback usando polling (consultas periódicas) quando WebSocket não está disponível.
 * 
 * @param {Function} callback - Função chamada quando os dados mudam
 * @param {number} intervalo - Intervalo em milissegundos (padrão: 30000)
 */
function iniciarPollingEmpresasDestaque(callback, intervalo = 30000) {
    // Executa imediatamente
    buscarTop3EmpresasDestaque().then(callback);
    
    // Agenda execuções periódicas
    const intervalId = setInterval(() => {
        buscarTop3EmpresasDestaque().then(callback);
    }, intervalo);

    // Retorna função para cancelar o polling
    return () => clearInterval(intervalId);
}


// ============================================================
// 2. RENDERIZAÇÃO DOS CARDS DE EMPRESAS
// ============================================================

/**
 * Gera o HTML para um card de empresa em destaque.
 * 
 * @param {Object} empresa - Dados da empresa
 * @returns {string} HTML do card
 */
function renderizarCardEmpresaDestaque(empresa) {
    if (!empresa) return '';

    const nome = empresa.nome || 'Empresa';
    const notaMedia = Number(empresa.notaMedia || empresa.rating || 0).toFixed(1);
    const totalAvaliacoes = empresa.totalAvaliacoes || empresa.avaliacoes || 0;
    const categoria = empresa.categoria || 'recicladora';
    const cidade = empresa.cidade || '—';
    const imagem = empresa.imagem || `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=0b6b3a&color=fff&size=160`;
    const verificado = empresa.verificado || false;
    const tags = empresa.tags || [];

    // Mapeia categoria para label amigável
    const labelsCategoria = {
        'recicladora': 'Recicladora',
        'transportadora': 'Transportadora',
        'ponto-coleta': 'Ponto de Coleta'
    };
    const labelCategoria = labelsCategoria[categoria.toLowerCase()] || 'Parceiro';

    // Gera estrelas visuais
    const estrelasHtml = gerarEstrelasHTML(Number(empresa.notaMedia || empresa.rating || 0));

    // Gera tags HTML
    const tagsHtml = tags.slice(0, 3).map(tag => 
        `<span class="empresa-tag">${tag}</span>`
    ).join('');

    return `
        <div class="empresa-card-destaque" data-empresa-id="${empresa.id}">
            <div class="empresa-header">
                <img class="empresa-avatar-destaque" 
                     src="${escapeHtmlAttribute(imagem)}" 
                     alt="${escapeHtml(nome)}"
                     loading="lazy">
                <div class="empresa-info">
                    <h4 class="empresa-nome-destaque">
                        ${escapeHtml(nome)}
                        ${verificado ? '<span class="badge-verificado">✓ Verificado</span>' : ''}
                    </h4>
                    <span class="empresa-categoria">${labelCategoria}</span>
                </div>
            </div>

            <div class="empresa-avaliacao">
                <div class="estrelas">${estrelasHtml}</div>
                <span class="nota-texto">${notaMedia}</span>
                <span class="avaliacoes-texto">(${totalAvaliacoes} avaliações)</span>
            </div>

            <div class="empresa-localizacao">
                <span>📍 ${escapeHtml(cidade)}</span>
                ${empresa.distancia ? `<span>📏 ${empresa.distancia} km</span>` : ''}
            </div>

            ${tagsHtml ? `<div class="empresa-tags-destaque">${tagsHtml}</div>` : ''}

            <div class="empresa-acoes-destaque">
                <button class="btn-contato-destaque" onclick="contatarEmpresa('${escapeJs(empresa.id)}')">
                    📞 Contato
                </button>
                <button class="btn-whatsapp-destaque" onclick="whatsappEmpresa('${escapeJs(empresa.whatsapp || empresa.telefone || '')}')">
                    💬 WhatsApp
                </button>
                <button class="btn-avaliar-destaque" onclick="avaliarEmpresa('${escapeJs(empresa.id)}', '${escapeJs(nome)}')">
                    ⭐ Avaliar
                </button>
            </div>
        </div>
    `;
}

/**
 * Gera HTML de estrelas baseado na nota média
 * 
 * @param {number} nota - Nota de 0 a 5
 * @returns {string} HTML das estrelas
 */
function gerarEstrelasHTML(nota) {
    let html = '';
    const notaArredondada = Math.round(nota);
    
    for (let i = 1; i <= 5; i++) {
        if (i <= notaArredondada) {
            html += '<span class="estrela-cheia">★</span>';
        } else {
            html += '<span class="estrela-vazia">☆</span>';
        }
    }
    
    return html;
}

/**
 * Renderiza a seção de empresas em destaque no dashboard.
 * Substitui o placeholder "Nenhum parceiro cadastrado" pelos cards reais.
 * 
 * @param {Array} empresas - Lista de empresas para renderizar
 * @param {string} containerId - ID do elemento container (padrão: 'dash-empresas')
 */
function renderizarEmpresasDestaque(empresas, containerId = 'dash-empresas') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Container ${containerId} não encontrado`);
        return;
    }

    if (!empresas || empresas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🏢</div>
                <h3>Nenhum parceiro cadastrado</h3>
                <p>Os parceiros da rede aparecerão aqui após o cadastro.</p>
            </div>
        `;
        return;
    }

    // Gera HTML para todas as empresas
    const html = `
        <div class="empresas-grid-destaque">
            ${empresas.map(empresa => renderizarCardEmpresaDestaque(empresa)).join('')}
        </div>
    `;

    container.innerHTML = html;

    // Recria ícones do Lucide se necessário
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/**
 * Carrega e renderiza as empresas em destaque.
 * Função principal para ser chamada no dashboard.
 * 
 * @param {string} containerId - ID do container (opcional)
 */
async function carregarEmpresasEmDestaque(containerId = 'dash-empresas') {
    try {
        const empresas = await buscarTop3EmpresasDestaque();
        renderizarEmpresasDestaque(empresas, containerId);
        return empresas;
    } catch (error) {
        console.error('Erro ao carregar empresas destaque:', error);
        
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <h3>Erro ao carregar empresas</h3>
                    <p>Tente novamente em instantes.</p>
                </div>
            `;
        }
        return [];
    }
}


// ============================================================
// 3. FUNÇÕES DE AÇÃO (CONTATO, WHATSAPP, AVALIAR)
// ============================================================

/**
 * Abre modal/ação de contato para uma empresa
 * 
 * @param {string} empresaId - ID da empresa
 */
function contatarEmpresa(empresaId) {
    console.log('Contatar empresa:', empresaId);
    // Implementar lógica de contato (modal, email, etc.)
    showToast('Funcionalidade de contato em desenvolvimento');
}

/**
 * Abre WhatsApp da empresa
 * 
 * @param {string} telefone - Número de telefone
 */
function whatsappEmpresa(telefone) {
    if (!telefone) {
        showToast('Telefone não disponível', 'error');
        return;
    }

    const numero = String(telefone).replace(/\D/g, '');
    const numeroBR = numero.startsWith('55') ? numero : `55${numero}`;
    const mensagem = encodeURIComponent('Olá! Vi seu perfil no Eco Pneus e gostaria de saber mais.');

    window.open(`https://wa.me/${numeroBR}?text=${mensagem}`, '_blank');
}

/**
 * Abre modal de avaliação para uma empresa
 * 
 * @param {string} empresaId - ID da empresa
 * @param {string} nome - Nome da empresa
 */
function avaliarEmpresa(empresaId, nome) {
    console.log('Avaliar empresa:', empresaId, nome);
    // Implementar modal de avaliação
    showToast('Funcionalidade de avaliação em desenvolvimento');
}


// ============================================================
// 4. UTILITÁRIOS
// ============================================================

/**
 * Escapa caracteres HTML para prevenir XSS
 * 
 * @param {string} text - Texto para escapar
 * @returns {string} Texto escapado
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Escapa caracteres para uso em atributos HTML
 * 
 * @param {string} text - Texto para escapar
 * @returns {string} Texto escapado
 */
function escapeHtmlAttribute(text) {
    return String(text).replace(/"/g, '"').replace(/'/g, '&#39;');
}

/**
 * Escapa texto para uso em strings JavaScript inline
 * 
 * @param {string} text - Texto para escapar
 * @returns {string} Texto escapado
 */
function escapeJs(text) {
    return String(text)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"');
}

/**
 * Exibe notificação toast
 * 
 * @param {string} message - Mensagem
 * @param {string} type - Tipo: 'success' ou 'error'
 */
function showToast(message, type = 'success') {
    // Verifica se existe container de toast
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.getElementById('toast-stack');
    }
    
    if (!container) {
        // Cria container se não existir
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        padding: 12px 20px;
        margin-top: 10px;
        border-radius: 8px;
        background: ${type === 'error' ? '#dc3545' : '#28a745'};
        color: white;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-8px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}


// ============================================================
// 5. INICIALIZAÇÃO
// ============================================================

/**
 * Inicializa a seção de empresas em destaque no dashboard.
 * Deve ser chamada após o DOM estar pronto.
 */
async function iniciarEmpresasDestaque() {
    // Carrega empresas iniciais
    await carregarEmpresasEmDestaque();

    // Opcional: Inicia listener em tempo real para atualizações
    // ouvirTop3EmpresasDestaque((empresas) => {
    //     renderizarEmpresasDestaque(empresas);
    // });
}

// Inicializa quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Verifica se está na página de dashboard
    if (document.getElementById('dash-empresas')) {
        iniciarEmpresasDestaque();
    }
});