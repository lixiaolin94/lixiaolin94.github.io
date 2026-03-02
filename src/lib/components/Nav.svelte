<script>
	import { page } from '$app/state';
</script>

<nav>
	<a href="/" class:active={page.url.pathname === '/'}>Xiaolin</a>
	<div class="links">
		<a href="/tools" class:active={page.url.pathname.startsWith('/tools')}>Tools</a>
		<a href="/demos" class:active={page.url.pathname.startsWith('/demos')}>Demos</a>
		<a href="/blog" class:active={page.url.pathname.startsWith('/blog')}>Blog</a>
	</div>
</nav>

<style>
	nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		font-size: 0.875rem;
	}

	nav a {
		text-decoration: none;
		color: var(--color-muted-foreground);
		transition: color 0.1s;
	}

	nav a:hover,
	nav a.active {
		color: var(--color-foreground);
	}

	.links {
		display: flex;
		gap: 1.5rem;
	}
</style>
