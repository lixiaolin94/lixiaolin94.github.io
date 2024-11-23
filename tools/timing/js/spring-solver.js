const SpringSolver = (mass = 1, stiffness, damping, initialVelocity = 0) => {
  const to = 1;
  const from = 0;

  const w_0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const v = initialVelocity;
  const s = from - to;
  const c = w_0 * zeta;
  const w_d = w_0 * Math.sqrt(Math.abs(1 - zeta * zeta));

  if (zeta < 1) {
    // Underdamped
    const A = s;
    const B = (v + c * s) / w_d;
    return (t) => to + Math.exp(-c * t) * (A * Math.cos(w_d * t) + B * Math.sin(w_d * t));
  } else if (zeta === 1) {
    // Critically damped
    const A = s;
    const B = v + c * s;
    return (t) => to + Math.exp(-c * t) * (A + B * t);
  } else {
    // Overdamped
    const A = w_d * s;
    const B = v + c * s;
    return (t) => to + (Math.exp(-c * t) * (A * Math.cosh(w_d * t) + B * Math.sinh(w_d * t))) / w_d;
  }
};
