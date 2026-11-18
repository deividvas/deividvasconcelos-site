import { alternarSom } from "./audio.js";
import { iniciarCeu } from "./ceu.js";
import { iniciarEditorial } from "./editorial.js";

const btnCeu = document.getElementById("btn-ceu");
const btnIntervalo = document.getElementById("btn-intervalo");
const btnAbrirIntervalo = document.getElementById("btn-abrir-intervalo");
const btnSairPrint = document.getElementById("btn-sair-print");
const btnSom = document.getElementById("btn-som");

const contadorEl = document.getElementById("contador");
const dicaEl = document.getElementById("dica");
const vistaIntervalo = document.getElementById("vista-intervalo");
const containerIntervalo = document.getElementById("intervalo-container");
const metaThemeColor = document.getElementById("meta-theme-color");

let modoAtual = "ceu";
let timerOcultarIntervalo = null;
let editorialApi = null;

const ceuApi = iniciarCeu({
  aoContarMeteoro(total) {
    contadorEl.textContent = `${total} ${total === 1 ? "meteoro" : "meteoros"}`;
    dicaEl.style.opacity = "0";
  }
});

btnSom.addEventListener("click", () => {
  const ativo = alternarSom();
  btnSom.setAttribute("aria-pressed", String(ativo));
  btnSom.textContent = ativo ? "som: on" : "som: off";
});

function atualizarHistorico(modo, textoId = null) {
  try {
    let novoHash = "";
    if (modo === "intervalo") {
      novoHash = textoId && editorialApi && editorialApi.temMultiplosTextos()
        ? `#intervalo/${textoId}`
        : "#intervalo";
    }
    const urlBase = window.location.pathname + window.location.search;
    const novaUrl = novoHash ? `${urlBase}${novoHash}` : urlBase;
    if (window.location.hash !== novoHash) {
      window.history.pushState({ modo, textoId }, "", novaUrl);
    }
  } catch (_) {}
}

function definirModo(modo, { registrarHistorico = true, textoId = null } = {}) {
  const modoValido = modo === "intervalo" ? "intervalo" : "ceu";
  modoAtual = modoValido;

  document.body.classList.remove("modo-print");
  document.body.dataset.modo = modoValido;
  ceuApi.definirModo(modoValido);

  const emCeu = modoValido === "ceu";
  const emIntervalo = modoValido === "intervalo";

  btnCeu.classList.toggle("ativo", emCeu);
  btnIntervalo.classList.toggle("ativo", emIntervalo);

  if (emCeu) {
    btnCeu.setAttribute("aria-current", "page");
    btnIntervalo.removeAttribute("aria-current");
    if (metaThemeColor) metaThemeColor.setAttribute("content", "#0c1020");
    document.title = "Deivid Vasconcelos — Física & escrita";
  } else {
    btnIntervalo.setAttribute("aria-current", "page");
    btnCeu.removeAttribute("aria-current");
    if (metaThemeColor) metaThemeColor.setAttribute("content", "#0A0707");
    document.title = "Intervalo — Tonares | Deivid Vasconcelos";
  }

  clearTimeout(timerOcultarIntervalo);

  if (emIntervalo) {
    if (editorialApi && textoId) {
      editorialApi.selecionarTextoPorId(textoId);
    }
    vistaIntervalo.hidden = false;
    window.scrollTo({ top: 0, behavior: "instant" });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        vistaIntervalo.classList.add("ativa");
      });
    });
  } else {
    vistaIntervalo.classList.remove("ativa");
    timerOcultarIntervalo = setTimeout(() => {
      if (modoAtual === "ceu") {
        vistaIntervalo.hidden = true;
      }
    }, 650);
  }

  if (registrarHistorico) {
    atualizarHistorico(modoValido, textoId);
  }
}

function interpretarHashAtual() {
  const hashLimpo = (window.location.hash || "").replace(/^#\/?/, "");
  if (hashLimpo.startsWith("intervalo")) {
    const partes = hashLimpo.split("/");
    return { modo: "intervalo", textoId: partes[1] || null };
  }
  return { modo: "ceu", textoId: null };
}

btnCeu.addEventListener("click", () => definirModo("ceu"));
btnIntervalo.addEventListener("click", () => definirModo("intervalo"));
btnAbrirIntervalo.addEventListener("click", () => definirModo("intervalo"));

btnSairPrint.addEventListener("click", () => {
  document.body.classList.remove("modo-print");
});

document.addEventListener("click", (e) => {
  if (!document.body.classList.contains("modo-print")) return;
  if (e.target.closest("#btn-sair-print")) return;
  if (e.target.closest(".acoes-intervalo")) return;
  document.body.classList.remove("modo-print");
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (document.body.classList.contains("modo-print")) {
      document.body.classList.remove("modo-print");
    } else if (modoAtual !== "ceu") {
      definirModo("ceu");
    }
  }
});

window.addEventListener("popstate", () => {
  const rota = interpretarHashAtual();
  definirModo(rota.modo, { registrarHistorico: false, textoId: rota.textoId });
});

window.addEventListener("hashchange", () => {
  const rota = interpretarHashAtual();
  if (rota.modo !== modoAtual) {
    definirModo(rota.modo, { registrarHistorico: false, textoId: rota.textoId });
  }
});

(async function iniciar() {
  editorialApi = await iniciarEditorial({
    container: containerIntervalo,
    aoVoltarCeu: () => definirModo("ceu"),
    aoMudarTexto: (id) => atualizarHistorico("intervalo", id)
  });

  const rotaInicial = interpretarHashAtual();
  if (rotaInicial.modo === "intervalo") {
    definirModo("intervalo", { registrarHistorico: false, textoId: rotaInicial.textoId });
  }
})();
