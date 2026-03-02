<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import InputSlider from '$lib/components/InputSlider.svelte';
	import CodeSnippet from '$lib/components/CodeSnippet.svelte';
	import { SPRING_INPUT_TYPES } from '$lib/timing/constants';
	import { springConverter, calculateDampingRatio, convertStiffnessToResponse, convertDampingRatioToBounce, estimateSpringAnimationDuration, calculatePeakTime, generateLinearTiming } from '$lib/timing/converter';
	import { SpringSolver } from '$lib/timing/solver';
	import { Animator } from '$lib/timing/animator';
	import { outputTemplates } from '$lib/timing/templates';
	import { round } from '$lib/utils/math';
	import { getCSSVariable } from '$lib/utils/css';

	let currentType = $state('figma');
	let currentInputs = $state(
		Object.fromEntries(SPRING_INPUT_TYPES['figma'].params.map(p => [p.value, p.defaultValue]))
	);
	let canvas;
	let previewObject;
	let graphContainer;
	let animator;
	let DPR = 1;

	const typeGroups = $derived.by(() => {
		const groups = {};
		for (const [key, { group, name }] of Object.entries(SPRING_INPUT_TYPES)) {
			(groups[group] = groups[group] || []).push({ key, name });
		}
		return groups;
	});

	const currentParams = $derived(SPRING_INPUT_TYPES[currentType]?.params || []);

	const spring = $derived.by(() => {
		const physicalSpring = springConverter[currentType]?.(currentInputs);
		if (!physicalSpring) return null;

		const { mass, stiffness, damping, initialVelocity } = physicalSpring;
		const dampingRatio = calculateDampingRatio(mass, stiffness, damping);
		const response = convertStiffnessToResponse(stiffness, mass);
		const bounce = convertDampingRatioToBounce(dampingRatio);
		let duration = estimateSpringAnimationDuration(stiffness, dampingRatio, initialVelocity, 1, 0.001);
		duration = Math.min(duration, 99.999);

		const solver = SpringSolver(mass, stiffness, damping, initialVelocity);
		let peakTime = calculatePeakTime(mass, stiffness, damping);
		let peakValue = solver(peakTime);
		if (dampingRatio >= 1) { peakTime = duration; peakValue = 1; }

		const cssLinear = generateLinearTiming(solver, duration * 1000, 0.001);

		return { mass, stiffness, damping, dampingRatio, response, bounce, duration, solver, cssLinear, peak: { time: peakTime, value: peakValue } };
	});

	function initInputs(type) {
		const inputs = {};
		SPRING_INPUT_TYPES[type]?.params.forEach((p) => { inputs[p.value] = p.defaultValue; });
		currentInputs = inputs;
	}

	function handleTypeChange(e) {
		currentType = e.target.value;
		initInputs(currentType);
		updateURL();
	}

	function handleSliderInput(paramKey, value) {
		currentInputs = { ...currentInputs, [paramKey]: value };
		updateURL();
	}

	function updateURL() {
		if (!browser) return;
		const params = new URLSearchParams();
		params.set('type', currentType);
		currentParams.forEach((p) => {
			if (currentInputs[p.value] !== undefined) params.set(p.value, String(currentInputs[p.value]));
		});
		goto(`?${params.toString()}`, { replaceState: true, keepFocus: true, noScroll: true });
	}

	function loadFromURL() {
		const params = page.url.searchParams;
		const type = params.get('type');
		if (type && SPRING_INPUT_TYPES[type]) {
			currentType = type;
			const inputs = {};
			SPRING_INPUT_TYPES[type].params.forEach((p) => {
				const v = params.get(p.value);
				inputs[p.value] = v !== null ? parseFloat(v) : p.defaultValue;
			});
			currentInputs = inputs;
		} else {
			initInputs(currentType);
		}
	}

	let copied = $state(false);
	async function copyLink() {
		if (!browser) return;
		await navigator.clipboard.writeText(window.location.href);
		copied = true;
		setTimeout(() => { copied = false; }, 1000);
	}

	// Canvas drawing
	function drawGraph() {
		if (!canvas || !spring) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const LINE_WIDTH = DPR * 1.25;
		const rect = canvas.getBoundingClientRect();
		const w = rect.width * DPR;
		const h = rect.height * DPR;
		canvas.width = w;
		canvas.height = h;
		const safeH = h - LINE_WIDTH;

		ctx.lineWidth = LINE_WIDTH;
		ctx.clearRect(0, 0, w, h);

		// Reference line
		const refColor = getCSSVariable('--color-ring');
		ctx.beginPath();
		ctx.setLineDash([5, 5]);
		ctx.strokeStyle = refColor;
		ctx.moveTo(0, h / 2);
		ctx.lineTo(w, h / 2);
		ctx.stroke();
		ctx.setLineDash([]);

		// Spring curve
		const pathColor = getCSSVariable('--color-primary');
		ctx.strokeStyle = pathColor;
		ctx.beginPath();
		ctx.moveTo(0, h);
		for (let i = 0; i < w; i++) {
			const x = i / (safeH * 0.5);
			const y = spring.solver(x);
			ctx.lineTo(i, (1 - y * 0.5) * safeH + LINE_WIDTH * 0.5);
		}
		ctx.stroke();

		// Peak point
		const highlightColor = getCSSVariable('--color-destructive');
		const peakY = (1 - spring.peak.value * 0.5) * safeH + LINE_WIDTH * 0.5;
		const peakX = spring.peak.time * (safeH * 0.5);

		ctx.beginPath();
		ctx.fillStyle = highlightColor;
		ctx.arc(peakX, peakY, 2 * DPR, 0, Math.PI * 2);
		ctx.fill();

		ctx.fillStyle = highlightColor;
		ctx.font = `${0.75 * DPR}rem monospace`;
		const textX = Math.min(160 * DPR, peakX);
		const textY = Math.max(14 * DPR, peakY - 8 * DPR);
		ctx.fillText(`(${spring.peak.time.toFixed(2)}, ${spring.peak.value.toFixed(2)})`, textX, textY);
	}

	function playPreview() {
		if (!spring || !previewObject || !canvas) return;
		const rect = canvas.getBoundingClientRect();
		const translateY = rect.height * 0.5 - 1;

		animator.solver = spring.solver;
		animator.stop();
		previewObject.style.transform = `translateY(${translateY}px)`;

		animator.start((value) => {
			const v = translateY * (1 - value) + 0 * value;
			previewObject.style.transform = `translateY(${v}px)`;
		});
	}

	function handleSliderMouseDown() {
		animator?.stop();
		if (previewObject && canvas) {
			const rect = canvas.getBoundingClientRect();
			previewObject.style.transform = `translateY(${rect.height * 0.5 - 1}px)`;
		}
	}

	$effect(() => {
		if (spring && canvas) drawGraph();
	});

	onMount(() => {
		DPR = window.devicePixelRatio || 1;
		animator = new Animator(SpringSolver(1, 100, 10, 0));
		loadFromURL();
	});

	// Group outputs by platform
	const groupedOutputs = $derived.by(() => {
		const groups = {};
		for (const tmpl of outputTemplates) {
			(groups[tmpl.platform] = groups[tmpl.platform] || []).push(tmpl);
		}
		return groups;
	});
</script>

<svelte:head>
	<title>Timing | Xiaolin's Tool</title>
	<meta name="description" content="Convert and visualize spring animation parameters across different platforms." />
</svelte:head>

<main>
	<div class="output-container">
		{#each Object.entries(groupedOutputs) as [platform, templates]}
			<div>
				<h2>{platform}</h2>
				<div class="output-snippets">
					{#each templates as tmpl}
						{#if spring}
							<CodeSnippet language={tmpl.language} api={tmpl.api} link={tmpl.link}>
								{tmpl.render(spring, spring.cssLinear)}
							</CodeSnippet>
						{/if}
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<div class="input-container">
		<header>
			<h1>Spring Converter</h1>
			<p>Translate spring parameters across platforms.</p>
			<div class="author">
				<div class="social-links">
					<a class="icon" href="https://x.com/niloa_i" target="_blank">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
					</a>
					<a class="icon" href="https://github.com/lixiaolin94" target="_blank">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
					</a>
				</div>
				<button class="secondary" onclick={copyLink}>{copied ? 'Copied!' : 'Copy Link'}</button>
			</div>
		</header>

		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="graph-container" bind:this={graphContainer} onclick={playPreview}>
			<canvas class="graph" bind:this={canvas}></canvas>
			<div class="graph-preview">
				<div class="graph-preview-object" bind:this={previewObject}></div>
			</div>
		</div>

		<select value={currentType} onchange={handleTypeChange}>
			{#each Object.entries(typeGroups) as [group, types]}
				<optgroup label={group}>
					{#each types as { key, name }}
						<option value={key}>{name}</option>
					{/each}
				</optgroup>
			{/each}
		</select>

		<div class="input-fields">
			{#each currentParams as param (param.value)}
				<InputSlider
					label={param.label}
					value={currentInputs[param.value] ?? param.defaultValue}
					min={param.min}
					max={param.max}
					step={param.step}
					oninput={(v) => handleSliderInput(param.value, v)}
					onmousedown={handleSliderMouseDown}
					onmouseup={playPreview}
				/>
			{/each}
		</div>
	</div>
</main>

<style>
	main {
		width: 100%;
		max-width: 64rem;
		min-height: 100vh;
		margin-left: auto;
		margin-right: auto;
		display: grid;
		grid-template-columns: 1fr 20rem;
	}

	.author {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}

	.social-links {
		display: flex;
		gap: 0.5rem;
	}

	.input-container,
	.output-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding-inline: 1rem;
	}

	.input-container {
		position: sticky;
		top: 0;
		max-height: 100vh;
		overflow-y: auto;
	}

	.graph-container {
		display: grid;
		grid-template-columns: 1fr 2rem;
		gap: 0.5rem;
		overflow: hidden;
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-large);
		cursor: pointer;
	}

	.graph-preview {
		margin: 0.5rem;
		padding: 0.2rem;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: var(--color-muted);
		border-radius: var(--radius-full);
		overflow: hidden;
	}

	.graph-preview-object {
		width: 100%;
		height: 2px;
		border-radius: 1px;
		background-color: var(--color-destructive);
	}

	.graph {
		margin: 0.5rem;
		width: 100%;
		aspect-ratio: 1;
	}

	.input-fields {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.output-container {
		padding-block-end: 4rem;
		overflow-x: auto;
	}

	.output-snippets {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
