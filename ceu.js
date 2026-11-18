import { tocarNotaMeteoro } from "./audio.js";

export function iniciarCeu({ aoContarMeteoro }) {
  const canvas = document.getElementById("ceu");
  const ctx = canvas.getContext("2d", { alpha: true });
  const camadaGrao = document.getElementById("grao-estatico");

  const mediaReduzir = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduzirMovimento = mediaReduzir.matches;
  mediaReduzir.addEventListener("change", (e) => {
    reduzirMovimento = e.matches;
  });

  let dpr = 1;
  let largura = 0;
  let altura = 0;
  let ultimaLarguraCss = 0;
  let ultimaAlturaCss = 0;

  let estrelas = [];
  let meteoros = [];
  let faiscas = [];
  let aneis = [];

  let totalMeteoros = 0;
  let alvoX = 0.5;
  let alvoY = 0.5;
  let suaveX = 0.5;
  let suaveY = 0.5;

  let modoAtual = "ceu";
  let abaVisivel = !document.hidden;
  let ultimoTempo = performance.now();

  function gerarTexturaGrao() {
    if (!camadaGrao) return;
    const tam = 160;
    const cv = document.createElement("canvas");
    cv.width = tam;
    cv.height = tam;
    const g = cv.getContext("2d");
    const img = g.createImageData(tam, tam);
    const d = img.data;

    for (let i = 0; i < d.length; i += 4) {
      const v = Math.random() * 255;
      d[i] = 245;
      d[i + 1] = 242;
      d[i + 2] = 235;
      d[i + 3] = v > 165 ? 190 : 0;
    }

    g.putImageData(img, 0, 0);
    camadaGrao.style.backgroundImage = `url(${cv.toDataURL("image/png")})`;
  }

  function criarEstrelas() {
    estrelas = [];
    const area = window.innerWidth * window.innerHeight;
    const qtd = Math.min(165, Math.max(95, Math.floor(area / 9000)));

    for (let n = 0; n < qtd; n++) {
      const camada = Math.random();
      estrelas.push({
        nx: Math.random(),
        ny: Math.random(),
        rBase: Math.random() * 1.15 + 0.3,
        alfa: Math.random() * 0.52 + 0.22,
        fase: Math.random() * Math.PI * 2,
        vel: Math.random() * 1.8 + 0.65,
        prof: camada * 15,
        cor: Math.random() < 0.28 ? "#cfe3ff" : "#e9e4d8"
      });
    }
  }

  function ajustarTela(forcar = false) {
    const wCss = window.innerWidth;
    const hCss = window.innerHeight;

    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    largura = canvas.width = Math.round(wCss * dpr);
    altura = canvas.height = Math.round(hCss * dpr);

    const mudouLargura = Math.abs(wCss - ultimaLarguraCss) > 40;
    const mudouMuitoAltura = Math.abs(hCss - ultimaAlturaCss) > 180;

    if (forcar || estrelas.length === 0 || mudouLargura || mudouMuitoAltura) {
      criarEstrelas();
      ultimaLarguraCss = wCss;
      ultimaAlturaCss = hCss;
    }
  }

  function lancarMeteoro(tx, ty, atrasoSegundos = 0) {
    const ang = ((Math.random() * 20 + 115) * Math.PI) / 180;
    const dist = (Math.random() * 130 + 220) * dpr;

    meteoros.push({
      sx: tx - Math.cos(ang) * dist,
      sy: ty - Math.sin(ang) * dist,
      tx,
      ty,
      tempo: -atrasoSegundos,
      duracao: 0.64 + Math.random() * 0.24
    });
  }

  function queimarMeteoro(m) {
    aneis.push({ x: m.tx, y: m.ty, r: 2 * dpr, alfa: 0.8 });

    for (let i = 0; i < 12; i++) {
      const ang = Math.random() * Math.PI * 2;
      const vel = (Math.random() * 95 + 28) * dpr;
      faiscas.push({
        x: m.tx,
        y: m.ty,
        vx: Math.cos(ang) * vel,
        vy: Math.sin(ang) * vel,
        alfa: 1
      });
    }

    tocarNotaMeteoro();
  }

  function aoTocarCeu(e) {
    if (modoAtual !== "ceu") return;
    if (e.target && e.target.closest && e.target.closest("button, a, nav")) return;

    const px = e.clientX * dpr;
    const py = e.clientY * dpr;

    lancarMeteoro(px, py, 0);
    totalMeteoros++;

    if (typeof aoContarMeteoro === "function") {
      aoContarMeteoro(totalMeteoros);
    }

    if (totalMeteoros % 10 === 0) {
      for (let i = 0; i < 14; i++) {
        lancarMeteoro(
          Math.random() * largura,
          Math.random() * altura * 0.8,
          i * 0.1
        );
      }
    }
  }

  window.addEventListener("pointermove", (e) => {
    if (window.innerWidth > 0 && window.innerHeight > 0) {
      alvoX = e.clientX / window.innerWidth;
      alvoY = e.clientY / window.innerHeight;
    }
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    abaVisivel = !document.hidden;
    if (abaVisivel) {
      ultimoTempo = performance.now();
    }
  });

  function animar(agoraMs) {
    requestAnimationFrame(animar);
    if (!abaVisivel) return;

    const dt = Math.min((agoraMs - ultimoTempo) / 1000, 0.05);
    ultimoTempo = agoraMs;
    const tSeg = agoraMs / 1000;

    ctx.clearRect(0, 0, largura, altura);

    suaveX += (alvoX - suaveX) * Math.min(1, dt * 4.5);
    suaveY += (alvoY - suaveY) * Math.min(1, dt * 4.5);

    const offX = reduzirMovimento ? 0 : suaveX - 0.5;
    const offY = reduzirMovimento ? 0 : suaveY - 0.5;

    for (let i = 0; i < estrelas.length; i++) {
      const s = estrelas[i];
      const alfa = reduzirMovimento
        ? s.alfa
        : s.alfa * (0.68 + 0.32 * Math.sin(tSeg * s.vel + s.fase));

      const sx = s.nx * largura - offX * s.prof * dpr;
      const sy = s.ny * altura - offY * s.prof * dpr;

      ctx.globalAlpha = alfa;
      ctx.fillStyle = modoAtual === "intervalo" ? "#EDE6DA" : s.cor;
      ctx.beginPath();
      ctx.arc(sx, sy, s.rBase * dpr, 0, Math.PI * 2);
      ctx.fill();
    }

    const chanceSeg = modoAtual === "intervalo" ? 0.11 : 0.27;
    if (!reduzirMovimento && meteoros.length === 0 && Math.random() < chanceSeg * dt) {
      lancarMeteoro(
        Math.random() * largura * 0.8 + largura * 0.1,
        Math.random() * altura * 0.6 + altura * 0.2,
        0
      );
    }

    meteoros = meteoros.filter((m) => {
      m.tempo += dt;
      if (m.tempo < 0) return true;

      const p = Math.min(m.tempo / m.duracao, 1);
      const e = p * p * 0.6 + p * 0.4;

      const hx = m.sx + (m.tx - m.sx) * e;
      const hy = m.sy + (m.ty - m.sy) * e;

      const cauda = Math.min(m.tempo / 0.1, 1) * 90 * dpr;
      const dx = m.tx - m.sx;
      const dy = m.ty - m.sy;
      const d = Math.hypot(dx, dy) || 1;

      const ex = hx - (dx / d) * cauda;
      const ey = hy - (dy / d) * cauda;

      const grad = ctx.createLinearGradient(hx, hy, ex, ey);
      grad.addColorStop(0, `rgba(255, 255, 255, ${1 - p * 0.3})`);
      grad.addColorStop(
        0.25,
        modoAtual === "intervalo"
          ? "rgba(235, 170, 158, 0.65)"
          : "rgba(207, 227, 255, 0.75)"
      );
      grad.addColorStop(1, "rgba(207, 227, 255, 0)");

      ctx.globalAlpha = 1;
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2 * dpr;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      if (p >= 1) {
        queimarMeteoro(m);
        return false;
      }
      return true;
    });

    aneis = aneis.filter((r) => {
      r.r += 96 * dpr * dt;
      r.alfa -= 1.5 * dt;
      if (r.alfa <= 0) return false;

      ctx.globalAlpha = r.alfa;
      ctx.strokeStyle = modoAtual === "intervalo" ? "#e8a59b" : "#cfe3ff";
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
      return true;
    });

    const freio = Math.pow(0.08, dt);
    faiscas = faiscas.filter((f) => {
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.vx *= freio;
      f.vy *= freio;
      f.alfa -= 1.2 * dt;
      if (f.alfa <= 0) return false;

      ctx.globalAlpha = f.alfa;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(f.x, f.y, 1.2 * dpr, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });
  }

  gerarTexturaGrao();
  ajustarTela(true);
  window.addEventListener("resize", () => ajustarTela(false));
  window.addEventListener("pointerdown", aoTocarCeu);
  requestAnimationFrame(animar);

  return {
    definirModo(novoModo) {
      modoAtual = novoModo;
    }
  };
}
