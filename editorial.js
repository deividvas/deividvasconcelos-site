import { gerarImagemStory } from "./stories.js";

const ACERVO_RESERVA = {
  colecao: "Caderno do Cais — Notas particulares",
  autor: "Tonares",
  textos: [
    {
      id: "intervalo",
      titulo: "Intervalo",
      tituloFenda: ["Inter", "valo"],
      estrofes: [
        [
          "Entre aquilo que fomos",
          "e aquilo que estamos nos tornando,",
          "existe um caminho",
          "feito de rupturas, memórias e reconstruções.",
          "Talvez seja nesse intervalo",
          "que nasça um novo eu."
        ],
        [
          "Não chega de uma vez.",
          "Vem como a maré chega ao cais:",
          "primeiro o barulho miúdo da água,",
          "depois o chão que já não é o mesmo."
        ],
        [
          "Aprendi a não chamar de perda",
          "o que apenas mudou de margem.",
          "Cada quebra deixou uma fresta,",
          "e foi por ela que a luz entrou."
        ],
        [
          "E se me perguntarem quem sou,",
          "direi que ainda estou a caminho:",
          "o cais nunca foi o fim da viagem,",
          "foi só o lugar onde aprendi a partir."
        ]
      ]
    }
  ]
};

export async function iniciarEditorial({ container, aoVoltarCeu, aoMudarTexto }) {
  let dados = ACERVO_RESERVA;

  try {
    const resp = await fetch("./intervalo.json", { cache: "no-cache" });
    if (resp.ok) {
      const json = await resp.json();
      if (json && Array.isArray(json.textos) && json.textos.length > 0) {
        dados = json;
      }
    }
  } catch (_) {}

  let idAtual = dados.textos[0].id;

  function obterTextoAtual() {
    return dados.textos.find((t) => t.id === idAtual) || dados.textos[0];
  }

  function renderizar() {
    const texto = obterTextoAtual();
    container.textContent = "";

    if (dados.textos.length > 1) {
      const navIndice = document.createElement("nav");
      navIndice.className = "indice-caderno";
      navIndice.setAttribute("aria-label", "Textos do Caderno do Cais");

      dados.textos.forEach((item, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `indice-btn${item.id === texto.id ? " ativo" : ""}`;
        const num = String(idx + 1).padStart(2, "0");
        btn.textContent = `${num} · ${item.titulo}`;
        btn.addEventListener("click", () => {
          if (item.id === idAtual) return;
          idAtual = item.id;
          renderizar();
          window.scrollTo({ top: 0, behavior: "smooth" });
          if (typeof aoMudarTexto === "function") {
            aoMudarTexto(idAtual);
          }
        });
        navIndice.appendChild(btn);
      });

      container.appendChild(navIndice);
    }

    const h1 = document.createElement("h1");
    h1.className = "intervalo-titulo";
    h1.setAttribute("aria-label", texto.titulo);

    if (Array.isArray(texto.tituloFenda) && texto.tituloFenda.length === 2) {
      const s1 = document.createElement("span");
      s1.setAttribute("aria-hidden", "true");
      s1.textContent = texto.tituloFenda[0];

      const fenda = document.createElement("i");
      fenda.className = "fenda";
      fenda.setAttribute("aria-hidden", "true");

      const s2 = document.createElement("span");
      s2.setAttribute("aria-hidden", "true");
      s2.textContent = texto.tituloFenda[1];

      h1.append(s1, fenda, s2);
    } else {
      const s = document.createElement("span");
      s.textContent = texto.titulo;
      h1.appendChild(s);
    }
    container.appendChild(h1);

    texto.estrofes.forEach((bloco) => {
      const p = document.createElement("p");
      p.className = "estrofe";
      bloco.forEach((verso) => {
        const linha = document.createElement("span");
        linha.textContent = verso;
        p.appendChild(linha);
      });
      container.appendChild(p);
    });

    const fim = document.createElement("p");
    fim.className = "fim";
    const b = document.createElement("b");
    b.textContent = dados.autor;
    fim.append(b, document.createTextNode(dados.colecao));
    container.appendChild(fim);

    const acoes = document.createElement("div");
    acoes.className = "acoes-intervalo";

    const btnVoltar = document.createElement("button");
    btnVoltar.type = "button";
    btnVoltar.className = "btn-texto";
    btnVoltar.textContent = "← voltar ao céu";
    btnVoltar.addEventListener("click", aoVoltarCeu);

    const grupoShare = document.createElement("div");
    grupoShare.className = "acoes-compartilhar";

    const btnPrint = document.createElement("button");
    btnPrint.type = "button";
    btnPrint.className = "btn-texto";
    btnPrint.textContent = "modo print";
    btnPrint.addEventListener("click", () => {
      document.body.classList.add("modo-print");
      window.scrollTo({ top: 0, behavior: "instant" });
    });

    const btnStory = document.createElement("button");
    btnStory.type = "button";
    btnStory.className = "btn-texto destaque";
    btnStory.textContent = "baixar p/ stories";
    btnStory.addEventListener("click", async () => {
      const rotuloOriginal = btnStory.textContent;
      btnStory.disabled = true;
      btnStory.textContent = "gerando imagem...";
      try {
        await gerarImagemStory({
          texto: obterTextoAtual(),
          autor: dados.autor,
          colecao: dados.colecao
        });
      } finally {
        btnStory.disabled = false;
        btnStory.textContent = rotuloOriginal;
      }
    });

    grupoShare.append(btnPrint, btnStory);
    acoes.append(btnVoltar, grupoShare);
    container.appendChild(acoes);
  }

  renderizar();

  return {
    selecionarTextoPorId(id) {
      if (id && dados.textos.some((t) => t.id === id) && id !== idAtual) {
        idAtual = id;
        renderizar();
      }
    },
    obterIdAtual() {
      return idAtual;
    },
    temMultiplosTextos() {
      return dados.textos.length > 1;
    }
  };
}
