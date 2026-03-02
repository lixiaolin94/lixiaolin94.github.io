export async function load() {
	const modules = import.meta.glob('/src/content/blog/*.md', { eager: true });

	const posts = Object.entries(modules)
		.map(([path, module]) => {
			const slug = path.split('/').pop().replace('.md', '');
			return {
				slug,
				title: module.metadata.title,
				date: module.metadata.date,
				description: module.metadata.description ?? ''
			};
		})
		.sort((a, b) => (a.date > b.date ? -1 : 1));

	return { posts };
}
