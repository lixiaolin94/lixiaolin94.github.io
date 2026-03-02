<script>
	let angle = $state(90);
	let colorStart = $state('#FF0000');
	let alphaStart = $state(1.0);
	let colorEnd = $state('#0000FF');
	let alphaEnd = $state(0.0);
	let easeType = $state('out');
	let mirror = $state(false);

	function erf(x) {
		const sign = x >= 0 ? 1 : -1;
		x = Math.abs(x);
		const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
		const t = 1.0 / (1.0 + p * x);
		const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
		return sign * y;
	}

	function gaussianEaseOut(t, k = 2.5) { return erf(k * t) / erf(k); }
	function gaussianEaseIn(t, k = 2.5) { return 1 - erf(k * (1 - t)) / erf(k); }
	function gaussianEaseInOut(t, k = 2.5) { return erf(k * (2 * t - 1)) / (2 * erf(k)) + 0.5; }

	function hexToRgb(hex) {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0];
	}

	let gradientData = $derived.by(() => {
		const rgbStart = hexToRgb(colorStart);
		const rgbEnd = hexToRgb(colorEnd);
		const steps = mirror ? 30 : 15;
		const stops = [];

		for (let i = 0; i <= steps; i++) {
			let p = i / steps;
			let t = mirror ? (p <= 0.5 ? p * 2 : (1 - p) * 2) : p;
			let ratio = t;
			if (easeType === 'out') ratio = gaussianEaseOut(t);
			else if (easeType === 'in') ratio = gaussianEaseIn(t);
			else if (easeType === 'inout') ratio = gaussianEaseInOut(t);

			const r = Math.round(rgbStart[0] + (rgbEnd[0] - rgbStart[0]) * ratio);
			const g = Math.round(rgbStart[1] + (rgbEnd[1] - rgbStart[1]) * ratio);
			const b = Math.round(rgbStart[2] + (rgbEnd[2] - rgbStart[2]) * ratio);
			const a = parseFloat((alphaStart + (alphaEnd - alphaStart) * ratio).toFixed(3));
			stops.push({ position: parseFloat(p.toFixed(4)), color: [r, g, b, a] });
		}

		return {
			type: 'linear',
			ease_algorithm: `gaussian_${easeType}`,
			is_mirror: mirror,
			angle,
			colors_count: stops.length,
			stops
		};
	});

	let cssGradient = $derived(
		`linear-gradient(${angle}deg, ${gradientData.stops.map((s) => `rgba(${s.color[0]}, ${s.color[1]}, ${s.color[2]}, ${s.color[3]}) ${(s.position * 100).toFixed(2)}%`).join(', ')})`
	);

	let jsonOutput = $derived(JSON.stringify(gradientData, null, 2));

	function triggerDownload(content, filename, mimeType) {
		const blob = new Blob([content], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	}

	function exportSVG() {
		const data = gradientData;
		const svgStops = data.stops.map((stop) => {
			const rgbString = `rgb(${stop.color[0]}, ${stop.color[1]}, ${stop.color[2]})`;
			return `      <stop offset="${(stop.position * 100).toFixed(1)}%" stop-color="${rgbString}" stop-opacity="${stop.color[3]}" />`;
		}).join('\n');

		const svgCode = `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gaussianGrad" gradientTransform="rotate(${data.angle - 90}, 0.5, 0.5)">
${svgStops}
    </linearGradient>
  </defs>
  <rect width="200" height="200" fill="url(#gaussianGrad)" />
</svg>`;

		triggerDownload(svgCode, `gaussian_gradient${data.is_mirror ? '_mirrored' : ''}.svg`, 'image/svg+xml');
	}

	function exportLottie() {
		const data = gradientData;
		const angleRad = (data.angle * Math.PI) / 180;
		const distance = 100 * (Math.abs(Math.sin(angleRad)) + Math.abs(Math.cos(angleRad)));
		const startX = -Math.sin(angleRad) * distance;
		const startY = Math.cos(angleRad) * distance;
		const endX = Math.sin(angleRad) * distance;
		const endY = -Math.cos(angleRad) * distance;

		const lottieColors = [];
		const lottieAlphas = [];
		data.stops.forEach((stop) => {
			lottieColors.push(stop.position, +(stop.color[0] / 255).toFixed(4), +(stop.color[1] / 255).toFixed(4), +(stop.color[2] / 255).toFixed(4));
			lottieAlphas.push(stop.position, stop.color[3]);
		});

		const lottieData = {
			v: '5.7.0', fr: 30, ip: 0, op: 60, w: 200, h: 200, nm: 'Gaussian Gradient', ddd: 0, assets: [],
			layers: [{ ddd: 0, ind: 1, ty: 4, nm: 'Gradient Box', sr: 1, ip: 0, op: 60, st: 0,
				ks: { o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [100, 100, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] } },
				ao: 0, shapes: [{ ty: 'gr', nm: 'Rectangle 1', np: 3, cix: 2, bm: 0, ix: 1,
					it: [
						{ ty: 'rc', d: 1, s: { a: 0, k: [200, 200] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 0 }, nm: 'Rectangle Path 1' },
						{ ty: 'gf', o: { a: 0, k: 100 }, r: 1, t: 1, nm: 'Gradient Fill 1',
							g: { p: data.stops.length, k: { a: 0, k: [...lottieColors, ...lottieAlphas] } },
							s: { a: 0, k: [startX, startY] }, e: { a: 0, k: [endX, endY] } },
						{ ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 }, nm: 'Transform' }
					]
				}]
			}]
		};

		triggerDownload(JSON.stringify(lottieData, null, 2), `gaussian_gradient${data.is_mirror ? '_mirrored' : ''}.json`, 'application/json');
	}
</script>

<svelte:head>
	<title>Gaussian Gradient Generator | Xiaolin</title>
</svelte:head>

<div class="page">
	<div class="row controls">
		<div class="control-group">
			<label>Angle</label>
			<input type="number" bind:value={angle} />
		</div>
		<div class="control-group">
			<label>Start (Color & Alpha)</label>
			<div class="color-alpha">
				<input type="color" bind:value={colorStart} />
				<input type="number" class="alpha" bind:value={alphaStart} min="0" max="1" step="0.05" />
			</div>
		</div>
		<div class="control-group">
			<label>End (Color & Alpha)</label>
			<div class="color-alpha">
				<input type="color" bind:value={colorEnd} />
				<input type="number" class="alpha" bind:value={alphaEnd} min="0" max="1" step="0.05" />
			</div>
		</div>
		<div class="control-group">
			<label>Easing</label>
			<select bind:value={easeType}>
				<option value="out">Ease-Out</option>
				<option value="in">Ease-In</option>
				<option value="inout">Ease-In-Out</option>
				<option value="linear">Linear</option>
			</select>
		</div>
		<label class="checkbox-label">
			<input type="checkbox" bind:checked={mirror} />
			<span>Mirror</span>
		</label>
	</div>

	<div class="row preview-row">
		<div class="preview-container">
			<div class="preview" style:background={cssGradient}></div>
		</div>
	</div>

	<div class="row">
		<button onclick={exportSVG}>Export SVG</button>
		<button class="lottie-btn" onclick={exportLottie}>Export Lottie</button>
	</div>

	<textarea class="json-output" readonly value={jsonOutput}></textarea>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem;
		gap: 1.5rem;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.controls {
		background: var(--color-surface);
		padding: 1rem 1.5rem;
		border-radius: var(--radius-large);
		border: 1px solid var(--color-border);
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.control-group label {
		font-size: 0.75rem;
		color: var(--color-muted-foreground);
		font-weight: 500;
	}

	.color-alpha {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	input[type='color'] {
		border: none;
		width: 36px;
		height: 36px;
		border-radius: var(--radius);
		cursor: pointer;
		padding: 0;
		background: transparent;
	}

	input[type='color']::-webkit-color-swatch-wrapper { padding: 0; }
	input[type='color']::-webkit-color-swatch { border: none; border-radius: var(--radius); }

	input[type='number'], select {
		padding: 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-size: 0.875rem;
		width: 90px;
	}

	.alpha { width: 50px; }

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		cursor: pointer;
		font-size: 0.875rem;
		align-self: flex-end;
		padding-bottom: 0.25rem;
	}

	.preview-container {
		width: 200px;
		height: 200px;
		border-radius: var(--radius-large);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
		background-image: linear-gradient(45deg, #ddd 25%, transparent 25%), linear-gradient(135deg, #ddd 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ddd 75%), linear-gradient(135deg, transparent 75%, #ddd 75%);
		background-size: 20px 20px;
		background-position: 0 0, 10px 0, 10px -10px, 0px 10px;
		background-color: #fff;
		overflow: hidden;
	}

	.preview { width: 100%; height: 100%; }

	.lottie-btn {
		background-color: #00c1a2;
	}

	.lottie-btn:hover {
		background-color: #00a086;
	}

	.json-output {
		width: 100%;
		max-width: 780px;
		height: 250px;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		padding: 1rem;
		border-radius: var(--radius-large);
		border: none;
		background-color: #1e1e1e;
		color: #d4d4d4;
		resize: vertical;
	}
</style>
