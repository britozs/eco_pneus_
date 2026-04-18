// 1. OBJETO DE TELAS (HTML ATUALIZADO)
const screens = {
    dashboard: `
        <section class="fade-in">
            <div class="welcome-box">
                <h2 id="welcome-user">Olá!</h2>
                <p>Bem-vindo ao Eco Pneus</p>
            </div>
            <div class="balance-card">
                <div class="card-label"><i data-lucide="coins"></i> Seu Saldo</div>
                <div class="balance-value" id="dash-saldo">R$ 0,00</div>
            </div>
            <div class="action-grid">
                <button class="btn-primary" onclick="nav('registrar')">Registrar Entrega</button>
                <button class="btn-outline" onclick="nav('confirmar')">Confirmar Código</button>
            </div>
            <div class="stats-grid">
                <div class="stat-card"><span>Pneus</span><strong id="dash-pneus">0</strong></div>
                <div class="stat-card"><span>Peso (kg)</span><strong id="dash-peso">0</strong></div>
                <div class="stat-card"><span>Concluídas</span><strong id="dash-concluidas">0</strong></div>
            </div>
            <div class="recent-list-container">
                <div class="recent-list-header"><h3>Últimas Entregas</h3></div>
                <div id="recent-list" class="recent-list"></div>
            </div>
        </section>
    `,
    registrar: `
        <section class="fade-in">
            <div class="screen-header" style="padding: 20px;">
                <button class="btn-outline" style="padding: 5px 15px;" onclick="nav('dashboard')">Voltar</button>
                <h2 style="margin-top: 10px;">Solicitar Coleta</h2>
            </div>
            <div class="balance-card">
                <label>Local de Coleta</label>
                <div id="map" style="width: 100%; height: 180px; border-radius: 15px; margin: 10px 0; background: #eee;"></div>
                <input type="text" id="address" placeholder="Confirmar endereço..." class="main-input">
                <label>Tipo de Pneu</label>
                <div class="type-grid">
                    <button class="type-btn active" onclick="selectType(this)">Passeio</button>
                    <button class="type-btn" onclick="selectType(this)">Caminhão</button>
                    <button class="type-btn" onclick="selectType(this)">Moto</button>
                    <button class="type-btn" onclick="selectType(this)">Outros</button>
                </div>
                <label>Quantidade</label>
                <div class="qty-selector">
                    <button onclick="changeQty(-1)">-</button>
                    <span id="qty-val">1</span>
                    <button onclick="changeQty(1)">+</button>
                </div>
                <input type="number" id="peso-input" placeholder="Peso Estimado (kg)" class="main-input">
                <button class="btn-confirm" onclick="registrarEntrega()">Confirmar Solicitação</button>
            </div>
        </section>
    `,
    confirmar: `
        <section class="fade-in">
             <div class="welcome-box"><h2>Validar Entrega</h2></div>
             <div class="balance-card">
                <p>Insira o código de 4 dígitos:</p>
                <input type="text" id="codigo-input" placeholder="Ex: 1234" class="main-input" style="text-align: center; font-size: 2rem; letter-spacing: 10px;">
                <button class="btn-confirm" onclick="validarCodigoEntrega()">Validar Agora</button>
            </div>
        </section>
    `,
    perfil: `
        <section class="fade-in profile-screen">
            <div class="profile-card-header">
                <div class="user-avatar-large" onclick="triggerPhotoUpload()">
                    <div id="user-initial" class="avatar-circle">U</div>
                    <img id="profile-img-preview" src="" style="display:none; width:100%; height:100%; object-fit:cover;">
                </div>
                <div class="profile-main-info">
                    <h3 id="display-name">Usuário</h3>
                    <span id="display-email">email@exemplo.com</span>
                </div>
            </div>
            <div class="balance-card">
                <button id="btn-remove-photo" class="btn-outline" style="display:none; margin-bottom: 10px; border-color: #ff4d4d; color: #ff4d4d;" onclick="removePhoto()">
                    <i data-lucide="trash-2"></i> Remover Foto
                </button>
                
                <button class="btn-save" onclick="alert('Funcionalidade de edição em breve!')">Editar Dados</button>
                <button class="btn-logout" onclick="logout()">Sair da Conta</button>
            </div>
            <input type="file" id="photo-input" accept="image/*" style="display:none" onchange="handlePhotoSelect(event)">
        </section>
    `
};

// 2. NAVEGAÇÃO
function nav(screenName) {
    const appContent = document.getElementById('app-content');
    if(!appContent) return;

    // Renderiza a tela
    appContent.innerHTML = screens[screenName] || '<h2>Em breve</h2>';
    
    // Atualiza classes do menu inferior
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const activeBtn = document.getElementById('nav-' + screenName);
    if(activeBtn) activeBtn.classList.add('active');

    // Inicializa ícones da Lucide (importante para o ícone de lixeira aparecer)
    lucide.createIcons();
    window.scrollTo(0, 0);

    // 1. Aplica a foto (ou o "U") em todas as telas
    checkAndApplyPhoto();

    // Gatilhos específicos por tela
    if (screenName === 'registrar') setTimeout(initMap, 300);
    if (screenName === 'dashboard') carregarDadosDashboard();
    
    if (screenName === 'perfil') {
        const user = firebase.auth().currentUser;
        const savedPhoto = localStorage.getItem('userPhoto');
        const btnRemove = document.getElementById('btn-remove-photo');

        if(user) {
            document.getElementById('display-email').innerText = user.email;
            
            // 2. Lógica para o Placeholder (Letra Inicial)
            if(!savedPhoto) {
                const initial = user.displayName ? user.displayName.charAt(0) : user.email.charAt(0);
                document.getElementById('user-initial').innerText = initial.toUpperCase();
                if(btnRemove) btnRemove.style.display = 'none'; // Esconde botão se não há foto
            } else {
                if(btnRemove) btnRemove.style.display = 'block'; // Mostra botão se há foto
            }
        }
    }
}

// 3. Função para remover a foto (Adicione ao seu arquivo JS)
function removePhoto() {
    if (confirm("Deseja remover sua foto de perfil?")) {
        localStorage.removeItem('userPhoto');
        
        // Em vez de recarregar a página, apenas re-executamos a navegação 
        // para atualizar a UI instantaneamente
        nav('perfil'); 
    }
}
// --- LOGICA DA FOTO DE PERFIL ---

function triggerPhotoUpload() {
    document.getElementById('photo-input').click();
}

function handlePhotoSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Image = e.target.result;
            // Salva no LocalStorage
            localStorage.setItem('userPhoto', base64Image);
            // Aplica na interface
            checkAndApplyPhoto();
        };
        reader.readAsDataURL(file);
    }
}

function checkAndApplyPhoto() {
    const savedPhoto = localStorage.getItem('userPhoto');
    if (!savedPhoto) return;

    // 1. Atualiza na Barra de Navegação (Nav Inferior)
    const navImg = document.getElementById('nav-profile-img');
    const navIcon = document.getElementById('nav-profile-icon');
    if (navImg && navIcon) {
        navImg.src = savedPhoto;
        navImg.style.display = 'block';
        navIcon.style.display = 'none';
    }

    // 2. Atualiza na Tela de Perfil (Preview Grande)
    const previewImg = document.getElementById('profile-img-preview');
    const initialDiv = document.getElementById('user-initial');
    if (previewImg && initialDiv) {
        previewImg.src = savedPhoto;
        previewImg.style.display = 'block';
        initialDiv.style.display = 'none';
    }
}

// 3. LOGICA DO MAPA E QUANTIDADE (Mantido)
function selectType(btn) {
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function changeQty(value) {
    const qtyElement = document.getElementById('qty-val');
    let currentQty = parseInt(qtyElement.innerText);
    currentQty += value;
    if (currentQty < 1) currentQty = 1;
    qtyElement.innerText = currentQty;
}

function initMap() {
    const centro = { lat: -23.5505, lng: -46.6333 }; 
    const mapElement = document.getElementById("map");
    if(!mapElement) return;

    try {
        const map = new google.maps.Map(mapElement, {
            zoom: 15, center: centro, disableDefaultUI: true
        });
        new google.maps.Marker({ position: centro, map: map, draggable: true });
    } catch(e) { console.log("Google Maps não carregado corretamente."); }
}

// 4. INTEGRAÇÃO COM BACKEND
async function carregarDadosDashboard() {
    const token = localStorage.getItem("token");
    if(!token) return logout();

    try {
        const res = await fetch("http://localhost:3000/coletas", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const coletas = await res.json();

        let pneus = 0;
        let htmlLista = "";

        coletas.reverse().forEach(d => {
            pneus += Number(d.quantidade);
            const statusClass = d.status === "Concluída" ? "concluida" : "pendente";
            
            htmlLista += `
                <div class="recent-item">
                    <div class="item-icon"><i data-lucide="package"></i></div>
                    <div class="item-info">
                        <strong>${d.tipoPneu || 'Pneu'}</strong>
                        <span>${d.quantidade} un • Código: ${d.codigo}</span>
                    </div>
                    <span class="status-tag ${statusClass}">${d.status || 'Pendente'}</span>
                </div>
            `;
        });

        document.getElementById('dash-pneus').innerText = pneus;
        document.getElementById('recent-list').innerHTML = htmlLista || "<p style='padding:20px; color:#999'>Nenhuma coleta registrada.</p>";
        lucide.createIcons();
    } catch (err) {
        console.error("Erro ao conectar ao backend:", err);
    }
}

async function registrarEntrega() {
    const token = localStorage.getItem("token");
    const dados = {
        quantidade: parseInt(document.getElementById('qty-val').innerText),
        tipoPneu: document.querySelector('.type-btn.active').innerText,
        lat: -23.55, 
        lng: -46.63
    };

    try {
        const res = await fetch("http://localhost:3000/coleta", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify(dados)
        });
        const novo = await res.json();
        alert(`Solicitação criada! Código: ${novo.codigo}`);
        nav('dashboard');
    } catch (e) { alert("Erro ao salvar no servidor."); }
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userPhoto"); // Limpa a foto no logout (opcional)
    firebase.auth().signOut().then(() => {
        window.location.href = 'index.html';
    });
}

// 5. INICIALIZAÇÃO
window.onload = () => {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = 'index.html';
    } else {
        nav('dashboard');
    }
};

function removePhoto() {
    if (confirm("Deseja realmente remover sua foto de perfil?")) {
        // 1. Remove do LocalStorage
        localStorage.removeItem('userPhoto');
        
        // 2. Reseta a UI para o estado inicial (com o "U")
        resetPhotoUI();
    }
}

function resetPhotoUI() {
    // Reset na Nav Inferior
    const navImg = document.getElementById('nav-profile-img');
    const navIcon = document.getElementById('nav-profile-icon');
    if (navImg && navIcon) {
        navImg.src = "";
        navImg.style.display = 'none';
        navIcon.style.display = 'block';
    }

    // Reset na Tela de Perfil
    const previewImg = document.getElementById('profile-img-preview');
    const initialDiv = document.getElementById('user-initial');
    const btnRemove = document.getElementById('btn-remove-photo');
    
    if (previewImg && initialDiv) {
        previewImg.src = "";
        previewImg.style.display = 'none';
        initialDiv.style.display = 'flex';
    }
    
    if (btnRemove) btnRemove.style.display = 'none';
}
window.initMap = initMap;