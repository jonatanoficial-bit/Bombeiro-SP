/* app.js - Bombeiro SP (Rotas + Nova Vistoria + Lista Offline) */
import { dbPutVistoria, dbListVistorias, dbDeleteVistoria, dbGetVistoria } from "./db.js";

function $(sel){ return document.querySelector(sel); }
function $all(sel){ return Array.from(document.querySelectorAll(sel)); }

function showToast(msg){
  const el = $("#toast");
  $("#toastText").textContent = msg;
  el.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=> el.classList.remove("show"), 2600);
}

function setActiveView(id){
  $all(".view").forEach(v => v.classList.remove("active"));
  const el = $(id);
  if (el) el.classList.add("active");
}

function toRoute(hash){
  location.hash = hash;
}

function parseNumberSafe(v){
  if (v === null || v === undefined) return null;
  const s = String(v).replace(",", ".").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function formatDateTime(ts){
  const d = new Date(ts);
  const pad = (x)=> String(x).padStart(2,"0");
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function genId(){
  // simples e confiável offline
  return "v_" + Date.now() + "_" + Math.random().toString(16).slice(2);
}

/* ===== PWA: Service Worker + Install ===== */
(async function registerSW(){
  if (!("serviceWorker" in navigator)) return;
  try{
    await navigator.serviceWorker.register("./sw.js", { scope: "./" });
  }catch(e){ /* silêncio */ }
})();

let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  $("#btnInstall").style.display = "inline-flex";
});

window.addEventListener("appinstalled", () => {
  showToast("✅ Bombeiro SP instalado!");
  $("#btnInstall").style.display = "none";
});

document.addEventListener("click", async (e) => {
  const t = e.target;
  if (!t) return;

  if (t.id === "btnInstall"){
    if (!deferredPrompt){
      showToast("ℹ️ Instalação indisponível agora.");
      return;
    }
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice && choice.outcome === "accepted") showToast("📲 Instalando...");
    else showToast("Instalação cancelada.");
    deferredPrompt = null;
  }
});

/* ===== Navegação ===== */
$("#btnNova").addEventListener("click", () => toRoute("#/nova"));
$("#btnSalvas").addEventListener("click", () => toRoute("#/salvas"));
$("#btnVoltarHome").addEventListener("click", () => toRoute("#/home"));
$("#btnRecarregarLista").addEventListener("click", async () => {
  await renderLista();
  showToast("🔄 Lista atualizada.");
});

$("#btnPacote").addEventListener("click", () => {
  showToast("📦 Pacote SP: em seguida vamos plugar as regras (IT/NBR/leis).");
});

/* ===== Nova Vistoria ===== */
let lastSavedId = null;

$("#btnCancelarNova").addEventListener("click", () => {
  lastSavedId = null;
  $("#btnIrChecklist").disabled = true;
  $("#formNova").reset();
  toRoute("#/home");
});

$("#btnIrChecklist").addEventListener("click", () => {
  if (!lastSavedId) return;
  showToast("🧠 Checklist inteligente será a próxima etapa (vamos construir em seguida).");
});

$("#formNova").addEventListener("submit", async (e) => {
  e.preventDefault();

  const tipoLocal = $("#tipoLocal").value.trim();
  const nomeLocal = $("#nomeLocal").value.trim();
  const endereco = $("#endereco").value.trim();

  const area = parseNumberSafe($("#area").value);
  const pavimentos = parseNumberSafe($("#pavimentos").value);
  const altura = parseNumberSafe($("#altura").value);
  const lotacao = parseNumberSafe($("#lotacao").value);

  const riscos = $all(".risco").filter(x => x.checked).map(x => x.value);
  const obs = $("#obs").value.trim();

  if (!tipoLocal || !nomeLocal || !endereco || area === null || pavimentos === null){
    showToast("⚠️ Preencha: tipo, nome, endereço, área e pavimentos.");
    return;
  }

  const now = Date.now();
  const id = genId();

  const vistoria = {
    id,
    createdAt: now,
    updatedAt: now,
    status: "rascunho",
    local: {
      tipoLocal,
      nomeLocal,
      endereco,
      area_m2: area,
      pavimentos,
      altura_m: altura,
      lotacao,
      riscos,
      obs
    },
    // Próximos módulos:
    checklist: [],
    fotos: [],
    relatorio: null
  };

  try{
    await dbPutVistoria(vistoria);
    lastSavedId = id;
    $("#btnIrChecklist").disabled = false;
    showToast("✅ Vistoria salva offline.");
    toRoute("#/salvas");
    await renderLista();
  }catch(err){
    showToast("❌ Erro ao salvar. Tente novamente.");
  }
});

/* ===== Lista Salvas ===== */
async function renderLista(){
  const wrap = $("#listaVistorias");
  wrap.innerHTML = "";

  const items = await dbListVistorias(80);

  if (!items.length){
    wrap.innerHTML = `
      <div class="card">
        <h3>Nenhuma vistoria ainda</h3>
        <p>Crie uma nova vistoria na Home.</p>
        <button class="btn" id="btnNova2">Criar agora</button>
      </div>
    `;
    $("#btnNova2").addEventListener("click", ()=> toRoute("#/nova"));
    return;
  }

  items.forEach(v => {
    const nome = v?.local?.nomeLocal || "Sem nome";
    const tipo = v?.local?.tipoLocal === "evento" ? "Evento" : "Comércio";
    const area = v?.local?.area_m2 ?? "-";
    const pav = v?.local?.pavimentos ?? "-";
    const when = formatDateTime(v.updatedAt);

    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML = `
      <div class="item-top">
        <div>
          <h4>${nome}</h4>
          <small>${tipo} • ${area} m² • ${pav} pav. • Atualizado: ${when}</small>
        </div>
        <div class="item-actions">
          <button class="mini mini-amber" data-open="${v.id}">Abrir</button>
          <button class="mini mini-danger" data-del="${v.id}">Excluir</button>
        </div>
      </div>
    `;
    wrap.appendChild(el);
  });

  wrap.querySelectorAll("[data-open]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-open");
      const v = await dbGetVistoria(id);
      if (!v){
        showToast("⚠️ Não encontrado.");
        await renderLista();
        return;
      }
      // Por enquanto: mostra resumo (próxima etapa vira tela de checklist)
      showToast(`📂 Aberta: ${v.local.nomeLocal}`);
      // Mantém a navegação futura preparada:
      lastSavedId = id;
      toRoute("#/nova");
      // Preenche o formulário (edita / revisa)
      fillForm(v);
      $("#btnIrChecklist").disabled = false;
    });
  });

  wrap.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-del");
      const ok = confirm("Excluir esta vistoria do aparelho?");
      if (!ok) return;
      await dbDeleteVistoria(id);
      showToast("🗑️ Excluída.");
      await renderLista();
    });
  });
}

function fillForm(v){
  $("#tipoLocal").value = v.local.tipoLocal || "";
  $("#nomeLocal").value = v.local.nomeLocal || "";
  $("#endereco").value = v.local.endereco || "";
  $("#area").value = (v.local.area_m2 ?? "");
  $("#pavimentos").value = (v.local.pavimentos ?? "");
  $("#altura").value = (v.local.altura_m ?? "");
  $("#lotacao").value = (v.local.lotacao ?? "");
  $("#obs").value = (v.local.obs ?? "");

  const riscos = new Set(v.local.riscos || []);
  $all(".risco").forEach(ch => ch.checked = riscos.has(ch.value));
}

/* ===== Router ===== */
function handleRoute(){
  const h = location.hash || "#/home";
  if (h.startsWith("#/home")){
    setActiveView("#viewHome");
    return;
  }
  if (h.startsWith("#/nova")){
    setActiveView("#viewNova");
    return;
  }
  if (h.startsWith("#/salvas")){
    setActiveView("#viewSalvas");
    renderLista();
    return;
  }
  // default
  setActiveView("#viewHome");
}

window.addEventListener("hashchange", handleRoute);

// inicial
if (!location.hash) location.hash = "#/home";
handleRoute();
