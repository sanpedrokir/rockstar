export function midiToFreq(midi: number) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// classic Karplus-Strong plucked string: a noise burst decays through a
// leaky averaging delay line tuned to the string length.
export function pluckString(
  freq: number,
  lengthSamples: number,
  sampleRate: number,
  damping: number,
  pick: () => number
) {
  const n = Math.max(2, Math.round(sampleRate / freq));
  const ring = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    // taper the initial noise burst so the attack isn't a hard click
    const taper = Math.sin((Math.PI * i) / n);
    ring[i] = (pick() * 2 - 1) * taper;
  }
  const out = new Float32Array(lengthSamples);
  let read = 0;
  for (let i = 0; i < lengthSamples; i++) {
    out[i] = ring[read];
    const next = ring[(read + 1) % n];
    ring[read] = damping * 0.5 * (ring[read] + next);
    read = (read + 1) % n;
  }
  return out;
}

export function makeOverdriveCurve(amount: number) {
  const samples = 2048;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

export function makeReverbImpulse(ctx: AudioContext, seconds: number) {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * seconds);
  const impulse = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
    }
  }
  return impulse;
}
