import { Link } from 'react-router';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const demos = [
  ['squircles', 'Squircles', 'Smooth corner rounding with configurable smoothness'],
  ['rounded-polygon', 'Rounded Polygon', 'Polygon corner rounding with cubic Bezier curves'],
  ['voice-visualizer', 'Voice Visualizer', 'WebGL audio-reactive blob inspired by OpenAI voice UI']
] as const;

export function Component() {
  useDocumentTitle('Demos | Xiaolin');

  return (
    <main className="list-page">
      <h1>Demos</h1>
      <ul className="link-list">
        {demos.map(([slug, name, description]) => (
          <li key={slug}>
            <Link className="link-card" to={`/demos/${slug}`}>
              <span className="link-card-title">{name}</span>
              <span className="link-card-description">{description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
