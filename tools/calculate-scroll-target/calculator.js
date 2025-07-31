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

// Reverse calculations: calculate required initial velocity for target distance

// Android Spline reverse calculation (using binary search)
function calculateAndroidSplineVelocity(targetDistance, density = 3.5) {
  let low = 0;
  let high = 50000; // reasonable upper bound
  let tolerance = 0.1;
  
  while (high - low > tolerance) {
    let mid = (low + high) / 2;
    let distance = calculateAndroidSplineTarget(mid, density);
    
    if (distance < targetDistance) {
      low = mid;
    } else {
      high = mid;
    }
  }
  
  return (low + high) / 2;
}

// Android Decay reverse calculation
function calculateAndroidDecayVelocity(targetDistance, frictionMultiplier = 1, absVelocityThreshold = 0.1) {
  const _absVelocityThreshold = Math.max(0.0000001, Math.abs(absVelocityThreshold));
  const ExponentialDecayFriction = -4.2;
  const friction = ExponentialDecayFriction * Math.max(0.0001, frictionMultiplier);
  
  // Solve: targetDistance = -initialVelocity / friction + (initialVelocity / friction) * exp((friction * duration) / 1000)
  // where duration = (ln(abs(_absVelocityThreshold / initialVelocity)) / friction) * 1000
  // This is complex, so we'll use binary search
  
  let low = _absVelocityThreshold * 1.1; // slightly above threshold
  let high = 50000;
  let tolerance = 0.1;
  
  while (high - low > tolerance) {
    let mid = (low + high) / 2;
    let distance = calculateAndroidDecayTarget(mid, frictionMultiplier, absVelocityThreshold);
    
    if (distance < targetDistance) {
      low = mid;
    } else {
      high = mid;
    }
  }
  
  return (low + high) / 2;
}

// Apple ScrollView reverse calculation
function calculateAppleScrollVelocity(targetDistance, decelerationRate = 0.998) {
  // Solve: targetDistance = ((initialVelocity / 1000.0) * decelerationRate) / (1.0 - decelerationRate)
  // initialVelocity = targetDistance * (1.0 - decelerationRate) * 1000.0 / decelerationRate
  return targetDistance * (1.0 - decelerationRate) * 1000.0 / decelerationRate;
}
