import { Link } from 'react-router';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const posts = [
  {
    slug: 'hello-world',
    title: 'Hello World',
    date: '2026-03-02',
    description: 'First post on the new site.'
  }
];

export function Component() {
  useDocumentTitle('Blog | Xiaolin');

  return (
    <main className="blog-list">
      <h1>Blog</h1>
      <ul className="blog-post-list">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link className="blog-post-link" to={`/blog/${post.slug}`}>
              <time className="blog-meta" dateTime={post.date}>
                {post.date}
              </time>
              <span>{post.title}</span>
            </Link>
            {post.description ? <p className="blog-meta">{post.description}</p> : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
