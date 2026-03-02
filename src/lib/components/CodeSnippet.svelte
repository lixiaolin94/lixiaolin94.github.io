<script>
	import { browser } from '$app/environment';

	let { title = '', api = '', link = '#', language = '', children } = $props();

	let copied = $state(false);
	let contentEl;

	async function copyToClipboard() {
		if (!browser || !contentEl) return;
		const text = contentEl.textContent || '';
		await navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 1000);
	}
</script>

<div class="code-snippet">
	<div class="header">
		<div class="left-section">
			{#if title}
				<span class="title">{title}</span>
			{/if}
			{#if api}
				<a class="api" href={link} target="_blank">{api}</a>
			{/if}
		</div>
		<div class="right-section">
			{#if language}
				<span class="language">{language}</span>
			{/if}
			<button class="copy-button" onclick={copyToClipboard} title="Copy to clipboard">
				{#if copied}
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 15 2 2 4-4"/><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
				{:else}
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
				{/if}
			</button>
		</div>
	</div>
	<pre class="content"><code bind:this={contentEl}>{#if children}{@render children()}{/if}</code></pre>
</div>

<style>
	.code-snippet {
		display: block;
		overflow: hidden;
		font-family: var(--font-mono);
		font-size: 0.875rem;
		border-radius: var(--radius-large);
		border: 1px solid var(--color-border);
		background-color: var(--color-surface);
		color: var(--color-muted-foreground);
	}

	.api {
		color: var(--color-accent);
	}

	.header {
		height: 2.25rem;
		padding-inline-start: 1rem;
		padding-inline-end: 0.25rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: var(--color-muted);
	}

	.title {
		color: var(--color-foreground);
	}

	.left-section {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.right-section {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.language {
		user-select: none;
		padding-inline: 0.5rem;
		padding-block: 0.25rem;
		font-size: 0.75rem;
		background-color: var(--color-surface);
		border-radius: var(--radius-small);
	}

	.copy-button {
		width: 1.75rem;
		height: 1.75rem;
		padding: 0;
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		display: flex;
		justify-content: center;
		align-items: center;
		transition: color 0.1s;
	}

	.copy-button:hover {
		color: var(--color-primary);
		background-color: transparent;
	}

	.content {
		margin: 0;
		padding: 1rem;
		line-height: 1.5;
		overflow-x: auto;
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.content::-webkit-scrollbar {
		display: none;
	}
</style>
