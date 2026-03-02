<svelte:head>
	<title>Tools | Xiaolin</title>
</svelte:head>

<div class="list-page">
	<h1>Tools</h1>
	<ul>
		<li>
			<a href="/tools/timing">
				<span class="name">Spring Converter</span>
				<span class="desc">Translate spring parameters across platforms</span>
			</a>
		</li>
		<li>
			<a href="/tools/path-interpolator">
				<span class="name">Path Interpolator</span>
				<span class="desc">Convert Android pathInterpolator XML to SVG path data</span>
			</a>
		</li>
		<li>
			<a href="/tools/calculate-scroll-target">
				<span class="name">Scroll Target Calculator</span>
				<span class="desc">Calculate fling scroll distance across Android &amp; iOS</span>
			</a>
		</li>
		<li>
			<a href="/tools/blur-to-gradient">
				<span class="name">Blur to Gradient</span>
				<span class="desc">Generate smooth gradients with Gaussian easing</span>
			</a>
		</li>
		<li>
			<a href="/tools/lottie-image-to-base64">
				<span class="name">Lottie Image to Base64</span>
				<span class="desc">Embed images as Base64 in Lottie JSON files</span>
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
