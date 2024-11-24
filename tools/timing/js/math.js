const clamp = (v, min = 0, max = 1) => Math.min(Math.max(v, min), max);

const round = (v, d = 3) => Math.round(v * 10 ** d) / 10 ** d;

const lerp = (a, b, t) => a + (b - a) * t;

const normalize = (value, a, b) => (value - a) / (b - a);

const iterateNewtonsMethod = (x, fn, fnPrime) => {
  return x - fn(x) / fnPrime(x);
};
