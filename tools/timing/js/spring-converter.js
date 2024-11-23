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

const converter = {
  "origami-studio": ({ speed, bounciness }) => convertFromSpeedBounciness(speed, bounciness),
  "figma": ({ mass, stiffness, damping }) => convertFromMassStiffnessDamping(mass, stiffness, damping),
  "principle": ({ stiffness, damping }) => convertFromStiffnessDamping(stiffness, damping),
  "protopie": ({ stiffness, damping }) => convertFromStiffnessDamping(stiffness, damping),
  "framer-physical": ({ mass, stiffness, damping }) => convertFromMassStiffnessDamping(mass, stiffness, damping),
  "framer-time": ({ response, bounce }) => convertFromResponseDampingRatio(response, 1 - bounce),
  "react-spring-physical": ({ mass, stiffness, damping }) => convertFromMassStiffnessDamping(mass, stiffness, damping),
  "react-spring-friendly": ({ response, dampingRatio }) => convertFromResponseDampingRatio(response, dampingRatio),
  "android-springanimation": ({ stiffness, dampingRatio }) => convertFromStiffnessDampingRatio(stiffness, dampingRatio),
  "ios-spring-duration-bounce": ({ response, bounce }) => convertFromResponseDampingRatio(response, 1 - bounce),
  "ios-spring-response-dampingratio": ({ response, dampingRatio }) => convertFromResponseDampingRatio(response, dampingRatio),
  "ios-spring-mass-stiffness-damping": ({ mass, stiffness, damping }) => convertFromMassStiffnessDamping(mass, stiffness, damping),
};
