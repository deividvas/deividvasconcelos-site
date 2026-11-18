function quebrarLinha(ctx, texto, larguraMax) {
  if (ctx.measureText(texto).width <= larguraMax) {
    return [texto];
  }
  const palavras = texto.split(" ");
  const linhas = [];
  let atual = "";

  for (const p of palavras) {
    const teste = atual ? `${atual} ${p}` : p;
    if (ctx.measureText(teste).width > larguraMax && atual) {
      linhas.push(atual);
      atual = p;
    } else {
      atual = teste;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

export async function gerarImagemStory({ texto, autor, colecao }) {
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (_) {}
  }

  const W = 1080;
  const H = 1920;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d");

  g.fillStyle = "#0A0707";
  g.fillRect(0, 0, W, H);

  const rad = g.createRadialGradient(540, 0, 40, 540, 0, 920);
  rad.addColorStop(0, "rgba(176, 55, 43, 0.28)");
  rad.addColorStop(0.7, "rgba(176, 55, 43, 0.05)");
  rad.addColorStop(1, "rgba(10, 7, 7, 0)");
  g.fillStyle = rad;
  g.fillRect(0, 0, W, H);

  for (let s = 0; s < 55; s++) {
    g.fillStyle = `rgba(237, 230, 218, ${(Math.random() * 0.22 + 0.06).toFixed(3)})`;
    g.beginPath();
    g.arc(
      Math.random() * W,
      Math.random() * H,
      Math.random() * 1.6 + 0.5,
      0,
      Math.PI * 2
    );
    g.fill();
  }

  const margemX = 140;
  const larguraUtil = W - margemX * 2;
  const totalVersos = texto.estrofes.reduce((acc, est) => acc + est.length, 0);
  const tamanhoVerso = totalVersos > 22 ? 34 : 39;
  const entrelinha = Math.round(tamanhoVerso * 1.44);
  const espacoEstrofe = Math.round(tamanhoVerso * 1.08);

  g.font = `400 ${tamanhoVerso}px "Cormorant Garamond", Georgia, serif`;
  const estrofesProcessadas = texto.estrofes.map((bloco) => {
    const linhasBloco = [];
    bloco.forEach((verso) => {
      linhasBloco.push(...quebrarLinha(g, verso, larguraUtil));
    });
    return linhasBloco;
  });

  const alturaCorpo = estrofesProcessadas.reduce(
    (acc, bl) => acc + bl.length * entrelinha + espacoEstrofe,
    0
  );
  const alturaTotalEstimada = 150 + alturaCorpo + 150;
  const tituloY = Math.max(220, Math.min(310, Math.round((H - alturaTotalEstimada) / 2 + 45)));

  g.textBaseline = "middle";
  g.font = 'italic 300 108px "Cormorant Garamond", Georgia, serif';
  g.fillStyle = "#EDE6DA";

  if (Array.isArray(texto.tituloFenda) && texto.tituloFenda.length === 2) {
    const [parte1, parte2] = texto.tituloFenda;
    const w1 = g.measureText(parte1).width;
    const w2 = g.measureText(parte2).width;
    const gap = 26;
    const totalW = w1 + gap * 2 + 2 + w2;
    const startX = (W - totalW) / 2;

    g.textAlign = "left";
    g.fillText(parte1, startX, tituloY);

    g.save();
    g.shadowColor = "rgba(176, 55, 43, 0.9)";
    g.shadowBlur = 24;
    g.fillStyle = "#EDE6DA";
    g.fillRect(startX + w1 + gap, tituloY - 56, 2, 112);
    g.restore();

    g.fillText(parte2, startX + w1 + gap * 2 + 2, tituloY);
  } else {
    g.textAlign = "center";
    g.fillText(texto.titulo, W / 2, tituloY);
  }

  let y = tituloY + 150;
  g.font = `400 ${tamanhoVerso}px "Cormorant Garamond", Georgia, serif`;
  g.fillStyle = "#EDE6DA";
  g.textAlign = "left";

  estrofesProcessadas.forEach((bloco) => {
    bloco.forEach((linha) => {
      g.fillText(linha, margemX, y);
      y += entrelinha;
    });
    y += espacoEstrofe;
  });

  y += 14;
  g.strokeStyle = "rgba(237, 230, 218, 0.2)";
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(margemX, y);
  g.lineTo(W - margemX, y);
  g.stroke();

  y += 48;
  g.font = 'italic 500 38px "Cormorant Garamond", Georgia, serif';
  g.fillStyle = "#EDE6DA";
  g.fillText(autor, margemX, y);

  y += 44;
  g.font = 'italic 400 30px "Cormorant Garamond", Georgia, serif';
  g.fillStyle = "#A39A91";
  g.fillText(colecao, margemX, y);

  const nomeArquivo = `${texto.id || "intervalo"}-tonares-story.png`;
  const blob = await new Promise((resolve) => cv.toBlob(resolve, "image/png"));
  if (!blob) return;

  const ehDispositivoToque = navigator.maxTouchPoints > 0 && window.innerWidth < 900;
  if (ehDispositivoToque && navigator.canShare) {
    const arquivo = new File([blob], nomeArquivo, { type: "image/png" });
    if (navigator.canShare({ files: [arquivo] })) {
      try {
        await navigator.share({
          files: [arquivo],
          title: `${texto.titulo} — ${autor}`
        });
        return;
      } catch (err) {
        if (err && err.name === "AbortError") return;
      }
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = nomeArquivo;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
