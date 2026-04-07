import { Link } from 'react-router';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function Component() {
  useDocumentTitle('404 | Xiaolin');

  return (
    <main className="tool-page stack">
      <h1>404</h1>
      <p className="muted">This page does not exist.</p>
      <div>
        <Link to="/">Back home</Link>
      </div>
    </main>
  );
}
