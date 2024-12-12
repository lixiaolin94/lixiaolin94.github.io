Number.prototype.clamp = function (min = 0, max = 1) {
  return Math.min(Math.max(this, min), max);
};

Number.prototype.round = function (decimals = 3) {
  return Math.round(this * 10 ** decimals) / 10 ** decimals;
};

const lerp = (a, b, t) => a + (b - a) * t;

const normalize = (value, a, b) => (value - a) / (b - a);
