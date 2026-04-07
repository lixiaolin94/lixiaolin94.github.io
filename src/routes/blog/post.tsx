import { Navigate, useParams } from 'react-router';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const post = {
  slug: 'hello-world',
  title: 'Hello World',
  date: '2026-03-02',
  description: 'First post on the new site.'
};

export function Component() {
  const { slug } = useParams();

  if (slug !== post.slug) {
    return <Navigate to="/404" replace />;
  }

  useDocumentTitle(`${post.title} | Xiaolin`);

  return (
    <article className="article-page">
      <header className="article-header stack">
        <h1>{post.title}</h1>
        <time className="blog-meta" dateTime={post.date}>
          {post.date}
        </time>
      </header>
      <div className="article-body">
        <p>This is the first post on my rebuilt site.</p>
        <p>The blog now supports a simple React route setup while the rest of the migration continues.</p>
        <h2>What&apos;s new</h2>
        <ul>
          <li>A clean, minimal homepage</li>
          <li>Tools rewritten as React routes</li>
          <li>A blog route that can be expanded later</li>
          <li>Static SPA deployment for Cloudflare Pages</li>
        </ul>
      </div>
    </article>
  );
}
