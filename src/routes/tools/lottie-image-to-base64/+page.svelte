<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let dragOver = $state(false);
	let showDialog = $state(false);
	let currentBlob = $state(null);
	let currentFileName = $state(null);
	let previewContainer;
	let lottieAnim = null;
	let fileInput;

	const IGNORED_PATTERNS = ['__MACOSX', '.DS_Store', 'Thumbs.db', 'desktop.ini', '._'];

	function shouldIgnoreFile(path) {
		return IGNORED_PATTERNS.some((p) => path.includes(p));
	}

	function getMimeType(filename) {
		const ext = filename.split('.').pop()?.toLowerCase();
		const types = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml' };
		return types[ext || ''] || 'application/octet-stream';
	}

	function compressJSON(json) {
		if (Array.isArray(json)) return json.map(compressJSON);
		if (typeof json === 'object' && json !== null) {
			const obj = {};
			for (const key in json) {
				if (key === 'p' && typeof json[key] === 'string' && json[key].startsWith('data:')) {
					obj[key] = json[key].replace(/[\r\n\s]+/g, '');
				} else {
					obj[key] = compressJSON(json[key]);
				}
			}
			return obj;
		}
		return json;
	}

	async function processZipFile(file) {
		if (!browser) return;
		try {
			const JSZip = (await import('jszip')).default;
			const zip = new JSZip();
			const contents = await zip.loadAsync(file);

			let jsonFile = null, jsonFileName = '';
			const imagesFolder = {};

			for (const [path, zipEntry] of Object.entries(contents.files)) {
				if (shouldIgnoreFile(path) || zipEntry.dir) continue;
				if (path.toLowerCase().endsWith('.json')) {
					if (jsonFile) throw new Error('Multiple JSON files found');
					jsonFile = zipEntry;
					jsonFileName = path;
				} else if (path.startsWith('images/')) {
					const ext = path.split('.').pop()?.toLowerCase() || '';
					if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
						imagesFolder[path] = zipEntry;
					}
				}
			}

			if (!jsonFile) throw new Error('JSON file not found');
			if (!Object.keys(imagesFolder).length) throw new Error('No image files found');

			let jsonText = await jsonFile.async('string');
			jsonText = jsonText.replace(/^\uFEFF/, '').trim();
			const jsonContent = JSON.parse(jsonText);

			if (!jsonContent.assets || !Array.isArray(jsonContent.assets)) throw new Error('Invalid Lottie format');

			let processedImages = 0;
			for (const asset of jsonContent.assets) {
				if (asset.u === 'images/' && asset.p) {
					const imageFile = imagesFolder[`images/${asset.p}`];
					if (imageFile) {
						const buf = await imageFile.async('arraybuffer');
						const base64 = btoa(new Uint8Array(buf).reduce((d, b) => d + String.fromCharCode(b), ''));
						asset.u = '';
						asset.p = `data:${getMimeType(asset.p)};base64,${base64}`;
						asset.e = 1;
						processedImages++;
					}
				}
			}

			if (!processedImages) throw new Error('No images processed');

			const compressed = compressJSON(jsonContent);
			const blob = new Blob([JSON.stringify(compressed)], { type: 'application/json' });
			currentBlob = blob;
			currentFileName = jsonFileName.replace('.json', '-compressed.json');
			showDialog = true;

			// Load animation preview
			const lottie = (await import('lottie-web')).default;
			if (lottieAnim) lottieAnim.destroy();
			const reader = new FileReader();
			reader.onload = (e) => {
				try {
					const animData = JSON.parse(e.target.result);
					lottieAnim = lottie.loadAnimation({
						container: previewContainer,
						renderer: 'svg',
						loop: true,
						autoplay: true,
						animationData: animData
					});
				} catch {}
			};
			reader.readAsText(blob);
		} catch (error) {
			console.error(error.message);
		}
	}

	function download() {
		if (!currentBlob || !currentFileName) return;
		const url = URL.createObjectURL(currentBlob);
		const a = document.createElement('a');
		a.href = url;
		a.download = currentFileName;
		a.click();
		URL.revokeObjectURL(url);
	}

	function closeDialog() {
		showDialog = false;
		currentBlob = null;
		currentFileName = null;
	}

	function handleDrop(e) {
		e.preventDefault();
		dragOver = false;
		const file = e.dataTransfer?.files[0];
		if (file && (file.type === 'application/zip' || file.name.endsWith('.zip'))) {
			processZipFile(file);
		}
	}

	function handleFileSelect(e) {
		const file = e.target.files?.[0];
		if (file) processZipFile(file);
	}
</script>

<svelte:head>
	<title>Lottie Image to Base64 | Xiaolin</title>
</svelte:head>

<div
	class="drop-zone"
	class:drag-over={dragOver}
	ondragover={(e) => { e.preventDefault(); dragOver = true; }}
	ondragleave={(e) => { e.preventDefault(); dragOver = false; }}
	ondrop={handleDrop}
	onclick={() => fileInput.click()}
	role="button"
	tabindex="0"
>
	<p>Drag and drop a ZIP file here or click to select a file.</p>
	<input bind:this={fileInput} type="file" accept=".zip" style="display: none" onchange={handleFileSelect} onclick={(e) => { e.target.value = ''; }} />
</div>

{#if showDialog}
	<div class="dialog-container">
		<div class="dialog">
			<button class="icon dialog-close-button" onclick={closeDialog}>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
			</button>
			<h3 class="dialog-title">Conversion Complete!</h3>
			<div class="dialog-content">
				<p>Your file is ready for download.</p>
				<div class="lottie-preview" bind:this={previewContainer}></div>
				<button onclick={download}>Download</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.drop-zone {
		height: calc(100vh - 4rem);
		margin: 1rem;
		border: 2px dashed var(--color-border);
		border-radius: var(--radius-large);
		cursor: pointer;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.drag-over {
		border-color: var(--color-accent);
		background-color: rgb(from var(--color-accent) r g b / 0.2);
	}

	.dialog-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background-color: rgb(from var(--color-dim) r g b / 0.5);
		z-index: 100;
	}

	.dialog {
		position: fixed;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		flex-direction: column;
		background-color: var(--color-background);
		padding: 1.5rem;
		border-radius: var(--radius-large);
	}

	.dialog-close-button {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
	}

	.dialog-title { margin: 0; }

	.dialog-content {
		display: flex;
		flex-direction: column;
		color: var(--color-muted-foreground);
	}

	.lottie-preview {
		width: 320px;
		height: 200px;
	}
</style>
