const SpringSolver = (mass = 1, stiffness, damping, initialVelocity = 0, origin = 0, target = 1) => {
  const initialDelta = target - origin;
  const undampedFreq = Math.sqrt(stiffness / mass);
  const dampingRatio = damping / (2 * Math.sqrt(stiffness * mass));

  const dampedExp = (t) => Math.exp(-dampingRatio * undampedFreq * t);
  const effectiveVelocity = initialVelocity + dampingRatio * undampedFreq * initialDelta;

  if (dampingRatio < 1) {
    // Underdamped
    const angularFreq = undampedFreq * Math.sqrt(1 - dampingRatio * dampingRatio);
    const coeffA = initialDelta;
    const coeffB = effectiveVelocity / angularFreq;

    return (t) => target - dampedExp(t) * (coeffA * Math.cos(angularFreq * t) + coeffB * Math.sin(angularFreq * t));
  } else if (dampingRatio === 1) {
    // Critically damped
    const coeffA = initialDelta;
    const coeffB = initialVelocity + undampedFreq * initialDelta;

    return (t) => target - Math.exp(-undampedFreq * t) * (coeffA + coeffB * t);
  } else {
    // Overdamped
    const angularFreq = undampedFreq * Math.sqrt(dampingRatio * dampingRatio - 1);
    const coeffA = angularFreq * initialDelta;
    const coeffB = effectiveVelocity;

    return (t) => target - (dampedExp(t) * (coeffA * Math.cosh(angularFreq * t) + coeffB * Math.sinh(angularFreq * t))) / angularFreq;
  }
};
