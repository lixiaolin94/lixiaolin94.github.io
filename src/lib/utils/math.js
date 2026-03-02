export function clamp(value, min = 0, max = 1) {
	return Math.min(Math.max(value, min), max);
}

export function round(value, decimals = 3) {
	return Math.round(value * 10 ** decimals) / 10 ** decimals;
}

export function lerp(a, b, t) {
	return a + (b - a) * t;
}

export function normalize(value, a, b) {
	return (value - a) / (b - a);
}
