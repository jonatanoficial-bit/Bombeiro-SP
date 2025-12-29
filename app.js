/* app.js - Bombeiro SP (Base) */

function $(sel){ return document.querySelector(sel); }

function showToast(msg){
  const el = $("#toast");
  $("#toastText").textContent = msg;
  el.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=> el.classList.remove("show"), 2600);
}

// Registrar Service Worker
(async function registerSW(){
  if (!("serviceWorker" in navigator)) return;
  try{
    await navigator.serviceWorker.register("./sw.js", { scope: "./" });
  }catch(e){
    // silêncio para não "quebrar"
  }
})();

// Botão instalar (PWA)
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

// Clique instalar
document.addEventListener("click", async (e) => {
  const t = e.target;
  if (!t) return;

  // Instalar
  if (t.id === "btnInstall"){
    if (!deferredPrompt){
      showToast("ℹ️ Instalação indisponível agora.");
      return;
    }
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice && choice.outcome === "accepted"){
      showToast("📲 Instalando...");
    }else{
      showToast("Instalação cancelada.");
    }
    deferredPrompt = null;
    return;
  }

  // Ações base (prontas para virar telas reais)
  if (t.id === "btnNova"){
    showToast("🔥 Próximo: Cadastro do local (em seguida).");
    return;
  }
  if (t.id === "btnSalvas"){
    showToast("📋 Em seguida: lista de vistorias salvas.");
    return;
  }
  if (t.id === "btnPacote"){
    showToast("📦 Pacote SP ativo (conteúdo será plugável).");
    return;
  }
});