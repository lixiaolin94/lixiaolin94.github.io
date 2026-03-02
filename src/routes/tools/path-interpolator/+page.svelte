<script>
	import { browser } from '$app/environment';

	const TOKEN_REGEX = /[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g;
	const COMMAND_PARAM_COUNT = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };

	let inputText = $state('');
	let scaleFactor = $state(1.0);
	let outputText = $state('');
	let statusMessage = $state('Waiting for input…');
	let statusLevel = $state('info');
	let previewPath = $state('');
	let previewViewBox = $state('0 0 1 1');
	let previewStrokeWidth = $state(0.01);
	let showError = $state(false);

	function isCommand(token) {
		return /^[a-zA-Z]$/.test(token);
	}

	function detectInputType(text) {
		if (/\s*<\s*pathInterpolator/i.test(text)) return 'android';
		if (/<\s*svg|<\s*path/i.test(text)) return 'svg';
		return 'path';
	}

	function extractPathData(text, type) {
		if (type === 'android') {
			const match = text.match(/android:pathData\s*=\s*"([^"]+)"/i);
			return match ? match[1] : null;
		}
		if (type === 'svg') {
			const pathMatch = text.match(/\sd\s*=\s*"([^"]+)"/i);
			if (pathMatch) return pathMatch[1];
		}
		return text.trim() || null;
	}

	function tokenizePath(d) {
		return d.match(TOKEN_REGEX) || [];
	}

	function parsePath(d) {
		const tokens = tokenizePath(d);
		const segments = [];
		let index = 0;
		let currentCommand = null;

		const popNumber = () => {
			if (index >= tokens.length) return null;
			if (isCommand(tokens[index])) return null;
			return parseFloat(tokens[index++]);
		};

		while (index < tokens.length) {
			const token = tokens[index];
			if (isCommand(token)) {
				currentCommand = token;
				index++;
				if (COMMAND_PARAM_COUNT[token.toUpperCase()] === 0) {
					segments.push({ cmd: token, values: [] });
					currentCommand = null;
				}
				continue;
			}
			if (!currentCommand) return [];

			const upper = currentCommand.toUpperCase();
			const needed = COMMAND_PARAM_COUNT[upper];
			const values = [];
			while (values.length < needed) {
				const v = popNumber();
				if (v === null) break;
				values.push(v);
			}
			if (values.length < needed) break;
			segments.push({ cmd: currentCommand, values });

			if (currentCommand === 'M') currentCommand = 'L';
			if (currentCommand === 'm') currentCommand = 'l';
		}

		return segments;
	}

	function scaleSegments(segments, factor) {
		if (!segments.length || factor === 1) return segments.map((s) => ({ cmd: s.cmd, values: s.values.slice() }));
		return segments.map((segment) => {
			const upper = segment.cmd.toUpperCase();
			const scaled = segment.values.slice();
			if (upper === 'A') {
				[0, 1, 5, 6].forEach((idx) => { if (idx < scaled.length) scaled[idx] *= factor; });
			} else if (upper === 'H' || upper === 'V') {
				if (scaled.length) scaled[0] *= factor;
			} else if (upper !== 'Z') {
				for (let i = 0; i < scaled.length; i++) scaled[i] *= factor;
			}
			return { cmd: segment.cmd, values: scaled };
		});
	}

	function formatNumber(n) {
		const fixed = Number(n.toFixed(6));
		return fixed.toString();
	}

	function buildPathString(segments) {
		return segments.map((seg) => {
			if (!seg.values.length) return seg.cmd;
			return `${seg.cmd} ${seg.values.map(formatNumber).join(' ')}`;
		}).join(' ');
	}

	function computeBounds(segments) {
		if (!segments.length) return null;
		let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
		let cx = 0, cy = 0, startX = 0, startY = 0;

		const record = (x, y) => {
			if (Number.isFinite(x) && Number.isFinite(y)) {
				minX = Math.min(minX, x); maxX = Math.max(maxX, x);
				minY = Math.min(minY, y); maxY = Math.max(maxY, y);
			}
		};

		for (const seg of segments) {
			const upper = seg.cmd.toUpperCase();
			const rel = seg.cmd !== upper;
			const v = seg.values;

			if (upper === 'M' || upper === 'L' || upper === 'T') {
				const x = rel ? cx + v[0] : v[0];
				const y = rel ? cy + v[1] : v[1];
				record(x, y); cx = x; cy = y;
				if (upper === 'M') { startX = x; startY = y; }
			} else if (upper === 'H') {
				cx = rel ? cx + v[0] : v[0]; record(cx, cy);
			} else if (upper === 'V') {
				cy = rel ? cy + v[0] : v[0]; record(cx, cy);
			} else if (upper === 'C') {
				for (let i = 0; i < 6; i += 2) {
					const x = rel ? cx + v[i] : v[i];
					const y = rel ? cy + v[i + 1] : v[i + 1];
					record(x, y);
					if (i === 4) { cx = x; cy = y; }
				}
			} else if (upper === 'S' || upper === 'Q') {
				for (let i = 0; i < v.length; i += 2) {
					const x = rel ? cx + v[i] : v[i];
					const y = rel ? cy + v[i + 1] : v[i + 1];
					record(x, y);
					if (i === v.length - 2) { cx = x; cy = y; }
				}
			} else if (upper === 'A') {
				const x = rel ? cx + v[5] : v[5];
				const y = rel ? cy + v[6] : v[6];
				record(x, y); cx = x; cy = y;
			} else if (upper === 'Z') {
				cx = startX; cy = startY;
			}
		}

		if (minX === Infinity) return null;
		return { minX, maxX, minY, maxY };
	}

	let debounceTimer;

	function process() {
		if (!inputText.trim()) {
			statusMessage = 'Waiting for input…';
			statusLevel = 'info';
			outputText = '';
			previewPath = '';
			showError = false;
			return;
		}

		const type = detectInputType(inputText);
		const pathData = extractPathData(inputText, type);
		if (!pathData) {
			statusMessage = 'Could not find path data in the input.';
			statusLevel = 'error';
			showError = true;
			return;
		}

		const parsedSegments = parsePath(pathData);
		if (!parsedSegments.length) {
			statusMessage = 'Path data could not be parsed.';
			statusLevel = 'error';
			showError = true;
			return;
		}

		const segments = scaleSegments(parsedSegments, scaleFactor);
		const bounds = computeBounds(segments);
		if (!bounds) {
			statusMessage = 'Path bounds could not be determined.';
			statusLevel = 'error';
			showError = true;
			return;
		}

		const finalPath = buildPathString(segments);
		const w = bounds.maxX - bounds.minX || 1;
		const h = bounds.maxY - bounds.minY || 1;
		previewViewBox = `${bounds.minX} ${bounds.minY} ${w} ${h}`;
		previewStrokeWidth = Math.max(0.003, Math.max(w, h) * 0.01);
		previewPath = finalPath;
		showError = false;

		if (type === 'android') {
			outputText = `<svg viewBox="${formatNumber(bounds.minX)} ${formatNumber(bounds.minY)} ${formatNumber(w)} ${formatNumber(h)}" xmlns="http://www.w3.org/2000/svg"><path d="${finalPath}" /></svg>`;
			statusMessage = `Detected Android XML → SVG | Scale ${formatNumber(scaleFactor)}`;
		} else {
			outputText = `<?xml version="1.0" encoding="utf-8"?>\n<pathInterpolator xmlns:android="http://schemas.android.com/apk/res/android"\n    android:pathData="${finalPath}" />`;
			statusMessage = `Detected ${type === 'svg' ? 'SVG' : 'Path string'} → Android | Scale ${formatNumber(scaleFactor)}`;
		}
		statusLevel = 'info';
	}

	function scheduleProcess() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(process, 200);
	}

	let copied = $state(false);
	async function copyOutput() {
		if (!outputText) return;
		await navigator.clipboard.writeText(outputText);
		copied = true;
		setTimeout(() => { copied = false; }, 1000);
	}

	$effect(() => {
		inputText;
		scaleFactor;
		scheduleProcess();
	});
</script>

<svelte:head>
	<title>Path Interpolator Converter | Xiaolin</title>
</svelte:head>

<div class="page">
	<div class="controls">
		<div class="field">
			<label for="scaleInput">Scale Factor</label>
			<input id="scaleInput" type="number" step="0.01" bind:value={scaleFactor} />
		</div>
		<div class="actions">
			<button onclick={process}>Convert</button>
			<button class="secondary" onclick={copyOutput}>{copied ? 'Copied!' : 'Copy Output'}</button>
		</div>
		<div class="status" style:color={statusLevel === 'error' ? 'red' : statusLevel === 'warn' ? 'orange' : ''}>{statusMessage}</div>
	</div>

	<div class="panels">
		<div class="panel">
			<h3>Input</h3>
			<textarea bind:value={inputText} placeholder="Paste Android pathInterpolator XML, SVG XML, or a raw path string (d attribute)"></textarea>
		</div>
		<div class="panel">
			<h3>Output</h3>
			<textarea readonly value={outputText} placeholder="Converted output appears here"></textarea>
		</div>
	</div>

	<div class="preview-card">
		<div>Preview</div>
		<div class="preview-box">
			<svg viewBox={previewViewBox} xmlns="http://www.w3.org/2000/svg">
				<path d={previewPath} stroke="blue" fill="none" stroke-width={previewStrokeWidth} />
			</svg>
		</div>
		{#if showError}
			<div class="error">Invalid Path Data</div>
		{/if}
	</div>
</div>

<style>
	.page {
		max-width: 800px;
		margin: 0 auto;
		padding: 1rem;
	}

	.controls {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 1rem;
	}

	.field {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.field input {
		width: 80px;
		padding: 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-size: 0.875rem;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	.status {
		font-size: 0.875rem;
		color: var(--color-muted-foreground);
	}

	.panels {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	textarea {
		width: 100%;
		height: 240px;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		resize: vertical;
	}

	.preview-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.preview-box {
		width: 200px;
		height: 200px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.preview-box svg {
		width: 100%;
		height: 100%;
	}

	.error {
		color: var(--color-destructive);
		font-size: 0.875rem;
	}
</style>
