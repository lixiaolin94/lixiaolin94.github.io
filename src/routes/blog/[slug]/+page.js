export async function load({ params }) {
	const modules = import.meta.glob('/src/content/blog/*.md');
	const match = modules[`/src/content/blog/${params.slug}.md`];

	if (!match) {
		throw new Error(`Post not found: ${params.slug}`);
	}

	const post = await match();

	return {
		content: post.default,
		metadata: post.metadata
	};
}
