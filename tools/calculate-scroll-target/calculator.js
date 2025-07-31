// Android Scroller, OverScroller, NestedScrollView
function calculateAndroidSplineTarget(velocity, density = 3.5) {
  const SCROLL_FRICTION = 0.015;
  const INFLEXION = 0.35; // Tension lines cross at (INFLEXION, 1)
  const DECELERATION_RATE = Math.log(0.78) / Math.log(0.9);
  const GRAVITY_EARTH = 9.80665;

  const ppi = density * 160.0;
  const mPhysicalCoeff =
    GRAVITY_EARTH * // g (m/s^2)
    39.37 * // inch/meter
    ppi *
    0.84; // look and feel tuning

  function getSplineFlingDistance(velocity) {
    const l = Math.log((INFLEXION * Math.abs(velocity)) / (SCROLL_FRICTION * mPhysicalCoeff));
    const decelMinusOne = DECELERATION_RATE - 1.0;
    return SCROLL_FRICTION * mPhysicalCoeff * Math.exp((DECELERATION_RATE / decelMinusOne) * l);
  }

  return getSplineFlingDistance(velocity);
}

// Android FlingAnimation, DecayAnimation
function calculateAndroidDecayTarget(initialVelocity, frictionMultiplier = 1, absVelocityThreshold = 0.1) {
  const _absVelocityThreshold = Math.max(0.0000001, Math.abs(absVelocityThreshold));
  const ExponentialDecayFriction = -4.2;
  const friction = ExponentialDecayFriction * Math.max(0.0001, frictionMultiplier);

  function getTargetValue(initialValue, initialVelocity) {
    if (Math.abs(initialVelocity) <= _absVelocityThreshold) {
      return initialValue;
    }
    const duration = (Math.log(Math.abs(_absVelocityThreshold / initialVelocity)) / friction) * 1000;
    return initialValue - initialVelocity / friction + (initialVelocity / friction) * Math.exp((friction * duration) / 1000);
  }

  return getTargetValue(0, initialVelocity);
}

// Apple UIScrollView, ScrollView
function calculateAppleScrollTarget(initialVelocity, decelerationRate = 0.998) {
  // DecelerationRate.normal = 0.998
  // DecelerationRate.fast = 0.99
  return ((initialVelocity / 1000.0) * decelerationRate) / (1.0 - decelerationRate);
}
