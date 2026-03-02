<script>
	const { data } = $props();
</script>

<svelte:head>
	<title>{data.metadata.title}</title>
	{#if data.metadata.description}
		<meta name="description" content={data.metadata.description} />
	{/if}
</svelte:head>

<article>
	<header>
		<h1>{data.metadata.title}</h1>
		<time datetime={data.metadata.date}>{data.metadata.date}</time>
	</header>
	<div class="prose">
		<data.content />
	</div>
</article>

<style>
	article {
		max-width: 720px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	header {
		margin-bottom: 2rem;
	}

	header h1 {
		margin-bottom: 0.5rem;
	}

	time {
		font-size: 0.875rem;
		color: var(--color-text-secondary, #666);
	}

	.prose {
		line-height: 1.7;
	}

	.prose :global(h2) {
		margin-top: 2rem;
	}

	.prose :global(pre) {
		padding: 1rem;
		border-radius: 0.5rem;
		overflow-x: auto;
		background: var(--color-surface, #f5f5f5);
	}

	.prose :global(code) {
		font-size: 0.875em;
	}

	.prose :global(img) {
		max-width: 100%;
		border-radius: 0.5rem;
	}
</style>
