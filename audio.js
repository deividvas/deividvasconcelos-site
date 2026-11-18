let audioCtx = null;
let somAtivo = false;

const NOTAS_CEU = [293.66, 329.63, 392.00, 440.00, 523.25, 587.33];

function garantirContextoAudio() {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
}

export function alternarSom() {
  somAtivo = !somAtivo;
  if (somAtivo) {
    garantirContextoAudio();
  }
  return somAtivo;
}

export function tocarNotaMeteoro() {
  if (!somAtivo || !audioCtx) return;

  try {
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }

    const agora = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const ganho = audioCtx.createGain();
    const freq = NOTAS_CEU[Math.floor(Math.random() * NOTAS_CEU.length)];

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, agora);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.988, agora + 1.0);

    ganho.gain.setValueAtTime(0.0001, agora);
    ganho.gain.linearRampToValueAtTime(0.032, agora + 0.05);
    ganho.gain.exponentialRampToValueAtTime(0.0001, agora + 1.2);

    osc.connect(ganho);
    ganho.connect(audioCtx.destination);

    osc.start(agora);
    osc.stop(agora + 1.25);
  } catch (_) {}
}
