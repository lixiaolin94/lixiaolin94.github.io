<script>
	const { data } = $props();
</script>

<svelte:head>
	<title>Blog</title>
</svelte:head>

<div class="blog-list">
	<h1>Blog</h1>
	{#if data.posts.length === 0}
		<p class="empty">No posts yet.</p>
	{:else}
		<ul>
			{#each data.posts as post}
				<li>
					<a href="/blog/{post.slug}">
						<time datetime={post.date}>{post.date}</time>
						<span class="title">{post.title}</span>
					</a>
					{#if post.description}
						<p class="description">{post.description}</p>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.blog-list {
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
		gap: 1.5rem;
	}

	li a {
		display: flex;
		gap: 1rem;
		align-items: baseline;
		text-decoration: none;
	}

	time {
		font-size: 0.875rem;
		color: var(--color-text-secondary, #666);
		white-space: nowrap;
	}

	.title {
		font-size: 1.125rem;
		font-weight: 500;
	}

	.description {
		margin: 0.25rem 0 0;
		font-size: 0.875rem;
		color: var(--color-text-secondary, #666);
	}

	.empty {
		color: var(--color-text-secondary, #666);
	}
</style>
