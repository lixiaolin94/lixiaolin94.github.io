import { Link } from 'react-router';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const tools = [
  ['timing', 'Spring Converter', 'Translate spring parameters across platforms'],
  ['path-interpolator', 'Path Interpolator', 'Convert Android pathInterpolator XML to SVG path data'],
  ['scroll-target', 'Scroll Target Calculator', 'Calculate fling scroll distance across Android and iOS'],
  ['blur-to-gradient', 'Blur to Gradient', 'Generate smooth gradients with Gaussian easing'],
  ['lottie-base64', 'Lottie Image to Base64', 'Embed images as Base64 in Lottie JSON files']
] as const;

export function Component() {
  useDocumentTitle('Tools | Xiaolin');

  return (
    <main className="list-page">
      <h1>Tools</h1>
      <ul className="link-list">
        {tools.map(([slug, name, description]) => (
          <li key={slug}>
            <Link className="link-card" to={`/tools/${slug}`}>
              <span className="link-card-title">{name}</span>
              <span className="link-card-description">{description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
