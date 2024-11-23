class Complex {
  constructor(real, imaginary) {
    this._real = real;
    this._imaginary = imaginary;
  }

  get real() {
    return this._real;
  }

  get imaginary() {
    return this._imaginary;
  }

  plus(other) {
    if (typeof other === "number") {
      this._real += other;
      return this;
    } else {
      this._real += other.real;
      this._imaginary += other.imaginary;
      return this;
    }
  }

  minus(other) {
    if (typeof other === "number") {
      return this.plus(-other);
    } else {
      return this.plus(other.unaryMinus());
    }
  }

  times(other) {
    if (typeof other === "number") {
      this._real *= other;
      this._imaginary *= other;
      return this;
    } else {
      const newReal = this.real * other.real - this.imaginary * other.imaginary;
      const newImaginary = this.real * other.imaginary + other.real * this.imaginary;
      this._real = newReal;
      this._imaginary = newImaginary;
      return this;
    }
  }

  unaryMinus() {
    this._real *= -1;
    this._imaginary *= -1;
    return this;
  }

  div(other) {
    this._real /= other;
    this._imaginary /= other;
    return this;
  }
}

const complexSqrt = (num) => {
  if (num < 0.0) {
    return new Complex(0.0, Math.sqrt(Math.abs(num)));
  } else {
    return new Complex(Math.sqrt(num), 0.0);
  }
};

const estimateUnderDamped = (firstRoot, p0, v0, delta) => {
  const r = firstRoot.real;
  const c1 = p0;
  const c2 = (v0 - r * c1) / firstRoot.imaginary;
  const c = Math.sqrt(c1 * c1 + c2 * c2);

  return Math.log(delta / c) / r;
};

const estimateCriticallyDamped = (firstRoot, p0, v0, delta) => {
  const r = firstRoot.real;
  const c1 = p0;
  const c2 = v0 - r * c1;

  const t1 = Math.log(Math.abs(delta / c1)) / r;
  const t2 =
    (() => {
      const guess = Math.log(Math.abs(delta / c2));
      let t = guess;
      for (let i = 0; i <= 5; i++) {
        t = guess - Math.log(Math.abs(t / r));
      }
      return t;
    })() / r;

  let tCurr;
  if (!isFinite(t1)) tCurr = t2;
  else if (!isFinite(t2)) tCurr = t1;
  else tCurr = Math.max(t1, t2);

  const tInflection = -(r * c1 + c2) / (r * c2);
  const xInflection = c1 * Math.exp(r * tInflection) + c2 * tInflection * Math.exp(r * tInflection);

  const signedDelta = (() => {
    if (isNaN(tInflection) || tInflection <= 0.0) {
      return -delta;
    } else if (tInflection > 0.0 && -xInflection < delta) {
      if (c2 < 0 && c1 > 0) {
        tCurr = 0.0;
      }
      return -delta;
    } else {
      const tConcavChange = -(2.0 / r) - c1 / c2;
      tCurr = tConcavChange;
      return delta;
    }
  })();

  let tDelta = Number.MAX_VALUE;
  let iterations = 0;
  while (tDelta > 0.001 && iterations < 100) {
    iterations++;
    const tLast = tCurr;
    tCurr = iterateNewtonsMethod(
      tCurr,
      (t) => (c1 + c2 * t) * Math.exp(r * t) + signedDelta,
      (t) => (c2 * (r * t + 1) + c1 * r) * Math.exp(r * t)
    );
    tDelta = Math.abs(tLast - tCurr);
  }

  return tCurr;
};

const estimateOverDamped = (firstRoot, secondRoot, p0, v0, delta) => {
  const r1 = firstRoot.real;
  const r2 = secondRoot.real;
  const c2 = (r1 * p0 - v0) / (r1 - r2);
  const c1 = p0 - c2;

  const t1 = Math.log(Math.abs(delta / c1)) / r1;
  const t2 = Math.log(Math.abs(delta / c2)) / r2;

  let tCurr;
  if (!isFinite(t1)) tCurr = t2;
  else if (!isFinite(t2)) tCurr = t1;
  else tCurr = Math.max(t1, t2);

  const tInflection = Math.log((c1 * r1) / (-c2 * r2)) / (r2 - r1);
  const xInflection = () => c1 * Math.exp(r1 * tInflection) + c2 * Math.exp(r2 * tInflection);

  const signedDelta = (() => {
    if (isNaN(tInflection) || tInflection <= 0.0) {
      return -delta;
    } else if (tInflection > 0.0 && -xInflection() < delta) {
      if (c2 > 0.0 && c1 < 0.0) {
        tCurr = 0.0;
      }
      return -delta;
    } else {
      tCurr = Math.log(-(c2 * r2 * r2) / (c1 * r1 * r1)) / (r1 - r2);
      return delta;
    }
  })();

  if (Math.abs(c1 * r1 * Math.exp(r1 * tCurr) + c2 * r2 * Math.exp(r2 * tCurr)) < 0.0001) {
    return tCurr;
  }

  let tDelta = Number.MAX_VALUE;
  let iterations = 0;
  while (tDelta > 0.001 && iterations < 100) {
    iterations++;
    const tLast = tCurr;
    tCurr = iterateNewtonsMethod(
      tCurr,
      (t) => c1 * Math.exp(r1 * t) + c2 * Math.exp(r2 * t) + signedDelta,
      (t) => c1 * r1 * Math.exp(r1 * t) + c2 * r2 * Math.exp(r2 * t)
    );
    tDelta = Math.abs(tLast - tCurr);
  }

  return tCurr;
};

const estimateDurationInternal = (firstRoot, secondRoot, dampingRatio, initialVelocity, initialPosition, delta) => {
  if (initialPosition === 0.0 && initialVelocity === 0.0) {
    return 0;
  }

  const v0 = initialPosition < 0 ? -initialVelocity : initialVelocity;
  const p0 = Math.abs(initialPosition);

  let duration;
  if (dampingRatio > 1.0) {
    duration = estimateOverDamped(firstRoot, secondRoot, p0, v0, delta);
  } else if (dampingRatio < 1.0) {
    duration = estimateUnderDamped(firstRoot, p0, v0, delta);
  } else {
    duration = estimateCriticallyDamped(firstRoot, p0, v0, delta);
  }

  return Math.floor(duration * 1000.0);
};

const estimateSpringAnimationDurationMillis = (stiffness, dampingRatio, initialVelocity = 0, initialDisplacement = 1, delta = 0.01) => {
  const dampingCoefficient = 2.0 * dampingRatio * Math.sqrt(stiffness);

  const partialRoot = dampingCoefficient * dampingCoefficient - 4.0 * stiffness;
  const firstRoot = new Complex(-dampingCoefficient, 0).plus(complexSqrt(partialRoot)).times(0.5);
  const secondRoot = new Complex(-dampingCoefficient, 0).minus(complexSqrt(partialRoot)).times(0.5);

  return estimateDurationInternal(firstRoot, secondRoot, dampingRatio, initialVelocity, initialDisplacement, delta);
};
