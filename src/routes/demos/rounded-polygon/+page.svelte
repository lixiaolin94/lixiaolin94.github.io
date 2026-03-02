<script>
	import { onMount, onDestroy } from 'svelte';

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
		// Dynamic import of the large RoundedPolygon module
		const { RoundedPolygon, CornerRounding, verticesFromNumVerts } = await import('$lib/demos/RoundedPolygon');

		const dpr = window.devicePixelRatio || 1;
		const ctx = canvas.getContext('2d');

		const PARAMS = { vertices: 4, radius: 256, cornerRadius: 80, smoothing: 0.6, rotation: 45, color: '#CCCCCC', outline: false, debug: false };

		function drawPoint(x, y, r) {
			ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
		}

		function render() {
			const centerX = (canvas.width / dpr) * 0.5;
			const centerY = (canvas.height / dpr) * 0.5;
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			const rounding = new CornerRounding(PARAMS.cornerRadius, PARAMS.smoothing);
			const baseVertices = verticesFromNumVerts(PARAMS.vertices, PARAMS.radius, 0, 0);

			const rotationRadians = (PARAMS.rotation * Math.PI) / 180;
			const rotatedVertices = new Array(baseVertices.length);
			for (let i = 0; i < baseVertices.length; i += 2) {
				const x = baseVertices[i], y = baseVertices[i + 1];
				rotatedVertices[i] = x * Math.cos(rotationRadians) - y * Math.sin(rotationRadians) + centerX;
				rotatedVertices[i + 1] = x * Math.sin(rotationRadians) + y * Math.cos(rotationRadians) + centerY;
			}

			const polygon = RoundedPolygon.fromVertices(rotatedVertices, rounding, null, centerX, centerY);
			const cubics = polygon.cubics;

			ctx.beginPath();
			if (cubics.length > 0) {
				ctx.moveTo(cubics[0].anchor0X, cubics[0].anchor0Y);
				for (const cubic of cubics) {
					ctx.bezierCurveTo(cubic.control0X, cubic.control0Y, cubic.control1X, cubic.control1Y, cubic.anchor1X, cubic.anchor1Y);
				}
			}
			ctx.closePath();

			if (PARAMS.outline) { ctx.strokeStyle = PARAMS.color; ctx.lineWidth = 0.5 * dpr; ctx.stroke(); }
			else { ctx.fillStyle = PARAMS.color; ctx.fill(); }

			if (PARAMS.debug) {
				const LINE_WIDTH = 0.5 * dpr;
				const POINT_RADIUS = 1.5 * dpr;
				for (const cubic of cubics) {
					ctx.strokeStyle = 'green'; ctx.lineWidth = LINE_WIDTH;
					ctx.beginPath(); ctx.moveTo(cubic.anchor0X, cubic.anchor0Y); ctx.lineTo(cubic.control0X, cubic.control0Y); ctx.stroke();
					ctx.beginPath(); ctx.moveTo(cubic.anchor1X, cubic.anchor1Y); ctx.lineTo(cubic.control1X, cubic.control1Y); ctx.stroke();
					ctx.fillStyle = 'red'; drawPoint(cubic.anchor0X, cubic.anchor0Y, POINT_RADIUS); drawPoint(cubic.anchor1X, cubic.anchor1Y, POINT_RADIUS);
					ctx.fillStyle = 'green'; drawPoint(cubic.control0X, cubic.control0Y, POINT_RADIUS); drawPoint(cubic.control1X, cubic.control1Y, POINT_RADIUS);
				}
			}
		}

		function handleResize() {
			canvas.style.width = window.innerWidth + 'px';
			canvas.style.height = window.innerHeight + 'px';
			canvas.width = window.innerWidth * dpr;
			canvas.height = window.innerHeight * dpr;
			ctx.scale(dpr, dpr);
			render();
		}

		window.addEventListener('resize', handleResize);
		handleResize();

		const pane = new Pane({ container: paneContainer });
		paneInstance = pane;
		resizeHandler = handleResize;
		pane.addBinding(PARAMS, 'vertices', { min: 3, step: 1 });
		pane.addBinding(PARAMS, 'radius', { min: 0 });
		pane.addBinding(PARAMS, 'cornerRadius', { min: 0 });
		pane.addBinding(PARAMS, 'smoothing', { min: 0, max: 1 });
		pane.addBinding(PARAMS, 'rotation');
		pane.addBinding(PARAMS, 'color');
		pane.addBinding(PARAMS, 'outline');
		pane.addBinding(PARAMS, 'debug');
		pane.on('change', render);

		return () => {
			window.removeEventListener('resize', handleResize);
			pane.dispose();
			paneInstance = null;
		};
	});
</script>

<svelte:head><title>Rounded Polygon | Xiaolin's Demo</title></svelte:head>

<canvas bind:this={canvas}></canvas>
<div class="pane" bind:this={paneContainer}></div>

<style>
	:global(body) { margin: 0; overflow: hidden; }
	canvas { display: block; }
	.pane { position: fixed; top: 10px; right: 10px; width: 300px; }
</style>
