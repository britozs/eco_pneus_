/**
 * ============================================================
 * ECO PNEUS - Funções JavaScript para empresas.html
 * ============================================================
 * 
 * Este arquivo contém as funções JavaScript limpas e comentadas
 * para implementação das funcionalidades da tela de Empresas:
 * 
 * 1. Listener em tempo real na coleção /parceiros/
 * 2. Geocodificação de endereços via Nominatim/OpenStreetMap
 * 3. Marcadores dinâmicos no mapa Leaflet
 * 4. Sistema de avaliações com salvamento no Firestore
 * 
 * ============================================================
 */

// ============================================================
// CONFIGURAÇÃO E ESTADO GLOBAL
// ============================================================

/**
 * Cache para resultados de geocodificação (evita chamadas repetidas à API)
 * @type {Map<string, [number, number]>}
 */
const cidadeGeocodeCache = new Map();

/**
 * Coordenadas obtidas via geocodificação para parceiros sem lat/lng no Firestore
 * @type {Object<string, [number, number]>}
 */
const coordOverrides = {};

/**
 * Estado do filtro ativo na página
 * @type {string}
 */
let activeFilterMode = 'todas';

/**
 * ID do parceiro sendo avaliado no modal atual
 * @type {string|null}
 */
let activeReviewCompanyId = null;

/**
 * Nota selecionada no modal de avaliação (1-5)
 * @type {number}
 */
let activeReviewStars = 0;

/**
 * Instância do mapa Leaflet
 * @type {L.Map|null}
 */
let mapInstance = null;

/**
 * Camada de marcadores do mapa
 * @type {L.LayerGroup|null}
 */
let partnerMarkersLayer = null;

/**
 * Lista de parceiros carregada do Firestore
 * @type {Array}
 */
let PARCEIROS = [];

/**
 * unsubscribe do listener em tempo real dos parceiros
 * @type {Function|null}
 */
let unsubParceirosFs = null;


// ============================================================
// 1. LISTENER EM TEMPO REAL - COLEÇÃO /parceiros/
// ============================================================

/**
 * Inicia o listener em tempo real na coleção 'parceiros' do Firestore.
 * Sempre que um documento for adicionado, modificado ou removido,
 * a interface será atualizada automaticamente.
 * 
 * @param {Function} onUpdate - Callback executado quando os dados forem atualizados
 * @returns {Function} Função para cancelar o listener (unsubscribe)
 */
function iniciarListenerParceirosTempoReal(onUpdate) {
    if (typeof db === 'undefined') {
        console.warn('Firestore não disponível - usando dados locais');
        return null;
    }

    // Cancela listener anterior se existir
    if (unsubParceirosFs) {
        try { unsubParceirosFs(); } catch (e) {}
        unsubParceirosFs = null;
    }

    try {
        // onSnapshot é o listener em tempo real do Firestore
        unsubParceirosFs = db.collection('parceiros').onSnapshot(
            // Callback de sucesso - executado sempre que houver mudança
            function(snapshot) {
                PARCEIROS = [];
                
                snapshot.forEach(function(doc) {
                    const dados = doc.data() || {};
                    // Adiciona o ID do documento aos dados
                    PARCEIROS.push(Object.assign({ id: doc.id }, dados));
                });

                // Garante que rating e avaliacoes sejam números
                PARCEIROS.forEach(function(p) {
                    p.rating = Number.isFinite(Number(p.rating)) ? Number(p.rating) : 0;
                    p.avaliacoes = Number.isFinite(Number(p.avaliacoes)) ? Number(p.avaliacoes) : 0;
                });

                console.log(`Parceiros atualizados: ${PARCEIROS.length} empresas`);
                
                // Executa o callback de atualização
                if (typeof onUpdate === 'function') {
                    onUpdate(PARCEIROS);
                }
            },
            
            // Callback de erro
            function(error) {
                console.error('Erro no listener de parceiros:', error);
            }
        );

        return unsubParceirosFs;
        
    } catch (error) {
        console.error('Falha ao iniciar listener:', error);
        return null;
    }
}

/**
 * Para o listener em tempo real dos parceiros
 */
function pararListenerParceiros() {
    if (unsubParceirosFs) {
        try { unsubParceirosFs(); } catch (e) {}
        unsubParceirosFs = null;
    }
}


// ============================================================
// 2. GEOCODIFICAÇÃO - API NOMINATIM/OPENSTREETMAP
// ============================================================

/**
 * Constrói uma string de endereço completa a partir dos dados do parceiro
 * para uso na busca de geocodificação.
 * 
 * @param {Object} parceiro - Dados do parceiro
 * @returns {string} Endereço formatado para busca
 */
function enderecoParceiroParaBusca(parceiro) {
    if (!parceiro) return '';
    
    const partes = [];
    // Campos possíveis de endereço (ordem de prioridade)
    const camposEndereco = [
        'endereco', 'logradouro', 'rua', 'numero', 'bairro', 
        'cidade', 'municipio', 'estado', 'cep'
    ];
    
    camposEndereco.forEach(function(campo) {
        const valor = parceiro[campo];
        if (valor !== undefined && valor !== null && String(valor).trim() !== '') {
            partes.push(String(valor).trim());
        }
    });
    
    // Adiciona "Brasil" no final para melhorar a precisão
    return partes.length ? partes.join(', ') + ', Brasil' : '';
}

/**
 * Obtém coordenadas (latitude, longitude) de um endereço usando a API
 * gratuita do Nominatim (OpenStreetMap).
 * 
 * @param {string} endereco - Endereço completo para geocodificação
 * @returns {Promise<[number, number]|null>} Coordenadas [lat, lng] ou null
 */
async function geocodificarEndereco(endereco) {
    // Validações básicas
    if (!endereco || endereco.length < 3 || typeof fetch === 'undefined') {
        return null;
    }
    
    const chaveCache = endereco.toLowerCase().trim();
    
    // Verifica se já temos o resultado em cache
    if (cidadeGeocodeCache.has(chaveCache)) {
        return cidadeGeocodeCache.get(chaveCache);
    }
    
    try {
        // Monta a URL da API Nominatim
        // Importante: Enviar Accept-Language para resultados em português
        const url = 'https://nominatim.openstreetmap.org/search?' + 
                   'format=json&limit=1&q=' + 
                   encodeURIComponent(endereco);
        
        const resposta = await fetch(url, {
            headers: { 
                'Accept-Language': 'pt-BR,pt;q=0.9' 
            }
        });
        
        if (!resposta.ok) {
            cidadeGeocodeCache.set(chaveCache, null);
            return null;
        }
        
        const json = await resposta.json();
        
        if (!json || !json.length) {
            cidadeGeocodeCache.set(chaveCache, null);
            return null;
        }
        
        // Extrai latitude e longitude do primeiro resultado
        const lat = parseFloat(json[0].lat);
        const lng = parseFloat(json[0].lon);
        
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            cidadeGeocodeCache.set(chaveCache, null);
            return null;
        }
        
        const coordenadas = [lat, lng];
        cidadeGeocodeCache.set(chaveCache, coordenadas);
        
        return coordenadas;
        
    } catch (error) {
        console.warn('Erro na geocodificação:', error);
        return null;
    }
}

/**
 * Processa todos os parceiros que não possuem coordenadas no Firestore
 * e tenta obter as coordenadas via geocodificação do endereço.
 * 
 * @param {Array} parceiros - Lista de parceiros para processar
 */
async function hidratarCoordenadasDosParceiros(parceiros) {
    const lista = parceiros || PARCEIROS;
    
    for (let i = 0; i < lista.length; i++) {
        const parceiro = lista[i];
        
        // Pula se já tiver coordenadas no Firestore ou se já foi geocodificado
        if (!parceiro || !parceiro.id) continue;
        if (coordOverrides[parceiro.id]) continue;
        if (parceiro.latitude && parceiro.longitude) continue;
        
        // Obtém endereço formatado
        const endereco = enderecoParceiroParaBusca(parceiro);
        if (!endereco) continue;
        
        // Geocodifica o endereço
        const coordenadas = await geocodificarEndereco(endereco);
        
        if (coordenadas) {
            coordOverrides[parceiro.id] = coordenadas;
            console.log(`Geocodificado: ${parceiro.nome} -> ${coordenadas}`);
        }
        
        // Respeita o rate limit da API Nominatim (1 requisição por segundo)
        await new Promise(resolve => setTimeout(resolve, 1100));
    }
    
    // Atualiza os marcadores no mapa após geocodificar
    atualizarMarcadoresMapa();
}


// ============================================================
// 3. MARCADORES NO MAPA LEAFLET
// ============================================================

/**
 * Obtém as coordenadas de um parceiro, verificando:
 * 1. Coordenadas no Firestore (latitude/longitude)
 * 2. Coordenadas obtidas via geocodificação (coordOverrides)
 * 3. Coordenadas fallback (se disponíveis)
 * 
 * @param {Object} parceiro - Dados do parceiro
 * @param {Object} fallbacks - Objeto com coordenadas fallback por ID
 * @returns {[number, number]|null} Coordenadas ou null
 */
function obterCoordenadasParceiro(parceiro, fallbacks) {
    if (!parceiro) return null;
    
    // 1. Verifica coordenadas no Firestore
    const latFirestore = Number(parceiro.latitude);
    const lngFirestore = Number(parceiro.longitude);
    if (Number.isFinite(latFirestore) && Number.isFinite(lngFirestore)) {
        return [latFirestore, lngFirestore];
    }
    
    // 2. Verifica coordenadas obtidas via geocodificação
    const coordOverride = coordOverrides[parceiro.id];
    if (coordOverride && Number.isFinite(coordOverride[0]) && Number.isFinite(coordOverride[1])) {
        return coordOverride;
    }
    
    // 3. Verifica coordenadas fallback
    if (fallbacks && fallbacks[parceiro.id]) {
        return fallbacks[parceiro.id];
    }
    
    return null;
}

/**
 * Inicializa o mapa Leaflet no elemento especificado.
 * 
 * @param {string} elementId - ID do elemento HTML onde o mapa será renderizado
 * @returns {L.Map} Instância do mapa
 */
function inicializarMapa(elementId) {
    const mapEl = document.getElementById(elementId);
    
    if (!mapEl || typeof L === 'undefined') {
        console.error('Elemento do mapa ou Leaflet não encontrado');
        return null;
    }
    
    // Cria o mapa centralizado no Brasil
    mapInstance = L.map(elementId, {
        zoomControl: true,
        scrollWheelZoom: false  // Evita scroll acidental
    }).setView([-14.235, -51.9253], 4);
    
    // Adiciona camada de tiles do OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(mapInstance);
    
    // Cria camada para os marcadores
    partnerMarkersLayer = L.layerGroup().addTo(mapInstance);
    
    // Invalida o tamanho do mapa após renderização
    setTimeout(() => {
        mapInstance.invalidateSize();
    }, 200);
    
    return mapInstance;
}

/**
 * Atualiza/refresh os marcadores no mapa com base na lista atual de parceiros.
 * Remove marcadores antigos e adiciona novos com popups informativos.
 * 
 * @param {Array} parceiros - Lista de parceiros para exibir (padrão: PARCEIROS)
 */
function atualizarMarcadoresMapa(parceiros) {
    if (!mapInstance || !partnerMarkersLayer || typeof L === 'undefined') {
        return;
    }
    
    const lista = parceiros || PARCEIROS;
    
    // Limpa marcadores existentes
    partnerMarkersLayer.clearLayers();
    
    const limites = [];
    
    lista.forEach((parceiro) => {
        const coordenadas = obterCoordenadasParceiro(parceiro);
        
        if (!coordenadas) {
            return; // Pula parceiros sem coordenadas
        }
        
        limites.push(coordenadas);
        
        // Determina o tipo de marcador baseado na categoria
        const categoria = String(parceiro.categoria || '').toLowerCase();
        let classePin = 'eco-pin eco-pin--recicla';
        let tipoTexto = 'Recicladora';
        
        if (categoria === 'transportadora') {
            classePin = 'eco-pin eco-pin--transport';
            tipoTexto = 'Transportadora';
        } else if (categoria === 'ponto-coleta') {
            classePin = 'eco-pin eco-pin--gerador';
            tipoTexto = 'Ponto de Coleta';
        }
        
        // Cria ícone personalizado
        const icone = L.divIcon({
            className: 'eco-marker-wrap',
            html: `<div class="${classePin}" title="${String(parceiro.nome || '').replace(/"/g, '"')}"></div>`,
            iconSize: [34, 34],
            iconAnchor: [17, 34],
            popupAnchor: [0, -30]
        });
        
        // Cria conteúdo do popup
        const estrelas = Number(parceiro.rating || 0).toFixed(1);
        const conteudoPopup = `
            <div class="eco-map-popup">
                <strong>${String(parceiro.nome || '').replace(/</g, '<')}</strong>
                <div class="eco-map-popup-meta">${tipoTexto} · ⭐ ${estrelas}</div>
                <div class="eco-map-popup-addr">${String(parceiro.cidade || '').replace(/</g, '<')}</div>
                <button type="button" class="eco-map-popup-btn" data-parceiro-id="${String(parceiro.id).replace(/"/g, '')}">
                    Ver detalhes
                </button>
            </div>
        `;
        
        // Cria marcador com popup
        const marcador = L.marker(coordenadas, { icon })
            .bindPopup(conteudoPopup, { maxWidth: 260 });
        
        // Adiciona evento de clique no botão do popup
        marcador.on('popupopen', () => {
            const botao = marcador.getPopup().getElement()?.querySelector('[data-parceiro-id]');
            if (botao) {
                botao.onclick = () => {
                    // Rola até a lista de empresas e destaca o parceiro
                    document.getElementById('lista-completa')?.scrollIntoView({ 
                        behavior: 'smooth' 
                    });
                    mapInstance.closePopup();
                };
            }
        });
        
        partnerMarkersLayer.addLayer(marcador);
    });
    
    // Ajusta zoom para mostrar todos os marcadores
    if (limites.length === 0) {
        mapInstance.setView([-14.235, -51.9253], 4);
    } else if (limites.length === 1) {
        mapInstance.setView(limites[0], 11);
    } else {
        try {
            mapInstance.fitBounds(limites, { padding: [40, 40], maxZoom: 12 });
        } catch (e) {
            mapInstance.setView(limites[0], 6);
        }
    }
    
    // Atualiza legenda
    const legenda = document.getElementById('legend-total');
    if (legenda) {
        const n = limites.length;
        legenda.textContent = `${n} parceiro${n !== 1 ? 's' : ''} no mapa`;
    }
}


// ============================================================
// 4. SISTEMA DE AVALIAÇÕES
// ============================================================

/**
 * Abre o modal de avaliação para um parceiro específico.
 * 
 * @param {Object} parceiro - Dados do parceiro a ser avaliado
 */
function abrirModalAvaliacao(parceiro) {
    if (!parceiro) return;
    
    activeReviewCompanyId = parceiro.id;
    activeReviewStars = 0;
    
    // Atualiza nome da empresa no modal
    const nomeEl = document.getElementById('review-company-name');
    if (nomeEl) {
        nomeEl.textContent = parceiro.nome;
    }
    
    // Limpa comentário e estrelas
    const comentarioEl = document.getElementById('review-comment');
    if (comentarioEl) {
        comentarioEl.value = '';
    }
    
    // Reseta estrelas visuais
    document.querySelectorAll('#review-stars .star-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Abre o modal
    const modal = document.getElementById('modal-avaliar');
    if (modal) {
        modal.classList.add('active');
    }
    
    lucide.createIcons();
}

/**
 * Fecha o modal de avaliação
 */
function fecharModalAvaliacao() {
    const modal = document.getElementById('modal-avaliar');
    if (modal) {
        modal.classList.remove('active');
    }
    activeReviewCompanyId = null;
    activeReviewStars = 0;
}

/**
 * Configura os eventos de seleção de estrelas no modal de avaliação
 */
function configurarSelecaoEstrelas() {
    const botoesEstrela = document.querySelectorAll('#review-stars .star-btn');
    
    botoesEstrela.forEach(btn => {
        btn.addEventListener('click', () => {
            activeReviewStars = parseInt(btn.dataset.star);
            
            // Atualiza visual das estrelas
            botoesEstrela.forEach((b, index) => {
                b.classList.toggle('active', index < activeReviewStars);
            });
        });
    });
}

/**
 * Envia uma avaliação para o Firestore.
 * 
 * Estrutura do documento em /avaliacoes/:
 * - avaliadorId: ID do usuário que está avaliando
 * - parceiroId: ID da empresa avaliada
 * - nota: Número de 1 a 5
 * - comentario: Texto do comentário (opcional)
 * - timestamp: Data/hora do servidor
 * 
 * Após salvar, atualiza os campos notaMedia e totalAvaliacoes no documento do parceiro.
 */
async function enviarAvaliacao() {
    // Validações
    if (activeReviewStars === 0) {
        showToast('Selecione pelo menos 1 estrela', 'error');
        return;
    }
    
    if (!activeReviewCompanyId) {
        showToast('Parceiro inválido', 'error');
        return;
    }
    
    // Verifica se usuário está logado
    if (typeof auth === 'undefined' || !auth.currentUser) {
        showToast('Faça login para avaliar', 'error');
        return;
    }
    
    const comentario = document.getElementById('review-comment')?.value.trim() || '';
    const parceiroId = activeReviewCompanyId;
    const usuario = auth.currentUser;
    
    try {
        // Cria ID único para a avaliação (evita duplicatas por usuário)
        const docId = `${String(parceiroId).replace(/\//g, '_')}_${usuario.uid}`;
        
        // Salva avaliação na coleção /avaliacoes/
        await db.collection('avaliacoes').doc(docId).set(
            {
                avaliadorId: usuario.uid,
                parceiroId: String(parceiroId),
                nomeAvaliador: usuario.displayName || 'Usuário',
                nota: Math.min(5, Math.max(1, Number(activeReviewStars))),
                comentario: comentario,
                data: firebase.firestore.FieldValue.serverTimestamp()
            },
            { merge: true }
        );
        
        // Atualiza notaMedia e totalAvaliacoes no documento do parceiro
        await atualizarDadosAvaliacaoParceiro(parceiroId);
        
        showToast('Avaliação enviada com sucesso!');
        fecharModalAvaliacao();
        
        // Recarrega a interface
        if (typeof renderCompanies === 'function') renderCompanies();
        if (typeof renderFeatured === 'function') renderFeatured();
        atualizarMarcadoresMapa();
        
    } catch (error) {
        console.error('Erro ao enviar avaliação:', error);
        showToast('Erro ao enviar avaliação', 'error');
    }
}

/**
 * Atualiza os campos notaMedia e totalAvaliacoes de um parceiro
 * com base nas avaliações existentes no Firestore.
 * 
 * @param {string} parceiroId - ID do parceiro
 */
async function atualizarDadosAvaliacaoParceiro(parceiroId) {
    if (typeof db === 'undefined') return;
    
    try {
        // Busca todas as avaliações deste parceiro
        const snapshot = await db.collection('avaliacoes')
            .where('parceiroId', '==', parceiroId)
            .get();
        
        let somaNotas = 0;
        let totalAvaliacoes = 0;
        
        snapshot.forEach(doc => {
            const dados = doc.data();
            somaNotas += Number(dados.nota || 0);
            totalAvaliacoes++;
        });
        
        const notaMedia = totalAvaliacoes > 0 ? somaNotas / totalAvaliacoes : 0;
        
        // Atualiza documento do parceiro
        await db.collection('parceiros').doc(parceiroId).update({
            notaMedia: notaMedia,
            totalAvaliacoes: totalAvaliacoes,
            rating: notaMedia,      // Mantém compatibilidade
            avaliacoes: totalAvaliacoes  // Mantém compatibilidade
        });
        
        // Atualiza array local
        const idx = PARCEIROS.findIndex(p => p.id === parceiroId);
        if (idx >= 0) {
            PARCEIROS[idx].rating = notaMedia;
            PARCEIROS[idx].avaliacoes = totalAvaliacoes;
        }
        
    } catch (error) {
        console.error('Erro ao atualizar avaliação:', error);
    }
}

/**
 * Calcula a média de avaliações de um parceiro
 * 
 * @param {string} parceiroId - ID do parceiro
 * @returns {Promise<{media: number, total: number}>}
 */
async function calcularMediaAvaliacoes(parceiroId) {
    if (typeof db === 'undefined') {
        return { media: 0, total: 0 };
    }
    
    try {
        const snapshot = await db.collection('avaliacoes')
            .where('parceiroId', '==', parceiroId)
            .get();
        
        let soma = 0;
        snapshot.forEach(doc => {
            soma += Number(doc.data().nota || 0);
        });
        
        return {
            media: snapshot.size > 0 ? soma / snapshot.size : 0,
            total: snapshot.size
        };
    } catch (error) {
        console.error('Erro ao calcular média:', error);
        return { media: 0, total: 0 };
    }
}


// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

/**
 * Exibe notificação toast na tela
 * 
 * @param {string} message - Mensagem a exibir
 * @param {string} type - Tipo: 'success' ou 'error'
 */
function showToast(message, type = 'success') {
    const stack = document.getElementById('toast-stack');
    if (!stack) {
        // Fallback: usa alert
        alert(message);
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast' + (type === 'error' ? ' error' : '');
    toast.textContent = message;
    stack.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Inicialização completa da página de empresas
 */
async function iniciarPaginaEmpresas() {
    // 1. Inicializa mapa
    inicializarMapa('partners-map');
    
    // 2. Inicia listener em tempo real
    iniciarListenerParceirosTempoReal(async (parceiros) => {
        // Atualiza interface quando parceiros mudam
        if (typeof renderCompanies === 'function') renderCompanies();
        if (typeof renderFeatured === 'function') renderFeatured();
        
        // Geocodifica endereços e atualiza mapa
        await hidratarCoordenadasDosParceiros(parceiros);
    });
    
    // 3. Configura modal de avaliação
    configurarSelecaoEstrelas();
    
    // Evento de envio de avaliação
    const btnEnviar = document.getElementById('submit-review-btn');
    if (btnEnviar) {
        btnEnviar.addEventListener('click', enviarAvaliacao);
    }
    
    // Fecha modal ao clicar fora
    const modal = document.getElementById('modal-avaliar');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                fecharModalAvaliacao();
            }
        });
    }
}

// Inicializa quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Verifica se está na página de empresas
    if (document.getElementById('partners-map')) {
        iniciarPaginaEmpresas();
    }
});