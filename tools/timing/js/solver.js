const SpringSolver = (mass = 1, stiffness, damping, initialVelocity = 0) => {
  const undampedFrequency = Math.sqrt(stiffness / mass);
  const dampingRatio = damping / (2 * Math.sqrt(stiffness * mass));

  if (dampingRatio < 1) {
    // Under-damped
    const angularFrequency = undampedFrequency * Math.sqrt(1 - dampingRatio * dampingRatio);
    const coeffA = 1;
    const coeffB = (-initialVelocity + dampingRatio * undampedFrequency) / angularFrequency;

    return (t) => 1 - Math.exp(-dampingRatio * undampedFrequency * t) * (coeffA * Math.cos(angularFrequency * t) + coeffB * Math.sin(angularFrequency * t));
  } else if (dampingRatio === 1) {
    // Critically damped
    const coeffA = 1;
    const coeffB = -initialVelocity + undampedFrequency;

    return (t) => 1 - Math.exp(-undampedFrequency * t) * (coeffA + coeffB * t);
  } else {
    // Over-damped
    const angularFrequency = undampedFrequency * Math.sqrt(dampingRatio * dampingRatio - 1);
    const coeffA = angularFrequency;
    const coeffB = -initialVelocity + dampingRatio * undampedFrequency;

    return (t) => 1 - (Math.exp(-dampingRatio * undampedFrequency * t) * (coeffA * Math.cosh(angularFrequency * t) + coeffB * Math.sinh(angularFrequency * t))) / angularFrequency;
  }
};
