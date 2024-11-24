const SpringSolver = (mass = 1, stiffness, damping, initialVelocity = 0, origin = 0, target = 1) => {
  const initialDelta = target - origin;
  const naturalFreq = Math.sqrt(stiffness / mass);
  const dampingRatio = damping / (2 * Math.sqrt(stiffness * mass));

  const dampedExp = (t) => Math.exp(-dampingRatio * naturalFreq * t);
  const effectiveVelocity = initialVelocity + dampingRatio * naturalFreq * initialDelta;

  if (dampingRatio < 1) {
    // Underdamped
    const angularFreq = naturalFreq * Math.sqrt(1 - dampingRatio ** 2);
    const coeffA = initialDelta;
    const coeffB = effectiveVelocity / angularFreq;

    return (t) => target - dampedExp(t) * (coeffA * Math.cos(angularFreq * t) + coeffB * Math.sin(angularFreq * t));
  } else if (dampingRatio === 1) {
    // Critically damped
    const coeffA = initialDelta;
    const coeffB = initialVelocity + naturalFreq * initialDelta;

    return (t) => target - Math.exp(-naturalFreq * t) * (coeffA + coeffB * t);
  } else {
    // Overdamped
    const dampedFreq = naturalFreq * Math.sqrt(dampingRatio ** 2 - 1);
    const coeffA = dampedFreq * initialDelta;
    const coeffB = effectiveVelocity;

    return (t) => target - (dampedExp(t) * (coeffA * Math.cosh(dampedFreq * t) + coeffB * Math.sinh(dampedFreq * t))) / dampedFreq;
  }
};
