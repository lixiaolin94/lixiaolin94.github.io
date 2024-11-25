const springConverter = {
  "origami-studio": ({ speed, bounciness }) => convertFromSpeedBounciness(speed, bounciness),
  "figma": ({ mass, stiffness, damping }) => convertFromMassStiffnessDamping(mass, stiffness, damping),
  "principle": ({ stiffness, damping }) => convertFromStiffnessDamping(stiffness, damping),
  "protopie": ({ stiffness, damping }) => convertFromStiffnessDamping(stiffness, damping),
  "framer-duration": ({ response, bounce }) => convertFromResponseDampingRatio(response, 1 - bounce),
  "framer-physical": ({ mass, stiffness, damping }) => convertFromMassStiffnessDamping(mass, stiffness, damping),
  "react-spring-friendly": ({ response, dampingRatio }) => convertFromResponseDampingRatio(response, dampingRatio),
  "react-spring-physical": ({ mass, stiffness, damping }) => convertFromMassStiffnessDamping(mass, stiffness, damping),
  "android-springanimation": ({ stiffness, dampingRatio }) => convertFromStiffnessDampingRatio(stiffness, dampingRatio),
  "ios-spring-duration-bounce": ({ response, bounce }) => convertFromResponseDampingRatio(response, 1 - bounce),
  "ios-spring-response-dampingratio": ({ response, dampingRatio }) => convertFromResponseDampingRatio(response, dampingRatio),
  "ios-spring-mass-stiffness-damping": ({ mass, stiffness, damping }) => convertFromMassStiffnessDamping(mass, stiffness, damping),
};

/* Spring Conversion */

const calculateStiffness = (response, mass = 1) => mass * Math.pow((2 * Math.PI) / response, 2);

const calculateDamping = (dampingRatio, stiffness, mass = 1) => dampingRatio * 2 * Math.sqrt(stiffness * mass);

const calculateDampingRatio = (damping, stiffness, mass = 1) => damping / (2 * Math.sqrt(stiffness * mass));

const calculateResponse = (stiffness, mass = 1) => (2 * Math.PI) / Math.sqrt(stiffness / mass);

const b3Nobounce = (x) => {
  if (x <= 18) {
    return 0.0007 * x * x * x - 0.031 * x * x + 0.64 * x + 1.28;
  } else if (x > 18 && x <= 44) {
    return 0.000044 * x * x * x - 0.006 * x * x + 0.36 * x + 2;
  } else {
    return 0.00000045 * x * x * x - 0.000332 * x * x + 0.1078 * x + 5.84;
  }
};

const convertFromSpeedBounciness = (speed, bounciness) => {
  const quadraticOut = (t) => 1 - (1 - t) * (1 - t);

  let b = normalize(bounciness / 1.7, 0, 20);
  b = lerp(0, 0.8, b);
  const s = normalize(speed / 1.7, 0, 20);
  const bouncyTension = lerp(0.5, 200, s);
  const bouncyFriction = lerp(b3Nobounce(bouncyTension), 0.01, quadraticOut(b));
  const stiffness = (bouncyTension - 30) * 3.62 + 194;
  const damping = (bouncyFriction - 8) * 3 + 25;

  return {
    mass: 1,
    stiffness,
    damping,
    initialVelocity: 0,
  };
};

const convertFromMassStiffnessDamping = (mass, stiffness, damping) => ({
  mass,
  stiffness,
  damping,
  initialVelocity: 0,
});

const convertFromStiffnessDamping = (stiffness, damping) => ({
  mass: 1,
  stiffness,
  damping,
  initialVelocity: 0,
});

const convertFromStiffnessDampingRatio = (stiffness, dampingRatio) => ({
  mass: 1,
  stiffness,
  damping: calculateDamping(dampingRatio, stiffness),
  initialVelocity: 0,
});

const convertFromResponseDampingRatio = (response, dampingRatio) => {
  const stiffness = calculateStiffness(response);

  return {
    mass: 1,
    stiffness,
    damping: calculateDamping(dampingRatio, stiffness),
    initialVelocity: 0,
  };
};

/* Duration Estimation */

const iterateNewtonsMethod = (x0, f, fPrime) => {
  const x1 = x0 - f(x0) / fPrime(x0);
  return x1;
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
  const t2 = (() => {
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

const estimateSpringAnimationDuration = (stiffness, dampingRatio, initialVelocity = 0, initialDisplacement = 1, delta = 0.001) => {
  if (initialDisplacement === 0.0 && initialVelocity === 0.0) {
    return 0;
  }

  const v0 = initialDisplacement < 0 ? -initialVelocity : initialVelocity;
  const p0 = Math.abs(initialDisplacement);

  const dampingCoefficient = 2.0 * dampingRatio * Math.sqrt(stiffness);
  const discriminant = dampingCoefficient * dampingCoefficient - 4.0 * stiffness;
  
  let duration;
  
  if (dampingRatio > 1) { // 过阻尼 - 两个不同实根
    const sqrtDiscriminant = Math.sqrt(discriminant);
    const firstRoot = {real: (-dampingCoefficient + sqrtDiscriminant) / 2, imaginary: 0};
    const secondRoot = {real: (-dampingCoefficient - sqrtDiscriminant) / 2, imaginary: 0};
    duration = estimateOverDamped(firstRoot, secondRoot, p0, v0, delta);
  } 
  else if (dampingRatio === 1) { // 临界阻尼 - 两个相等实根
    const root = {real: -dampingCoefficient / 2, imaginary: 0};
    duration = estimateCriticallyDamped(root, p0, v0, delta);
  }
  else { // 欠阻尼 - 一对共轭复根
    const realPart = -dampingCoefficient / 2;
    const imaginaryPart = Math.sqrt(Math.abs(discriminant)) / 2;
    const root = {real: realPart, imaginary: imaginaryPart};
    duration = estimateUnderDamped(root, p0, v0, delta);
  }

  return duration;
};

/* CSS Linear Timing Function Generation */

function getSquareSegmentDistance(p, p1, p2) {
  let [x, y] = p1;
  const dx = p2[0] - x;
  const dy = p2[1] - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = p2[0];
      y = p2[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  const pointDx = p[0] - x;
  const pointDy = p[1] - y;
  return pointDx * pointDx + pointDy * pointDy;
}

function simplifyDouglasPeucker(points, tolerance) {
  const sqTolerance = tolerance * tolerance;
  const last = points.length - 1;
  const result = [points[0]];

  function simplifyStep(first, last) {
    let maxSquareDistance = sqTolerance;
    let index = null;

    for (let i = first + 1; i < last; i++) {
      const squareDistance = getSquareSegmentDistance(points[i], points[first], points[last]);

      if (squareDistance > maxSquareDistance) {
        index = i;
        maxSquareDistance = squareDistance;
      }
    }

    if (maxSquareDistance > sqTolerance) {
      if (index - first > 1) simplifyStep(first, index);
      result.push(points[index]);
      if (last - index > 1) simplifyStep(index, last);
    }
  }

  simplifyStep(0, last);
  result.push(points[last]);
  return result;
}

function generateLinearTiming(solver, duration = 1000, tolerance = 0.001) {
  const interval = Math.max(1, Math.floor(duration / 1000));
  const points = [];

  for (let i = 0; i <= duration; i += interval) {
    const t = i / duration;
    const value = solver(t);
    points.push([t, value]);
  }

  const lastT = 1;
  const lastValue = solver(lastT); 
  if(points[points.length-1][0] !== 1) {
    points.push([lastT, lastValue]);
  }

  const simplified = simplifyDouglasPeucker(points, tolerance);

  const formatted = simplified.map(([t, v]) => {
    const formattedT = round(t * 100);
    const formattedV = round(v);
    return t === 0 ? `${formattedV}` : `${formattedV} ${formattedT}%`;
  });

  return `linear(${formatted.join(", ")})`;
}
