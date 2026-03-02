<script>
	import { onMount, onDestroy } from 'svelte';
	import { drawRoundRect, drawQuadSmoothRoundRect, drawSmoothRoundRect } from '$lib/demos/squircle';

	let canvas;
	let paneContainer;
	let paneInstance = null;
	let resizeHandler = null;

	onDestroy(() => {
		if (typeof document === 'undefined') return;
		if (resizeHandler) window.removeEventListener('resize', resizeHandler);
		if (paneInstance) { paneInstance.dispose(); paneInstance = null; }
		document.body.style.overflow = '';
		document.body.style.margin = '';
	});

	onMount(async () => {
		const { Pane } = await import('tweakpane');
		const ctx = canvas.getContext('2d');
		const dpr = window.devicePixelRatio || 1;

		const view = { left: 40, top: 40, right: 400, bottom: 400, radius: 80 };
		const config = {
			drawRoundRect: true, roundRectColor: '#ec6b2e',
			drawQuadSmoothRoundRect: false, quadColor: '#7b61ff',
			drawSmoothRoundRect: true, smoothCornersColor: '#1bc47d',
			smoothness: 0.6, alpha: 0.8, outline: false, lineWidth: 1
		};

		let referenceImage = null;

		function hex2rgba(hex, alpha = 1) {
			const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16));
			return `rgba(${r},${g},${b},${alpha})`;
		}

		function draw() {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			if (referenceImage) { ctx.save(); ctx.drawImage(referenceImage, view.left, view.top); ctx.restore(); }
			ctx.lineWidth = config.lineWidth;

			const shapes = [
				{ enabled: config.drawRoundRect, method: drawRoundRect, color: config.roundRectColor, extra: [] },
				{ enabled: config.drawQuadSmoothRoundRect, method: drawQuadSmoothRoundRect, color: config.quadColor, extra: [] },
				{ enabled: config.drawSmoothRoundRect, method: drawSmoothRoundRect, color: config.smoothCornersColor, extra: [config.smoothness] }
			];

			for (const shape of shapes) {
				if (!shape.enabled) continue;
				shape.method(ctx, view.left, view.top, view.right, view.bottom, view.radius, ...shape.extra);
				if (config.outline) { ctx.strokeStyle = hex2rgba(shape.color, config.alpha); ctx.stroke(); }
				else { ctx.fillStyle = hex2rgba(shape.color, config.alpha); ctx.fill(); }
			}
		}

		function handleResize() {
			canvas.width = window.innerWidth * dpr;
			canvas.height = window.innerHeight * dpr;
			canvas.style.width = window.innerWidth + 'px';
			canvas.style.height = window.innerHeight + 'px';
			ctx.scale(dpr, dpr);
			draw();
		}

		const pane = new Pane({ title: 'Squircle', container: paneContainer });
		paneInstance = pane;
		resizeHandler = handleResize;
		pane.addBinding(view, 'left'); pane.addBinding(view, 'top');
		pane.addBinding(view, 'right'); pane.addBinding(view, 'bottom');
		pane.addBinding(view, 'radius', { min: 0 }); pane.addBlade({ view: 'separator' });
		pane.addBinding(config, 'drawRoundRect'); pane.addBinding(config, 'roundRectColor');
		pane.addBlade({ view: 'separator' });
		pane.addBinding(config, 'drawQuadSmoothRoundRect'); pane.addBinding(config, 'quadColor');
		pane.addBlade({ view: 'separator' });
		pane.addBinding(config, 'drawSmoothRoundRect');
		pane.addBinding(config, 'smoothness', { min: 0, max: 1 });
		pane.addBinding(config, 'smoothCornersColor');
		pane.addBlade({ view: 'separator' });
		pane.addBinding(config, 'alpha', { min: 0, max: 1 });
		pane.addBinding(config, 'outline'); pane.addBinding(config, 'lineWidth', { min: 0 });
		pane.on('change', draw);

		window.addEventListener('resize', handleResize);
		handleResize();

		return () => {
			window.removeEventListener('resize', handleResize);
			pane.dispose();
			paneInstance = null;
		};
	});
</script>

<svelte:head><title>Squircles | Xiaolin's Demo</title></svelte:head>

<canvas bind:this={canvas}></canvas>
<div class="pane" bind:this={paneContainer}></div>

<style>
	:global(body) { margin: 0; overflow: hidden; }
	canvas { display: block; }
	.pane { position: fixed; top: 10px; right: 10px; width: 360px; }
</style>
