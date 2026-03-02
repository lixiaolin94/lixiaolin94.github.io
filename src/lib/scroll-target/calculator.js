export function calculateAndroidSplineTarget(velocity, density = 3.5) {
	const SCROLL_FRICTION = 0.015;
	const INFLEXION = 0.35;
	const DECELERATION_RATE = Math.log(0.78) / Math.log(0.9);
	const GRAVITY_EARTH = 9.80665;
	const ppi = density * 160.0;
	const mPhysicalCoeff = GRAVITY_EARTH * 39.37 * ppi * 0.84;

	const l = Math.log((INFLEXION * Math.abs(velocity)) / (SCROLL_FRICTION * mPhysicalCoeff));
	const decelMinusOne = DECELERATION_RATE - 1.0;
	return SCROLL_FRICTION * mPhysicalCoeff * Math.exp((DECELERATION_RATE / decelMinusOne) * l);
}

export function calculateAndroidDecayTarget(initialVelocity, frictionMultiplier = 1, absVelocityThreshold = 0.1) {
	const _absVelocityThreshold = Math.max(0.0000001, Math.abs(absVelocityThreshold));
	const ExponentialDecayFriction = -4.2;
	const friction = ExponentialDecayFriction * Math.max(0.0001, frictionMultiplier);

	if (Math.abs(initialVelocity) <= _absVelocityThreshold) return 0;
	const duration = (Math.log(Math.abs(_absVelocityThreshold / initialVelocity)) / friction) * 1000;
	return -initialVelocity / friction + (initialVelocity / friction) * Math.exp((friction * duration) / 1000);
}

export function calculateAppleScrollTarget(initialVelocity, decelerationRate = 0.998) {
	return ((initialVelocity / 1000.0) * decelerationRate) / (1.0 - decelerationRate);
}

export function calculateAndroidSplineVelocity(targetDistance, density = 3.5) {
	let low = 0, high = 50000, tolerance = 0.1;
	while (high - low > tolerance) {
		const mid = (low + high) / 2;
		if (calculateAndroidSplineTarget(mid, density) < targetDistance) low = mid;
		else high = mid;
	}
	return (low + high) / 2;
}

export function calculateAndroidDecayVelocity(targetDistance, frictionMultiplier = 1, absVelocityThreshold = 0.1) {
	const _absVelocityThreshold = Math.max(0.0000001, Math.abs(absVelocityThreshold));
	let low = _absVelocityThreshold * 1.1, high = 50000, tolerance = 0.1;
	while (high - low > tolerance) {
		const mid = (low + high) / 2;
		if (calculateAndroidDecayTarget(mid, frictionMultiplier, absVelocityThreshold) < targetDistance) low = mid;
		else high = mid;
	}
	return (low + high) / 2;
}

export function calculateAppleScrollVelocity(targetDistance, decelerationRate = 0.998) {
	return targetDistance * (1.0 - decelerationRate) * 1000.0 / decelerationRate;
}
