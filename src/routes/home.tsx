import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function Component() {
  useDocumentTitle('Xiaolin');

  return <h1 className="home-title">Hi, <br />I&apos;m Xiaolin.</h1>;
}
