<svelte:head>
	<title>Demos | Xiaolin</title>
</svelte:head>

<div class="list-page">
	<h1>Demos</h1>
	<ul>
		<li>
			<a href="/demos/squircles">
				<span class="name">Squircles</span>
				<span class="desc">Smooth corner rounding with configurable smoothness</span>
			</a>
		</li>
		<li>
			<a href="/demos/rounded-polygon">
				<span class="name">Rounded Polygon</span>
				<span class="desc">Polygon corner rounding with cubic Bézier curves</span>
			</a>
		</li>
		<li>
			<a href="/demos/openai-voice-visualizer">
				<span class="name">Voice Visualizer</span>
				<span class="desc">WebGL audio-reactive blob inspired by OpenAI voice UI</span>
			</a>
		</li>
	</ul>
</div>

<style>
	.list-page {
		max-width: 640px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	h1 {
		margin-bottom: 2rem;
	}

	ul {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	li a {
		display: block;
		padding: 1rem;
		border-radius: var(--radius-large, 0.75rem);
		border: 1px solid var(--color-border);
		text-decoration: none;
		transition: border-color 0.15s;
	}

	li a:hover {
		border-color: var(--color-foreground);
	}

	.name {
		display: block;
		font-weight: 500;
		font-size: 1.05rem;
		color: var(--color-foreground);
	}

	.desc {
		display: block;
		margin-top: 0.25rem;
		font-size: 0.875rem;
		color: var(--color-muted-foreground);
	}
</style>
