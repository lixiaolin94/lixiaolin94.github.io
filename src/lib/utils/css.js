import { browser } from '$app/environment';

export function getCSSVariable(name) {
	if (!browser) return '';
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
