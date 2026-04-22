// 🔥 IMPORTS FIREBASE (OBRIGATÓRIO usar <script type="module"> no HTML)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// 🔑 CONFIG FIREBASE (COLOQUE OS SEUS DADOS)
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "XXXX",
  appId: "XXXX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// =======================
// 🧭 NAVEGAÇÃO (TELAS)
// =======================

const screens = {
  dashboard: `
    <section>
      <h2>Dashboard</h2>
      <p>Pneus: <strong id="dash-pneus">0</strong></p>
      <button onclick="nav('registrar')">Registrar</button>
      <button onclick="nav('perfil')">Perfil</button>
      <div id="recent-list"></div>
    </section>
  `,
  registrar: `
    <section>
      <h2>Registrar Coleta</h2>
      <button onclick="registrarEntrega()">Confirmar</button>
      <button onclick="nav('dashboard')">Voltar</button>
    </section>
  `,
  perfil: `
    <section>
      <h2>Perfil</h2>
      <button onclick="logout()">Sair</button>
      <button onclick="nav('dashboard')">Voltar</button>
    </section>
  `
};

window.nav = function(screen) {
  document.getElementById("app-content").innerHTML = screens[screen];

  if (screen === "dashboard") {
    carregarDadosDashboard();
  }
};


// =======================
// 🔐 AUTH (PROTEÇÃO)
// =======================

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    nav("dashboard");
  }
});


// =======================
// 📊 DASHBOARD (FIRESTORE)
// =======================

async function carregarDadosDashboard() {
  const user = auth.currentUser;
  if (!user) return;

  const q = query(
    collection(db, "coletas"),
    where("uid", "==", user.uid)
  );

  const snapshot = await getDocs(q);

  let pneus = 0;
  let html = "";

  snapshot.forEach((doc) => {
    const d = doc.data();

    pneus += Number(d.quantidade);

    html += `
      <div style="border:1px solid #ccc; margin:5px; padding:10px;">
        <strong>${d.tipoPneu}</strong><br>
        ${d.quantidade} pneus<br>
        ${d.status}
      </div>
    `;
  });

  document.getElementById("dash-pneus").innerText = pneus;
  document.getElementById("recent-list").innerHTML =
    html || "Nenhuma coleta registrada";
}


// =======================
// ➕ REGISTRAR ENTREGA
// =======================

window.registrarEntrega = async function () {
  const user = auth.currentUser;

  if (!user) {
    alert("Usuário não logado");
    return;
  }

  const dados = {
    uid: user.uid,
    tipoPneu: "Passeio",
    quantidade: 1,
    status: "Pendente",
    data: new Date()
  };

  try {
    await addDoc(collection(db, "coletas"), dados);
    alert("Coleta registrada!");
    nav("dashboard");
  } catch (e) {
    console.error(e);
    alert("Erro ao salvar");
  }
};


// =======================
// 🚪 LOGOUT
// =======================

window.logout = function () {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
};